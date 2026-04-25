"use server"

/**
 * Transfer listing/read actions. Creation goes through
 * `banking/payment-transfer/actions.ts` which handles the double-entry
 * booking. This file only exposes the history / read side.
 */

import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { logAudit } from "@/lib/audit"
import { requireStaff } from "@/lib/auth-context"
import { requireCan } from "@/lib/authorization"

const log = logger.forModule("finance.banking.transfer-history")

export interface Transfer {
  id: string
  fromAccountId: string
  toAccountId: string
  amount: number
  currency: string
  status: "pending" | "completed" | "failed" | "cancelled"
  createdAt: Date
  completedAt?: Date
  description?: string
  reference?: string
}

export interface TransferRequest {
  fromAccountId: string
  toAccountId: string
  amount: number
  currency?: string
  description?: string
}

/**
 * @deprecated Call `createTransfer` from `banking/payment-transfer/actions.ts`
 * — that path enforces double-entry and balance updates.
 */
export async function createTransfer(_params: TransferRequest): Promise<Transfer | null> {
  throw new Error("Use banking/payment-transfer/actions.createTransfer for new transfers")
}

/**
 * Transfers are stored as two linked Transaction rows (DEBIT + CREDIT) sharing
 * a `reference`. We reconstruct the logical Transfer view by pairing them.
 */
export async function getTransfers(params: {
  userId: string
  page?: number
  pageSize?: number
}): Promise<{
  data: Transfer[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}> {
  const ctx = await requireStaff()
  requireCan(ctx, "read", "finance")

  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 10))

  const txns = await db.transaction.findMany({
    where: { userId: params.userId, category: "INTERNAL_TRANSFER" },
    include: { bankAccount: { select: { currency: true } } },
    orderBy: { transactionDate: "desc" },
  })

  // Group by `reference`; each pair becomes one Transfer row.
  const byRef = new Map<string, typeof txns>()
  for (const t of txns) {
    if (!t.reference) continue
    const list = byRef.get(t.reference) ?? []
    list.push(t)
    byRef.set(t.reference, list)
  }

  const transfers: Transfer[] = Array.from(byRef.values())
    .filter(group => group.length === 2)
    .map(group => {
      const debit = group.find(g => Number(g.amount) < 0)!
      const credit = group.find(g => Number(g.amount) > 0)!
      const completed = group.every(g => g.status === "COMPLETED" || g.status === "RECONCILED")
      const cancelled = group.some(g => g.status === "CANCELLED")
      return {
        id: credit.id,
        fromAccountId: debit.bankAccountId,
        toAccountId: credit.bankAccountId,
        amount: Number(credit.amount),
        currency: credit.bankAccount.currency,
        status: cancelled ? "cancelled" : completed ? "completed" : "pending",
        createdAt: credit.createdAt,
        completedAt: completed ? credit.transactionDate : undefined,
        description: credit.description,
        reference: credit.reference ?? undefined,
      }
    })

  const total = transfers.length
  const data = transfers.slice((page - 1) * pageSize, page * pageSize)

  return {
    data,
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
  }
}

export async function getTransfer(transferId: string): Promise<Transfer | null> {
  const ctx = await requireStaff()
  requireCan(ctx, "read", "finance")

  const credit = await db.transaction.findUnique({
    where: { id: transferId },
    include: { bankAccount: { select: { currency: true } } },
  })
  if (!credit || credit.category !== "INTERNAL_TRANSFER" || !credit.reference) return null

  const debit = await db.transaction.findFirst({
    where: {
      reference: credit.reference,
      id: { not: credit.id },
      category: "INTERNAL_TRANSFER",
    },
  })
  if (!debit) return null

  const completed = credit.status === "COMPLETED" && debit.status === "COMPLETED"
  return {
    id: credit.id,
    fromAccountId: debit.bankAccountId,
    toAccountId: credit.bankAccountId,
    amount: Number(credit.amount),
    currency: credit.bankAccount.currency,
    status: completed ? "completed" : "pending",
    createdAt: credit.createdAt,
    completedAt: completed ? credit.transactionDate : undefined,
    description: credit.description,
    reference: credit.reference,
  }
}

export async function cancelTransfer(transferId: string): Promise<Transfer | null> {
  const ctx = await requireStaff()
  requireCan(ctx, "update", "finance")

  const existing = await getTransfer(transferId)
  if (!existing || !existing.reference) return null
  if (existing.status !== "pending") {
    throw new Error("Only pending transfers can be cancelled")
  }

  // Reverse the balance impact and mark both legs CANCELLED. Kept in one
  // transaction so partial rollback can't leave accounts drifted.
  await db.$transaction(async tx => {
    await tx.transaction.updateMany({
      where: { reference: existing.reference },
      data: { status: "CANCELLED" },
    })
    await tx.bankAccount.update({
      where: { id: existing.fromAccountId },
      data: {
        availableBalance: { increment: existing.amount },
        currentBalance: { increment: existing.amount },
      },
    })
    await tx.bankAccount.update({
      where: { id: existing.toAccountId },
      data: {
        availableBalance: { decrement: existing.amount },
        currentBalance: { decrement: existing.amount },
      },
    })
  })

  await logAudit({
    action: "RECORD_UPDATE",
    actor: ctx,
    resource: "transfer",
    resourceId: existing.reference,
    metadata: { operation: "cancel" },
  })

  log.info("transfer cancelled", { reference: existing.reference })
  return getTransfer(transferId)
}
