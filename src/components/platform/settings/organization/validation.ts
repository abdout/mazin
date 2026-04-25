// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

const nullableTrimmed = z
  .string()
  .trim()
  .max(255)
  .optional()
  .or(z.literal(""))

export const upsertCompanySettingsSchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required").max(255),
  companyNameAr: nullableTrimmed,
  taxId: nullableTrimmed,
  email: z
    .string()
    .trim()
    .email("Enter a valid email")
    .max(254)
    .optional()
    .or(z.literal("")),
  phone: nullableTrimmed,
  website: z
    .string()
    .trim()
    .url("Enter a valid URL")
    .max(2048)
    .optional()
    .or(z.literal("")),
  address1: nullableTrimmed,
  address2: nullableTrimmed,
  city: nullableTrimmed,
  state: nullableTrimmed,
  country: z.string().trim().min(1).max(3).default("SD"),
  postalCode: nullableTrimmed,
  bankName: nullableTrimmed,
  bankBranch: nullableTrimmed,
  accountName: nullableTrimmed,
  accountNumber: nullableTrimmed,
  iban: nullableTrimmed,
  swiftCode: nullableTrimmed,
  invoicePrefix: z.string().trim().min(1).max(16).default("INV"),
  defaultCurrency: z.enum(["SDG", "USD", "EUR", "SAR", "AED"]).default("SDG"),
  defaultTaxRate: z.number().min(0).max(100).default(15),
  defaultPaymentTerms: z.number().int().min(0).max(365).default(30),
})

export type UpsertCompanySettingsInput = z.infer<
  typeof upsertCompanySettingsSchema
>
