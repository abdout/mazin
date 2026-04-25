// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { WalletStatus, WalletTransactionType } from "@prisma/client"

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string; issues?: Record<string, string[]> }

// Serialized DTOs (Decimal → number, Date → ISO string) — client components
// can't safely hold Prisma Decimal objects.
export interface WalletRowDTO {
  id: string
  clientId: string
  clientName: string
  balance: number
  currency: string
  creditLimit: number
  status: WalletStatus
  lastActivityAt: string | null
}

export interface WalletStatsDTO {
  totalBalance: number
  activeWallets: number
  transactions30d: number
  currency: string
}

export interface WalletTransactionDTO {
  id: string
  transactionDate: string
  type: WalletTransactionType
  description: string
  reference: string | null
  amount: number
  balanceAfter: number
  invoiceId: string | null
  shipmentId: string | null
}
