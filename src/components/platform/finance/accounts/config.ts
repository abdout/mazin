// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Ordered options for dropdowns. Labels resolved via dictionary at render time.
export const BANK_ACCOUNT_TYPES = [
  "CURRENT",
  "CHECKING",
  "SAVINGS",
  "FOREIGN_CURRENCY",
  "PETTY_CASH",
] as const

export const BANK_ACCOUNT_STATUSES = [
  "ACTIVE",
  "INACTIVE",
  "FROZEN",
  "CLOSED",
] as const

export const CURRENCIES = ["SDG", "USD", "EUR", "SAR", "AED"] as const
