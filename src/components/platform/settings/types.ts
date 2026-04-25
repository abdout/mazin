// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string; issues?: Record<string, string[]> }

export interface ProfileDTO {
  id: string
  name: string | null
  email: string
  phone: string | null
  image: string | null
  isTwoFactorEnabled: boolean
  isOAuth: boolean
}

export interface CompanySettingsDTO {
  id: string
  companyName: string | null
  companyNameAr: string | null
  taxId: string | null
  email: string | null
  phone: string | null
  website: string | null
  address1: string | null
  address2: string | null
  city: string | null
  state: string | null
  country: string
  postalCode: string | null
  bankName: string | null
  bankBranch: string | null
  accountName: string | null
  accountNumber: string | null
  iban: string | null
  swiftCode: string | null
  invoicePrefix: string
  invoiceStartNum: number
  defaultCurrency: string
  defaultTaxRate: number
  defaultPaymentTerms: number
}
