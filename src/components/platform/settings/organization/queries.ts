// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"
import type { CompanySettingsDTO } from "../types"

export async function getCompanySettings(
  userId: string
): Promise<CompanySettingsDTO | null> {
  const row = await db.companySettings.findUnique({ where: { userId } })
  if (!row) return null

  return {
    id: row.id,
    companyName: row.companyName,
    companyNameAr: row.companyNameAr,
    taxId: row.taxId,
    email: row.email,
    phone: row.phone,
    website: row.website,
    address1: row.address1,
    address2: row.address2,
    city: row.city,
    state: row.state,
    country: row.country,
    postalCode: row.postalCode,
    bankName: row.bankName,
    bankBranch: row.bankBranch,
    accountName: row.accountName,
    accountNumber: row.accountNumber,
    iban: row.iban,
    swiftCode: row.swiftCode,
    invoicePrefix: row.invoicePrefix,
    invoiceStartNum: row.invoiceStartNum,
    defaultCurrency: row.defaultCurrency,
    defaultTaxRate: Number(row.defaultTaxRate),
    defaultPaymentTerms: row.defaultPaymentTerms,
  }
}
