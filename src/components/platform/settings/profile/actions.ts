// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use server"

import { revalidatePath } from "next/cache"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { getAccountByUserId } from "@/components/auth/account"
import { getUserByEmail } from "@/components/auth/user"
import { logger } from "@/lib/logger"

import type { ActionResult } from "../types"
import { updateProfileSchema } from "./validation"

const log = logger.forModule("settings.profile")

function fail(error: string, issues?: Record<string, string[]>): ActionResult<never> {
  return { ok: false, error, ...(issues ? { issues } : {}) }
}

export async function updateProfile(
  raw: unknown
): Promise<ActionResult<{ id: string; emailChanged: boolean }>> {
  try {
    const session = await auth()
    if (!session?.user?.id) return fail("UNAUTHENTICATED")
    const userId = session.user.id

    const parsed = updateProfileSchema.safeParse(raw)
    if (!parsed.success) {
      return fail(
        "INVALID_INPUT",
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      )
    }
    const input = parsed.data

    // OAuth users can't change their email — the upstream provider owns it.
    // Silently drop the field rather than error so the form can submit other
    // edits without an OAuth detection ping-pong.
    const oauthAccount = await getAccountByUserId(userId)
    const isOAuth = !!oauthAccount
    const desiredEmail = isOAuth ? undefined : input.email

    let emailChanged = false
    if (desiredEmail) {
      const existing = await db.user.findUnique({
        where: { id: userId },
        select: { email: true },
      })
      if (existing && existing.email !== desiredEmail) {
        const collision = await getUserByEmail(desiredEmail)
        if (collision && collision.id !== userId) {
          return fail("EMAIL_TAKEN", { email: ["Email is already in use"] })
        }
        emailChanged = true
      }
    }

    const data: Record<string, unknown> = {}
    if (input.name !== undefined) data.name = input.name
    if (desiredEmail !== undefined) {
      data.email = desiredEmail
      if (emailChanged) {
        // Force re-verification — existing session keeps the user signed in
        // for this request, but the next sign-in will require the new email
        // to be verified (matches signIn callback at src/auth.ts).
        data.emailVerified = null
      }
    }
    if (input.phone !== undefined) data.phone = input.phone === "" ? null : input.phone
    if (input.image !== undefined) data.image = input.image === "" ? null : input.image

    if (Object.keys(data).length === 0) {
      return { ok: true, data: { id: userId, emailChanged: false } }
    }

    await db.user.update({ where: { id: userId }, data })

    revalidatePath("/settings")
    return { ok: true, data: { id: userId, emailChanged } }
  } catch (err) {
    log.error("Failed to update profile", err as Error)
    return fail(err instanceof Error ? err.message : "UNKNOWN_ERROR")
  }
}
