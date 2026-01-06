"use server"

/**
 * Bank Actions - Full Prisma Implementation
 * Manages bank accounts for customs clearance finance
 */

import { revalidatePath } from "next/cache"

import { auth } from "@/auth"
import { db } from "@/lib/db"

// Types exported for use in components
export interface BankAccount {
  id: string
  userId: string
  accountName: string
  accountNumber: string
  bankName: string
  bankBranch?: string | null
  iban?: string | null
  swiftCode?: string | null
  currency: string
  accountType: string
  status: string
  currentBalance: number
  availableBalance: number
  lastReconciled?: Date | null
  reconciledBalance?: number | null
  color?: string | null
  isDefault: boolean
  displayOrder: number
  createdAt: Date
  updatedAt: Date
}

export interface AccountsResponse {
  data: BankAccount[]
  totalBanks: number
  totalCurrentBalance: number
  totalAvailableBalance: number
}

// ============================================================================
// BANK ACCOUNT CRUD
// ============================================================================

export async function getAccounts(): Promise<AccountsResponse | null> {
  const session = await auth()
  if (!session?.user?.id) {
    return null
  }

  try {
    const accounts = await db.bankAccount.findMany({
      where: { userId: session.user.id },
      orderBy: [{ isDefault: "desc" }, { displayOrder: "asc" }],
    })

    const totalCurrentBalance = accounts.reduce(
      (sum, acc) => sum + Number(acc.currentBalance),
      0
    )
    const totalAvailableBalance = accounts.reduce(
      (sum, acc) => sum + Number(acc.availableBalance),
      0
    )

    return {
      data: accounts.map((acc) => ({
        id: acc.id,
        userId: acc.userId,
        accountName: acc.accountName,
        accountNumber: acc.accountNumber,
        bankName: acc.bankName,
        bankBranch: acc.bankBranch,
        iban: acc.iban,
        swiftCode: acc.swiftCode,
        currency: acc.currency,
        accountType: acc.accountType,
        status: acc.status,
        currentBalance: Number(acc.currentBalance),
        availableBalance: Number(acc.availableBalance),
        lastReconciled: acc.lastReconciled,
        reconciledBalance: acc.reconciledBalance ? Number(acc.reconciledBalance) : null,
        color: acc.color,
        isDefault: acc.isDefault,
        displayOrder: acc.displayOrder,
        createdAt: acc.createdAt,
        updatedAt: acc.updatedAt,
      })),
      totalBanks: accounts.length,
      totalCurrentBalance,
      totalAvailableBalance,
    }
  } catch (error) {
    console.error("Error fetching accounts:", error)
    return null
  }
}

export async function getAccount(accountId: string): Promise<BankAccount | null> {
  const session = await auth()
  if (!session?.user?.id) {
    return null
  }

  try {
    const account = await db.bankAccount.findFirst({
      where: { id: accountId, userId: session.user.id },
    })

    if (!account) return null

    return {
      id: account.id,
      userId: account.userId,
      accountName: account.accountName,
      accountNumber: account.accountNumber,
      bankName: account.bankName,
      bankBranch: account.bankBranch,
      iban: account.iban,
      swiftCode: account.swiftCode,
      currency: account.currency,
      accountType: account.accountType,
      status: account.status,
      currentBalance: Number(account.currentBalance),
      availableBalance: Number(account.availableBalance),
      lastReconciled: account.lastReconciled,
      reconciledBalance: account.reconciledBalance ? Number(account.reconciledBalance) : null,
      color: account.color,
      isDefault: account.isDefault,
      displayOrder: account.displayOrder,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    }
  } catch (error) {
    console.error("Error fetching account:", error)
    return null
  }
}

export async function createBankAccount(params: {
  accountName: string
  accountNumber: string
  bankName: string
  bankBranch?: string
  iban?: string
  swiftCode?: string
  currency?: string
  accountType?: "CHECKING" | "SAVINGS" | "FOREIGN_CURRENCY" | "PETTY_CASH"
  initialBalance?: number
  color?: string
  isDefault?: boolean
}): Promise<{ success: boolean; data?: BankAccount; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    // If this is set as default, unset other defaults
    if (params.isDefault) {
      await db.bankAccount.updateMany({
        where: { userId: session.user.id, isDefault: true },
        data: { isDefault: false },
      })
    }

    // Get max display order
    const maxOrder = await db.bankAccount.aggregate({
      where: { userId: session.user.id },
      _max: { displayOrder: true },
    })

    const account = await db.bankAccount.create({
      data: {
        accountName: params.accountName,
        accountNumber: params.accountNumber,
        bankName: params.bankName,
        bankBranch: params.bankBranch,
        iban: params.iban,
        swiftCode: params.swiftCode,
        currency: params.currency || "SDG",
        accountType: params.accountType || "CHECKING",
        status: "ACTIVE",
        currentBalance: params.initialBalance || 0,
        availableBalance: params.initialBalance || 0,
        color: params.color,
        isDefault: params.isDefault || false,
        displayOrder: (maxOrder._max.displayOrder || 0) + 1,
        userId: session.user.id,
      },
    })

    revalidatePath("/finance/banking")
    revalidatePath("/finance/dashboard")

    return {
      success: true,
      data: {
        id: account.id,
        userId: account.userId,
        accountName: account.accountName,
        accountNumber: account.accountNumber,
        bankName: account.bankName,
        bankBranch: account.bankBranch,
        iban: account.iban,
        swiftCode: account.swiftCode,
        currency: account.currency,
        accountType: account.accountType,
        status: account.status,
        currentBalance: Number(account.currentBalance),
        availableBalance: Number(account.availableBalance),
        lastReconciled: account.lastReconciled,
        reconciledBalance: null,
        color: account.color,
        isDefault: account.isDefault,
        displayOrder: account.displayOrder,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
      },
    }
  } catch (error) {
    console.error("Error creating bank account:", error)
    return { success: false, error: "Failed to create bank account" }
  }
}

export async function updateBankAccount(
  accountId: string,
  params: {
    accountName?: string
    bankBranch?: string
    iban?: string
    swiftCode?: string
    color?: string
    isDefault?: boolean
    status?: "ACTIVE" | "INACTIVE" | "FROZEN" | "CLOSED"
  }
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    // Verify ownership
    const existing = await db.bankAccount.findFirst({
      where: { id: accountId, userId: session.user.id },
    })

    if (!existing) {
      return { success: false, error: "Account not found" }
    }

    // If setting as default, unset others
    if (params.isDefault) {
      await db.bankAccount.updateMany({
        where: { userId: session.user.id, isDefault: true },
        data: { isDefault: false },
      })
    }

    await db.bankAccount.update({
      where: { id: accountId },
      data: params,
    })

    revalidatePath("/finance/banking")

    return { success: true }
  } catch (error) {
    console.error("Error updating bank account:", error)
    return { success: false, error: "Failed to update bank account" }
  }
}

export async function deleteBankAccount(
  accountId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const existing = await db.bankAccount.findFirst({
      where: { id: accountId, userId: session.user.id },
    })

    if (!existing) {
      return { success: false, error: "Account not found" }
    }

    // Check if account has transactions
    const transactionCount = await db.transaction.count({
      where: { bankAccountId: accountId },
    })

    if (transactionCount > 0) {
      // Mark as closed instead of deleting
      await db.bankAccount.update({
        where: { id: accountId },
        data: { status: "CLOSED" },
      })
    } else {
      await db.bankAccount.delete({ where: { id: accountId } })
    }

    revalidatePath("/finance/banking")
    revalidatePath("/finance/dashboard")

    return { success: true }
  } catch (error) {
    console.error("Error deleting bank account:", error)
    return { success: false, error: "Failed to delete bank account" }
  }
}

// ============================================================================
// BANK ACCOUNT UTILITIES
// ============================================================================

export async function getBankInfo(accountId: string): Promise<{
  name: string
  branch?: string
  logo?: string
  primaryColor?: string
} | null> {
  const session = await auth()
  if (!session?.user?.id) {
    return null
  }

  try {
    const account = await db.bankAccount.findFirst({
      where: { id: accountId, userId: session.user.id },
      select: { bankName: true, bankBranch: true, color: true },
    })

    if (!account) return null

    return {
      name: account.bankName,
      branch: account.bankBranch || undefined,
      primaryColor: account.color || undefined,
    }
  } catch (error) {
    console.error("Error fetching bank info:", error)
    return null
  }
}

export async function updateAccountBalance(
  accountId: string,
  amount: number,
  type: "credit" | "debit"
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const account = await db.bankAccount.findFirst({
      where: { id: accountId, userId: session.user.id },
    })

    if (!account) {
      return { success: false, error: "Account not found" }
    }

    const currentBalance = Number(account.currentBalance)
    const newBalance = type === "credit"
      ? currentBalance + amount
      : currentBalance - amount

    await db.bankAccount.update({
      where: { id: accountId },
      data: {
        currentBalance: newBalance,
        availableBalance: newBalance,
      },
    })

    revalidatePath("/finance/banking")

    return { success: true, newBalance }
  } catch (error) {
    console.error("Error updating account balance:", error)
    return { success: false, error: "Failed to update balance" }
  }
}

export async function reconcileAccount(
  accountId: string,
  reconciledBalance: number
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const existing = await db.bankAccount.findFirst({
      where: { id: accountId, userId: session.user.id },
    })

    if (!existing) {
      return { success: false, error: "Account not found" }
    }

    await db.bankAccount.update({
      where: { id: accountId },
      data: {
        reconciledBalance: reconciledBalance,
        lastReconciled: new Date(),
      },
    })

    // Mark all transactions up to now as reconciled
    await db.transaction.updateMany({
      where: {
        bankAccountId: accountId,
        status: "COMPLETED",
        reconciledAt: null,
      },
      data: {
        status: "RECONCILED",
        reconciledAt: new Date(),
        reconciledAmount: reconciledBalance,
      },
    })

    revalidatePath("/finance/banking")

    return { success: true }
  } catch (error) {
    console.error("Error reconciling account:", error)
    return { success: false, error: "Failed to reconcile account" }
  }
}

export async function prefetchAccounts(): Promise<void> {
  // This function can be used to warm up cache
  // For now, it's a no-op since we're using direct database queries
  const session = await auth()
  if (!session?.user?.id) return

  // Prefetch accounts in the background
  await getAccounts()
}
