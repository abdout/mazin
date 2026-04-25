// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

// Port Sudan-era deposits are commonly in SDG with occasional USD. Prisma
// schema defaults to SDG; keep the allowed set in sync with other finance
// modules (CompanySettings.defaultCurrency).
const currencies = ["SDG", "USD", "EUR", "SAR", "AED"] as const

export const depositSchema = z.object({
  walletId: z.string().cuid(),
  amount: z.number().positive("Enter a positive amount").max(100_000_000),
  reference: z.string().trim().max(120).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
})

export const drawdownSchema = z.object({
  walletId: z.string().cuid(),
  amount: z.number().positive("Enter a positive amount").max(100_000_000),
  reference: z.string().trim().max(120).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  invoiceId: z.string().cuid().optional(),
  shipmentId: z.string().cuid().optional(),
  type: z
    .enum(["WITHDRAWAL", "INVOICE_PAYMENT", "REFUND", "DUTY_PAYMENT", "ADJUSTMENT"])
    .default("WITHDRAWAL"),
})

export const createWalletSchema = z.object({
  clientId: z.string().cuid(),
  currency: z.enum(currencies).default("SDG"),
  creditLimit: z.number().min(0).max(100_000_000).default(0),
})

export type DepositInput = z.infer<typeof depositSchema>
export type DrawdownInput = z.infer<typeof drawdownSchema>
export type CreateWalletInput = z.infer<typeof createWalletSchema>
