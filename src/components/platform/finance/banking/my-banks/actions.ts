"use server"

/**
 * Bank account management. Sudan's Plaid equivalent doesn't exist, so
 * "refresh" is a manual reconciliation operation rather than a pull from
 * an external provider.
 */

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { logAudit } from "@/lib/audit"
import { requireStaff } from "@/lib/auth-context"
import { requireCan } from "@/lib/authorization"
import type { BankAccount } from "@prisma/client"

const log = logger.forModule("finance.banking.my-banks")

export interface BankWithInfo extends BankAccount {
  institutionName?: string
  institutionLogo?: string
  primaryColor?: string
}

export async function getBanksForUser(userId: string): Promise<BankWithInfo[]> {
  const ctx = await requireStaff()
  requireCan(ctx, "read", "finance")

  const rows = await db.bankAccount.findMany({
    where: { userId, isActive: true },
    orderBy: [{ isDefault: "desc" }, { displayOrder: "asc" }, { createdAt: "asc" }],
  })

  return rows.map(row => ({
    ...row,
    institutionName: row.bankName,
    primaryColor: row.color ?? undefined,
  }))
}

export async function unlinkBank(bankId: string): Promise<{ success: boolean; error?: string }> {
  const ctx = await requireStaff()
  requireCan(ctx, "delete", "finance")

  const existing = await db.bankAccount.findUnique({
    where: { id: bankId },
    select: { id: true, accountName: true, _count: { select: { transactions: true } } },
  })
  if (!existing) return { success: false, error: "Bank account not found" }

  // Preserve the audit trail on historical transactions by soft-deleting the
  // account instead of cascading deletes. Re-linking later is a new row.
  await db.bankAccount.update({
    where: { id: bankId },
    data: { isActive: false, status: "CLOSED" },
  })

  await logAudit({
    action: "RECORD_UPDATE",
    actor: ctx,
    resource: "bank_account",
    resourceId: bankId,
    metadata: { operation: "unlink", accountName: existing.accountName, txnCount: existing._count.transactions },
  })

  revalidatePath("/finance/banking")
  log.info("bank unlinked", { id: bankId })
  return { success: true }
}

/**
 * Refresh pulls the latest balance from recorded transactions. Without a
 * Plaid-equivalent external feed, the refresh is the sum of transactions
 * for each account — staff reconcile by importing statements separately.
 */
export async function refreshBankData(bankId: string): Promise<{ success: boolean; error?: string }> {
  const ctx = await requireStaff()
  requireCan(ctx, "update", "finance")

  const account = await db.bankAccount.findUnique({ where: { id: bankId } })
  if (!account) return { success: false, error: "Bank account not found" }

  const agg = await db.transaction.aggregate({
    where: { bankAccountId: bankId },
    _sum: { amount: true },
  })

  const computed = Number(agg._sum.amount ?? 0)
  await db.bankAccount.update({
    where: { id: bankId },
    data: { currentBalance: computed, availableBalance: computed },
  })

  await logAudit({
    action: "RECORD_UPDATE",
    actor: ctx,
    resource: "bank_account",
    resourceId: bankId,
    metadata: { operation: "refresh", computedBalance: computed },
  })

  revalidatePath("/finance/banking")
  return { success: true }
}
