// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

const accountType = z.enum([
  "CURRENT",
  "CHECKING",
  "SAVINGS",
  "FOREIGN_CURRENCY",
  "PETTY_CASH",
] as const)

const accountStatus = z.enum(["ACTIVE", "INACTIVE", "FROZEN", "CLOSED"] as const)

const trimmedOptional = z.string().trim().max(255).optional().or(z.literal(""))

export const createBankAccountSchema = z.object({
  accountName: z.string().trim().min(1, "Account name is required").max(120),
  accountNumber: z.string().trim().min(1, "Account number is required").max(64),
  bankName: z.string().trim().min(1, "Bank name is required").max(120),
  bankBranch: trimmedOptional,
  iban: trimmedOptional,
  swiftCode: trimmedOptional,
  currency: z.enum(["SDG", "USD", "EUR", "SAR", "AED"]).default("SDG"),
  accountType: accountType.default("CURRENT"),
  status: accountStatus.default("ACTIVE"),
  openingBalance: z.number().min(-100_000_000).max(100_000_000).default(0),
  color: trimmedOptional,
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  displayOrder: z.number().int().min(0).max(1_000).default(0),
})

export const updateBankAccountSchema = createBankAccountSchema.partial()

export type CreateBankAccountInput = z.infer<typeof createBankAccountSchema>
export type UpdateBankAccountInput = z.infer<typeof updateBankAccountSchema>
