// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { BankAccountStatus, BankAccountType } from "@prisma/client"

export interface BankAccountDTO {
  id: string
  accountName: string
  accountNumber: string
  bankName: string
  bankBranch: string | null
  iban: string | null
  swiftCode: string | null
  currency: string
  accountType: BankAccountType
  status: BankAccountStatus
  currentBalance: number
  availableBalance: number
  lastReconciled: string | null
  color: string | null
  isDefault: boolean
  isActive: boolean
  displayOrder: number
}

export interface BankAccountStatsDTO {
  totalBalance: number
  activeAccounts: number
  currency: string
}
