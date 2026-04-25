// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use server"

import { revalidatePath } from "next/cache"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

import {
  createBankAccountSchema,
  updateBankAccountSchema,
} from "./validation"
import type { BankAccountDTO, BankAccountStatsDTO } from "./types"

const log = logger.forModule("accounts")

type ActionResult<T = void> = {
  success: boolean
  data?: T
  error?: string
}

function serialize(row: {
  id: string
  accountName: string
  accountNumber: string
  bankName: string
  bankBranch: string | null
  iban: string | null
  swiftCode: string | null
  currency: string
  accountType: string
  status: string
  currentBalance: unknown
  availableBalance: unknown
  lastReconciled: Date | null
  color: string | null
  isDefault: boolean
  isActive: boolean
  displayOrder: number
  createdAt: Date
  updatedAt: Date
}): BankAccountDTO {
  return {
    id: row.id,
    accountName: row.accountName,
    accountNumber: row.accountNumber,
    bankName: row.bankName,
    bankBranch: row.bankBranch,
    iban: row.iban,
    swiftCode: row.swiftCode,
    currency: row.currency,
    accountType: row.accountType as BankAccountDTO["accountType"],
    status: row.status as BankAccountDTO["status"],
    currentBalance: Number(row.currentBalance),
    availableBalance: Number(row.availableBalance),
    lastReconciled: row.lastReconciled ? row.lastReconciled.toISOString() : null,
    color: row.color,
    isDefault: row.isDefault,
    isActive: row.isActive,
    displayOrder: row.displayOrder,
  }
}

function emptyToNull(value: string | undefined | null): string | null {
  if (value === undefined || value === null) return null
  const trimmed = value.trim()
  return trimmed === "" ? null : trimmed
}

export async function listBankAccounts(): Promise<ActionResult<BankAccountDTO[]>> {
  try {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    const rows = await db.bankAccount.findMany({
      where: { userId: session.user.id },
      orderBy: [{ isDefault: "desc" }, { displayOrder: "asc" }, { accountName: "asc" }],
    })
    return { success: true, data: rows.map(serialize) }
  } catch (err) {
    log.error("Failed to list bank accounts", err as Error)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load accounts",
    }
  }
}

export async function getBankAccountStats(): Promise<ActionResult<BankAccountStatsDTO>> {
  try {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }
    const userId = session.user.id

    const [totals, activeCount] = await Promise.all([
      db.bankAccount.aggregate({
        where: { userId, isActive: true },
        _sum: { currentBalance: true },
      }),
      db.bankAccount.count({ where: { userId, isActive: true } }),
    ])

    return {
      success: true,
      data: {
        totalBalance: Number(totals._sum.currentBalance ?? 0),
        activeAccounts: activeCount,
        // Currency breakdown is better handled report-tier; surface single
        // aggregate for the overview stat card.
        currency: "SDG",
      },
    }
  } catch (err) {
    log.error("Failed to get bank account stats", err as Error)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load stats",
    }
  }
}

export async function createBankAccount(
  raw: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }
    const userId = session.user.id

    const parsed = createBankAccountSchema.safeParse(raw)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      }
    }
    const input = parsed.data

    // Only one default per tenant: if this is flagged default, flip others off
    // inside the same transaction so we never end up with two defaults.
    const result = await db.$transaction(async (tx) => {
      if (input.isDefault) {
        await tx.bankAccount.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        })
      }
      return tx.bankAccount.create({
        data: {
          accountName: input.accountName,
          accountNumber: input.accountNumber,
          bankName: input.bankName,
          bankBranch: emptyToNull(input.bankBranch),
          iban: emptyToNull(input.iban),
          swiftCode: emptyToNull(input.swiftCode),
          currency: input.currency,
          accountType: input.accountType,
          status: input.status,
          currentBalance: input.openingBalance,
          availableBalance: input.openingBalance,
          color: emptyToNull(input.color),
          isDefault: input.isDefault,
          isActive: input.isActive,
          displayOrder: input.displayOrder,
          userId,
        },
        select: { id: true },
      })
    })

    revalidatePath("/finance/accounts")
    revalidatePath("/finance/banking")
    return { success: true, data: { id: result.id } }
  } catch (err) {
    log.error("Failed to create bank account", err as Error)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create account",
    }
  }
}

export async function updateBankAccount(
  id: string,
  raw: unknown
): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }
    const userId = session.user.id

    const existing = await db.bankAccount.findFirst({
      where: { id, userId },
      select: { id: true },
    })
    if (!existing) return { success: false, error: "Bank account not found" }

    const parsed = updateBankAccountSchema.safeParse(raw)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      }
    }
    const input = parsed.data

    const data: Record<string, unknown> = {}
    if (input.accountName !== undefined) data.accountName = input.accountName
    if (input.accountNumber !== undefined) data.accountNumber = input.accountNumber
    if (input.bankName !== undefined) data.bankName = input.bankName
    if (input.bankBranch !== undefined) data.bankBranch = emptyToNull(input.bankBranch)
    if (input.iban !== undefined) data.iban = emptyToNull(input.iban)
    if (input.swiftCode !== undefined) data.swiftCode = emptyToNull(input.swiftCode)
    if (input.currency !== undefined) data.currency = input.currency
    if (input.accountType !== undefined) data.accountType = input.accountType
    if (input.status !== undefined) data.status = input.status
    if (input.color !== undefined) data.color = emptyToNull(input.color)
    if (input.isActive !== undefined) data.isActive = input.isActive
    if (input.displayOrder !== undefined) data.displayOrder = input.displayOrder

    // Default toggle needs the cross-account flip for the same reason as
    // create — single-default invariant per tenant.
    await db.$transaction(async (tx) => {
      if (input.isDefault === true) {
        await tx.bankAccount.updateMany({
          where: { userId, isDefault: true, NOT: { id } },
          data: { isDefault: false },
        })
        data.isDefault = true
      } else if (input.isDefault === false) {
        data.isDefault = false
      }
      await tx.bankAccount.update({ where: { id }, data })
    })

    revalidatePath("/finance/accounts")
    revalidatePath("/finance/banking")
    return { success: true }
  } catch (err) {
    log.error("Failed to update bank account", err as Error)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update account",
    }
  }
}

export async function setDefaultBankAccount(id: string): Promise<ActionResult> {
  return updateBankAccount(id, { isDefault: true })
}

export async function deleteBankAccount(id: string): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }
    const userId = session.user.id

    const existing = await db.bankAccount.findFirst({
      where: { id, userId },
      select: { id: true },
    })
    if (!existing) return { success: false, error: "Bank account not found" }

    // Block delete if there are transactions tied to this account — prevents
    // orphaning bank history or expense.transactionId FK violations.
    const txCount = await db.bankTransaction.count({
      where: { bankAccountId: id },
    })
    if (txCount > 0) {
      return {
        success: false,
        error:
          "Cannot delete an account with transactions — deactivate it instead.",
      }
    }

    await db.bankAccount.delete({ where: { id } })
    revalidatePath("/finance/accounts")
    return { success: true }
  } catch (err) {
    log.error("Failed to delete bank account", err as Error)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete account",
    }
  }
}
