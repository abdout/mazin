"use server"

import crypto from "node:crypto"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { logAudit } from "@/lib/audit"
import { requireStaff } from "@/lib/auth-context"
import { requireCan } from "@/lib/authorization"

const log = logger.forModule("settings.team")

const INVITE_TTL_DAYS = 7

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "MANAGER", "CLERK", "VIEWER"]),
})

function generateToken(): string {
  return crypto.randomBytes(32).toString("base64url")
}

export async function inviteStaff(data: { email: string; role: "ADMIN" | "MANAGER" | "CLERK" | "VIEWER" }) {
  const ctx = await requireStaff()
  requireCan(ctx, "update", "team")

  const validated = inviteSchema.parse(data)

  const existing = await db.user.findUnique({ where: { email: validated.email } })
  if (existing) {
    return { success: false, error: "User with that email already exists" }
  }

  // Supersede any previous pending invite for this email.
  await db.staffInvite.updateMany({
    where: { email: validated.email, status: "PENDING" },
    data: { status: "REVOKED" },
  })

  const token = generateToken()
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000)

  const invite = await db.staffInvite.create({
    data: {
      email: validated.email,
      role: validated.role,
      token,
      expiresAt,
      invitedBy: ctx.userId,
    },
  })

  await logAudit({
    action: "RECORD_CREATE",
    actor: ctx,
    resource: "staff_invite",
    resourceId: invite.id,
    metadata: { email: validated.email, role: validated.role },
  })

  // Caller is responsible for sending the email — return the link so the
  // settings UI can display/copy it while email wiring is in progress.
  const inviteUrl = `/join/invite/${token}`
  log.info("staff invite issued", { email: validated.email, role: validated.role })

  revalidatePath("/settings/team")
  return { success: true, inviteId: invite.id, inviteUrl }
}

export async function revokeInvite(inviteId: string) {
  const ctx = await requireStaff()
  requireCan(ctx, "update", "team")

  const invite = await db.staffInvite.findUnique({ where: { id: inviteId } })
  if (!invite) return { success: false, error: "Invite not found" }
  if (invite.status !== "PENDING") {
    return { success: false, error: `Invite already ${invite.status.toLowerCase()}` }
  }

  await db.staffInvite.update({
    where: { id: inviteId },
    data: { status: "REVOKED" },
  })

  await logAudit({
    action: "RECORD_UPDATE",
    actor: ctx,
    resource: "staff_invite",
    resourceId: inviteId,
    metadata: { operation: "revoke" },
  })

  revalidatePath("/settings/team")
  return { success: true }
}

export async function listPendingInvites() {
  const ctx = await requireStaff()
  requireCan(ctx, "read", "team")

  return db.staffInvite.findMany({
    where: { status: "PENDING", expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  })
}

const acceptSchema = z.object({
  token: z.string().min(20),
  name: z.string().min(1).max(120),
  password: z.string().min(8).max(200),
})

/**
 * Consume an invite token to create a STAFF user. No auth required because
 * the token itself is the credential — must only be reachable via an opaque
 * URL the invitee received by email.
 */
export async function acceptInvite(data: { token: string; name: string; password: string }) {
  const validated = acceptSchema.parse(data)

  const invite = await db.staffInvite.findUnique({ where: { token: validated.token } })
  if (!invite) return { success: false, error: "Invalid invite" }
  if (invite.status !== "PENDING") return { success: false, error: "Invite no longer valid" }
  if (invite.expiresAt < new Date()) {
    await db.staffInvite.update({
      where: { id: invite.id },
      data: { status: "EXPIRED" },
    })
    return { success: false, error: "Invite expired" }
  }

  const existing = await db.user.findUnique({ where: { email: invite.email } })
  if (existing) return { success: false, error: "Account already exists for this email" }

  const hashedPassword = await bcrypt.hash(validated.password, 10)

  const user = await db.user.create({
    data: {
      email: invite.email,
      name: validated.name,
      password: hashedPassword,
      type: "STAFF",
      role: invite.role,
      emailVerified: new Date(), // invite email itself proves ownership
    },
  })

  await db.staffInvite.update({
    where: { id: invite.id },
    data: {
      status: "ACCEPTED",
      acceptedAt: new Date(),
      acceptedBy: user.id,
    },
  })

  await logAudit({
    action: "RECORD_CREATE",
    actor: { userId: user.id, email: user.email },
    resource: "user",
    resourceId: user.id,
    metadata: { inviteId: invite.id, role: invite.role, source: "staff_invite" },
  })

  log.info("staff invite accepted", { email: invite.email })
  return { success: true, userId: user.id }
}
