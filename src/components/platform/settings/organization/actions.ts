// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use server"

import { revalidatePath } from "next/cache"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

import type { ActionResult } from "../types"
import { upsertCompanySettingsSchema } from "./validation"

const log = logger.forModule("settings.organization")

function fail(error: string, issues?: Record<string, string[]>): ActionResult<never> {
  return { ok: false, error, ...(issues ? { issues } : {}) }
}

function emptyToNull(value: string | undefined | null): string | null {
  if (value === undefined || value === null) return null
  const trimmed = value.trim()
  return trimmed === "" ? null : trimmed
}

export async function upsertCompanySettings(
  raw: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth()
    if (!session?.user?.id) return fail("UNAUTHENTICATED")
    const userId = session.user.id

    const parsed = upsertCompanySettingsSchema.safeParse(raw)
    if (!parsed.success) {
      return fail(
        "INVALID_INPUT",
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      )
    }
    const input = parsed.data

    // The Prisma upsert needs both create + update payloads. Shared fields are
    // derived once to keep the two paths in sync.
    const shared = {
      companyName: input.companyName,
      companyNameAr: emptyToNull(input.companyNameAr),
      taxId: emptyToNull(input.taxId),
      email: emptyToNull(input.email),
      phone: emptyToNull(input.phone),
      website: emptyToNull(input.website),
      address1: emptyToNull(input.address1),
      address2: emptyToNull(input.address2),
      city: emptyToNull(input.city),
      state: emptyToNull(input.state),
      country: input.country,
      postalCode: emptyToNull(input.postalCode),
      bankName: emptyToNull(input.bankName),
      bankBranch: emptyToNull(input.bankBranch),
      accountName: emptyToNull(input.accountName),
      accountNumber: emptyToNull(input.accountNumber),
      iban: emptyToNull(input.iban),
      swiftCode: emptyToNull(input.swiftCode),
      invoicePrefix: input.invoicePrefix,
      defaultCurrency: input.defaultCurrency,
      defaultTaxRate: input.defaultTaxRate,
      defaultPaymentTerms: input.defaultPaymentTerms,
    }

    const result = await db.companySettings.upsert({
      where: { userId },
      create: { ...shared, userId },
      update: shared,
      select: { id: true },
    })

    revalidatePath("/settings/organization")
    // Invoices embed company details in PDFs — invalidate caches that might
    // render stale header data.
    revalidatePath("/invoice")
    return { ok: true, data: { id: result.id } }
  } catch (err) {
    log.error("Failed to upsert company settings", err as Error)
    return fail(err instanceof Error ? err.message : "UNKNOWN_ERROR")
  }
}
