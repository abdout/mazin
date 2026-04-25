// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"
import type {
  WalletRowDTO,
  WalletStatsDTO,
  WalletTransactionDTO,
} from "./types"

/** Sum of balances / wallet counts / recent activity — all scoped to caller. */
export async function getWalletStats(
  userId: string
): Promise<WalletStatsDTO> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [balanceAgg, activeCount, recentTxCount] = await Promise.all([
    db.wallet.aggregate({
      where: { client: { userId } },
      _sum: { balance: true },
    }),
    db.wallet.count({
      where: { client: { userId }, status: "ACTIVE" },
    }),
    db.walletTransaction.count({
      where: {
        wallet: { client: { userId } },
        transactionDate: { gte: thirtyDaysAgo },
      },
    }),
  ])

  return {
    totalBalance: Number(balanceAgg._sum.balance ?? 0),
    activeWallets: activeCount,
    transactions30d: recentTxCount,
    // Mazin is mostly SDG; if mixed currencies accumulate we should split
    // stats per-currency, but that's a report-tier concern.
    currency: "SDG",
  }
}

export async function listWallets(userId: string): Promise<WalletRowDTO[]> {
  const wallets = await db.wallet.findMany({
    where: { client: { userId } },
    include: {
      client: { select: { id: true, companyName: true } },
      transactions: {
        orderBy: { transactionDate: "desc" },
        take: 1,
        select: { transactionDate: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  })

  return wallets.map((w) => ({
    id: w.id,
    clientId: w.clientId,
    clientName: w.client.companyName,
    balance: Number(w.balance),
    currency: w.currency,
    creditLimit: Number(w.creditLimit),
    status: w.status,
    lastActivityAt:
      w.transactions[0]?.transactionDate.toISOString() ?? null,
  }))
}

export async function listWalletTransactions(
  userId: string,
  walletId: string,
  limit = 50
): Promise<WalletTransactionDTO[]> {
  // Tenant check: the wallet must be owned by a client that belongs to the
  // user. Prisma's nested-filter runs in-db, so no extra round-trip.
  const wallet = await db.wallet.findFirst({
    where: { id: walletId, client: { userId } },
    select: { id: true },
  })
  if (!wallet) return []

  const rows = await db.walletTransaction.findMany({
    where: { walletId },
    orderBy: { transactionDate: "desc" },
    take: Math.min(limit, 200),
  })

  return rows.map((r) => ({
    id: r.id,
    transactionDate: r.transactionDate.toISOString(),
    type: r.type,
    description: r.description,
    reference: r.reference,
    amount: Number(r.amount),
    balanceAfter: Number(r.balanceAfter),
    invoiceId: r.invoiceId,
    shipmentId: r.shipmentId,
  }))
}
