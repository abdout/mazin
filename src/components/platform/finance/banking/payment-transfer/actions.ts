"use server"

/**
 * Internal transfers between company bank accounts. External transfers (to
 * another institution or a vendor) are booked as regular DEBIT transactions
 * on the source account — they require an out-of-band bank instruction and
 * are reconciled later via bank statement import.
 */

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { logAudit } from "@/lib/audit"
import { requireStaff } from "@/lib/auth-context"
import { requireCan } from "@/lib/authorization"
import type { BankAccount } from "@prisma/client"

const log = logger.forModule("finance.banking.transfer")

export interface TransferRequest {
  fromAccountId: string
  toAccountId?: string
  toEmail?: string
  amount: number
  note?: string
}

export interface TransferResult {
  success: boolean
  transferId?: string
  error?: string
}

export async function getAccountsForTransfer(userId: string): Promise<BankAccount[]> {
  const ctx = await requireStaff()
  requireCan(ctx, "read", "finance")

  return db.bankAccount.findMany({
    where: { userId, isActive: true, status: "ACTIVE" },
    orderBy: [{ isDefault: "desc" }, { displayOrder: "asc" }],
  })
}

export async function createTransfer(params: TransferRequest): Promise<TransferResult> {
  const ctx = await requireStaff()
  requireCan(ctx, "create", "finance")

  if (!params.fromAccountId || params.amount <= 0) {
    return { success: false, error: "fromAccountId and positive amount are required" }
  }
  if (!params.toAccountId) {
    return { success: false, error: "External transfers not supported — post a DEBIT transaction instead" }
  }
  if (params.fromAccountId === params.toAccountId) {
    return { success: false, error: "Source and destination must differ" }
  }

  const [from, to] = await Promise.all([
    db.bankAccount.findUnique({ where: { id: params.fromAccountId } }),
    db.bankAccount.findUnique({ where: { id: params.toAccountId } }),
  ])
  if (!from || !to) return { success: false, error: "Account not found" }
  if (from.currency !== to.currency) {
    return { success: false, error: "Cross-currency transfers not supported — book as FX conversion" }
  }
  if (Number(from.availableBalance) < params.amount) {
    return { success: false, error: "Insufficient available balance" }
  }

  // Double-entry: DEBIT from source, CREDIT to destination. Tied via shared
  // reference for audit/reconciliation. Balances updated transactionally.
  const reference = `XFER-${Date.now().toString(36).toUpperCase()}`
  const description = params.note ?? `Internal transfer ${from.accountName} → ${to.accountName}`

  const result = await db.$transaction(async tx => {
    await tx.transaction.create({
      data: {
        description,
        type: "TRANSFER",
        category: "INTERNAL_TRANSFER",
        amount: -params.amount,
        bankAccountId: from.id,
        userId: ctx.userId,
        status: "COMPLETED",
        reference,
      },
    })
    const credit = await tx.transaction.create({
      data: {
        description,
        type: "TRANSFER",
        category: "INTERNAL_TRANSFER",
        amount: params.amount,
        bankAccountId: to.id,
        userId: ctx.userId,
        status: "COMPLETED",
        reference,
      },
    })
    await tx.bankAccount.update({
      where: { id: from.id },
      data: {
        availableBalance: { decrement: params.amount },
        currentBalance: { decrement: params.amount },
      },
    })
    await tx.bankAccount.update({
      where: { id: to.id },
      data: {
        availableBalance: { increment: params.amount },
        currentBalance: { increment: params.amount },
      },
    })
    return credit
  })

  await logAudit({
    action: "RECORD_CREATE",
    actor: ctx,
    resource: "transfer",
    resourceId: reference,
    metadata: { fromAccountId: from.id, toAccountId: to.id, amount: params.amount },
  })

  revalidatePath("/finance/banking")
  log.info("transfer completed", { reference, amount: params.amount })
  return { success: true, transferId: result.id }
}

export async function getTransferStatus(transferId: string): Promise<{
  status: "pending" | "completed" | "failed"
  error?: string
}> {
  const ctx = await requireStaff()
  requireCan(ctx, "read", "finance")

  const txn = await db.transaction.findUnique({ where: { id: transferId } })
  if (!txn) return { status: "failed", error: "Transfer not found" }

  const status: "pending" | "completed" | "failed" =
    txn.status === "COMPLETED" || txn.status === "RECONCILED"
      ? "completed"
      : txn.status === "FAILED" || txn.status === "CANCELLED"
        ? "failed"
        : "pending"

  return { status }
}
