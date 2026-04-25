// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

const log = logger.forModule("reports")

type ActionResult<T = void> = {
  success: boolean
  data?: T
  error?: string
}

export interface PnlPeriodDTO {
  revenue: number
  expenses: number
  profit: number
  currency: string
}

export interface PnlSummaryDTO {
  thisMonth: PnlPeriodDTO
  lastMonth: PnlPeriodDTO
  yearToDate: PnlPeriodDTO
}

export interface ARAgingBucketDTO {
  label: "0-30" | "31-60" | "61-90" | "90+"
  count: number
  amount: number
}

export interface ARAgingDTO {
  totalOutstanding: number
  buckets: ARAgingBucketDTO[]
}

export interface WalletSummaryDTO {
  totalHeld: number
  walletCount: number
  topClients: Array<{ clientId: string; clientName: string; balance: number; currency: string }>
}

export interface CashFlowDTO {
  inflows: { walletDeposits: number; invoicePayments: number; total: number }
  outflows: { expenses: number; walletDrawdowns: number; total: number }
  net: number
}

// ============================================================================
// Date helpers
// ============================================================================

function firstOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
function firstOfLastMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() - 1, 1)
}
function firstOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 0, 1)
}

async function pnlForRange(
  userId: string,
  from: Date,
  to: Date
): Promise<PnlPeriodDTO> {
  const [rev, exp] = await Promise.all([
    db.invoice.aggregate({
      where: {
        userId,
        status: "PAID",
        paidAt: { gte: from, lt: to },
      },
      _sum: { total: true },
    }),
    db.expense.aggregate({
      where: {
        userId,
        status: { in: ["APPROVED", "PAID"] },
        expenseDate: { gte: from, lt: to },
      },
      _sum: { amount: true },
    }),
  ])
  const revenue = Number(rev._sum.total ?? 0)
  const expenses = Number(exp._sum.amount ?? 0)
  // Reports are SDG-only for v1 — mixed-currency reporting is deeper refactor
  // and the agency mostly transacts in SDG.
  return { revenue, expenses, profit: revenue - expenses, currency: "SDG" }
}

export async function getPnlSummary(): Promise<ActionResult<PnlSummaryDTO>> {
  try {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }
    const userId = session.user.id

    const now = new Date()
    const thisStart = firstOfMonth(now)
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const lastStart = firstOfLastMonth(now)
    const ytdStart = firstOfYear(now)

    const [thisMonth, lastMonth, yearToDate] = await Promise.all([
      pnlForRange(userId, thisStart, nextMonth),
      pnlForRange(userId, lastStart, thisStart),
      pnlForRange(userId, ytdStart, nextMonth),
    ])

    return { success: true, data: { thisMonth, lastMonth, yearToDate } }
  } catch (err) {
    log.error("Failed to compute P&L summary", err as Error)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to compute P&L",
    }
  }
}

export async function getARAging(): Promise<ActionResult<ARAgingDTO>> {
  try {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }
    const userId = session.user.id

    // Pull unpaid invoices; bucket in memory. For a small agency (hundreds of
    // open invoices at most) this is cheaper than four separate aggregate
    // queries with date math on the DB side.
    const invoices = await db.invoice.findMany({
      where: {
        userId,
        status: { notIn: ["PAID", "CANCELLED"] },
      },
      select: {
        id: true,
        total: true,
        createdAt: true,
        dueDate: true,
      },
    })

    const buckets: Record<ARAgingBucketDTO["label"], ARAgingBucketDTO> = {
      "0-30": { label: "0-30", count: 0, amount: 0 },
      "31-60": { label: "31-60", count: 0, amount: 0 },
      "61-90": { label: "61-90", count: 0, amount: 0 },
      "90+": { label: "90+", count: 0, amount: 0 },
    }

    const now = Date.now()
    let total = 0
    for (const inv of invoices) {
      const baseline = inv.dueDate ?? inv.createdAt
      const days = Math.max(0, Math.floor((now - baseline.getTime()) / 86_400_000))
      const amt = Number(inv.total)
      total += amt
      const b: ARAgingBucketDTO["label"] =
        days <= 30 ? "0-30" : days <= 60 ? "31-60" : days <= 90 ? "61-90" : "90+"
      buckets[b].count += 1
      buckets[b].amount += amt
    }

    return {
      success: true,
      data: {
        totalOutstanding: total,
        buckets: [buckets["0-30"], buckets["31-60"], buckets["61-90"], buckets["90+"]],
      },
    }
  } catch (err) {
    log.error("Failed to compute AR aging", err as Error)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to compute aging",
    }
  }
}

export async function getWalletSummary(): Promise<ActionResult<WalletSummaryDTO>> {
  try {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }
    const userId = session.user.id

    const [totalAgg, count, topWallets] = await Promise.all([
      db.wallet.aggregate({
        where: { client: { userId } },
        _sum: { balance: true },
      }),
      db.wallet.count({ where: { client: { userId } } }),
      db.wallet.findMany({
        where: { client: { userId } },
        include: { client: { select: { id: true, companyName: true } } },
        orderBy: { balance: "desc" },
        take: 5,
      }),
    ])

    return {
      success: true,
      data: {
        totalHeld: Number(totalAgg._sum.balance ?? 0),
        walletCount: count,
        topClients: topWallets.map((w) => ({
          clientId: w.client.id,
          clientName: w.client.companyName,
          balance: Number(w.balance),
          currency: w.currency,
        })),
      },
    }
  } catch (err) {
    log.error("Failed to compute wallet summary", err as Error)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to compute wallets",
    }
  }
}

export async function getCashFlowThisMonth(): Promise<ActionResult<CashFlowDTO>> {
  try {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }
    const userId = session.user.id

    const now = new Date()
    const monthStart = firstOfMonth(now)
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    const [invoicePayments, expenses, walletDeposits, walletDrawdowns] = await Promise.all([
      db.invoice.aggregate({
        where: {
          userId,
          status: "PAID",
          paidAt: { gte: monthStart, lt: nextMonth },
        },
        _sum: { total: true },
      }),
      db.expense.aggregate({
        where: {
          userId,
          status: "PAID",
          paidAt: { gte: monthStart, lt: nextMonth },
        },
        _sum: { amount: true },
      }),
      db.walletTransaction.aggregate({
        where: {
          wallet: { client: { userId } },
          type: "DEPOSIT",
          transactionDate: { gte: monthStart, lt: nextMonth },
        },
        _sum: { amount: true },
      }),
      db.walletTransaction.aggregate({
        where: {
          wallet: { client: { userId } },
          type: { in: ["WITHDRAWAL", "INVOICE_PAYMENT", "DUTY_PAYMENT"] },
          transactionDate: { gte: monthStart, lt: nextMonth },
        },
        _sum: { amount: true },
      }),
    ])

    const inflowInvoices = Number(invoicePayments._sum.total ?? 0)
    const inflowDeposits = Number(walletDeposits._sum.amount ?? 0)
    const outflowExpenses = Number(expenses._sum.amount ?? 0)
    // Wallet drawdowns are stored signed-negative in the ledger, so the sum
    // is negative. Show the absolute value for the outflow display.
    const outflowDrawdowns = Math.abs(Number(walletDrawdowns._sum.amount ?? 0))

    const inflowTotal = inflowInvoices + inflowDeposits
    const outflowTotal = outflowExpenses + outflowDrawdowns

    return {
      success: true,
      data: {
        inflows: {
          walletDeposits: inflowDeposits,
          invoicePayments: inflowInvoices,
          total: inflowTotal,
        },
        outflows: {
          expenses: outflowExpenses,
          walletDrawdowns: outflowDrawdowns,
          total: outflowTotal,
        },
        net: inflowTotal - outflowTotal,
      },
    }
  } catch (err) {
    log.error("Failed to compute cash flow", err as Error)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to compute cash flow",
    }
  }
}
