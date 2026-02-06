"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { auth } from "@/auth"
import { BankAccountType } from "@prisma/client"
import { z } from "zod"

// Validation schemas
const createBankAccountSchema = z.object({
  accountName: z.string().min(1, "Account name is required"),
  bankName: z.string().min(1, "Bank name is required"),
  bankBranch: z.string().optional(),
  accountNumber: z.string().min(1, "Account number is required"),
  accountType: z.enum(["CURRENT", "SAVINGS"]).default("CURRENT"),
  currency: z.string().default("SDG"),
  isDefault: z.boolean().default(false),
})

const updateBankAccountSchema = createBankAccountSchema.partial().extend({
  isActive: z.boolean().optional(),
})

export type CreateBankAccountInput = z.infer<typeof createBankAccountSchema>
export type UpdateBankAccountInput = z.infer<typeof updateBankAccountSchema>

// Response types
export interface BankAccountWithBalance {
  id: string
  accountName: string
  bankName: string
  bankBranch: string | null
  accountNumber: string
  accountType: BankAccountType
  currentBalance: number
  currency: string
  isDefault: boolean
  isActive: boolean
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface AccountsResponse {
  data: BankAccountWithBalance[]
  totalBanks: number
  totalCurrentBalance: number
  totalAvailableBalance?: number
}

// Get all bank accounts for the current user
export async function getAccounts(): Promise<{
  success: boolean
  data?: AccountsResponse
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const accounts = await db.bankAccount.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      orderBy: [
        { isDefault: "desc" },
        { createdAt: "desc" },
      ],
    })

    const totalBalance = accounts.reduce(
      (sum, acc) => sum + Number(acc.currentBalance),
      0
    )

    return {
      success: true,
      data: {
        data: accounts.map((acc) => ({
          ...acc,
          currentBalance: Number(acc.currentBalance),
        })),
        totalBanks: accounts.length,
        totalCurrentBalance: totalBalance,
      },
    }
  } catch (error) {
    console.error("Error fetching accounts:", error instanceof Error ? error.message : "Unknown error")
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch accounts",
    }
  }
}

// Get a single bank account by ID
export async function getAccount(accountId: string): Promise<{
  success: boolean
  data?: BankAccountWithBalance
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const account = await db.bankAccount.findFirst({
      where: {
        id: accountId,
        userId: session.user.id,
      },
    })

    if (!account) {
      return { success: false, error: "Account not found" }
    }

    return {
      success: true,
      data: {
        ...account,
        currentBalance: Number(account.currentBalance),
      },
    }
  } catch (error) {
    console.error("Error fetching account:", error instanceof Error ? error.message : "Unknown error")
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch account",
    }
  }
}

// Create a new bank account
export async function createBankAccount(
  input: CreateBankAccountInput
): Promise<{
  success: boolean
  data?: BankAccountWithBalance
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const validated = createBankAccountSchema.parse(input)

    // If this is the first account or marked as default, handle default logic
    if (validated.isDefault) {
      await db.bankAccount.updateMany({
        where: {
          userId: session.user.id,
          isDefault: true,
        },
        data: { isDefault: false },
      })
    }

    // Check if this is the first account
    const existingCount = await db.bankAccount.count({
      where: { userId: session.user.id },
    })

    const account = await db.bankAccount.create({
      data: {
        ...validated,
        isDefault: validated.isDefault || existingCount === 0,
        currentBalance: 0,
        userId: session.user.id,
      },
    })

    revalidatePath("/finance/banking")
    revalidatePath("/finance/banking/my-banks")

    return {
      success: true,
      data: {
        ...account,
        currentBalance: Number(account.currentBalance),
      },
    }
  } catch (error) {
    console.error("Error creating bank account:", error instanceof Error ? error.message : "Unknown error")
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Validation error" }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create account",
    }
  }
}

// Update a bank account
export async function updateBankAccount(
  accountId: string,
  input: UpdateBankAccountInput
): Promise<{
  success: boolean
  data?: BankAccountWithBalance
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Verify ownership
    const existing = await db.bankAccount.findFirst({
      where: {
        id: accountId,
        userId: session.user.id,
      },
    })

    if (!existing) {
      return { success: false, error: "Account not found" }
    }

    const validated = updateBankAccountSchema.parse(input)

    // Handle default account logic
    if (validated.isDefault) {
      await db.bankAccount.updateMany({
        where: {
          userId: session.user.id,
          isDefault: true,
          NOT: { id: accountId },
        },
        data: { isDefault: false },
      })
    }

    const account = await db.bankAccount.update({
      where: { id: accountId },
      data: validated,
    })

    revalidatePath("/finance/banking")
    revalidatePath("/finance/banking/my-banks")

    return {
      success: true,
      data: {
        ...account,
        currentBalance: Number(account.currentBalance),
      },
    }
  } catch (error) {
    console.error("Error updating bank account:", error instanceof Error ? error.message : "Unknown error")
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Validation error" }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update account",
    }
  }
}

// Delete (deactivate) a bank account
export async function deleteBankAccount(accountId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Verify ownership
    const existing = await db.bankAccount.findFirst({
      where: {
        id: accountId,
        userId: session.user.id,
      },
    })

    if (!existing) {
      return { success: false, error: "Account not found" }
    }

    // Check for linked transactions
    const transactionCount = await db.bankTransaction.count({
      where: { bankAccountId: accountId },
    })

    if (transactionCount > 0) {
      // Soft delete - deactivate instead of delete
      await db.bankAccount.update({
        where: { id: accountId },
        data: { isActive: false },
      })
    } else {
      // Hard delete if no transactions
      await db.bankAccount.delete({
        where: { id: accountId },
      })
    }

    // If this was the default account, set another one as default
    if (existing.isDefault) {
      const nextAccount = await db.bankAccount.findFirst({
        where: {
          userId: session.user.id,
          isActive: true,
          NOT: { id: accountId },
        },
        orderBy: { createdAt: "desc" },
      })

      if (nextAccount) {
        await db.bankAccount.update({
          where: { id: nextAccount.id },
          data: { isDefault: true },
        })
      }
    }

    revalidatePath("/finance/banking")
    revalidatePath("/finance/banking/my-banks")

    return { success: true }
  } catch (error) {
    console.error("Error deleting bank account:", error instanceof Error ? error.message : "Unknown error")
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete account",
    }
  }
}

// Get account balance
export async function getAccountBalance(accountId: string): Promise<{
  success: boolean
  balance?: number
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const account = await db.bankAccount.findFirst({
      where: {
        id: accountId,
        userId: session.user.id,
      },
      select: { currentBalance: true },
    })

    if (!account) {
      return { success: false, error: "Account not found" }
    }

    return {
      success: true,
      balance: Number(account.currentBalance),
    }
  } catch (error) {
    console.error("Error fetching balance:", error instanceof Error ? error.message : "Unknown error")
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch balance",
    }
  }
}

// Set account as default
export async function setDefaultAccount(accountId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Verify ownership
    const existing = await db.bankAccount.findFirst({
      where: {
        id: accountId,
        userId: session.user.id,
        isActive: true,
      },
    })

    if (!existing) {
      return { success: false, error: "Account not found" }
    }

    // Remove default from all other accounts
    await db.bankAccount.updateMany({
      where: {
        userId: session.user.id,
        isDefault: true,
      },
      data: { isDefault: false },
    })

    // Set this account as default
    await db.bankAccount.update({
      where: { id: accountId },
      data: { isDefault: true },
    })

    revalidatePath("/finance/banking")
    revalidatePath("/finance/banking/my-banks")

    return { success: true }
  } catch (error) {
    console.error("Error setting default account:", error instanceof Error ? error.message : "Unknown error")
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to set default account",
    }
  }
}

// Get default account
export async function getDefaultAccount(): Promise<{
  success: boolean
  data?: BankAccountWithBalance
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const account = await db.bankAccount.findFirst({
      where: {
        userId: session.user.id,
        isDefault: true,
        isActive: true,
      },
    })

    if (!account) {
      // Return first active account if no default set
      const firstAccount = await db.bankAccount.findFirst({
        where: {
          userId: session.user.id,
          isActive: true,
        },
        orderBy: { createdAt: "desc" },
      })

      if (!firstAccount) {
        return { success: false, error: "No bank accounts found" }
      }

      return {
        success: true,
        data: {
          ...firstAccount,
          currentBalance: Number(firstAccount.currentBalance),
        },
      }
    }

    return {
      success: true,
      data: {
        ...account,
        currentBalance: Number(account.currentBalance),
      },
    }
  } catch (error) {
    console.error("Error fetching default account:", error instanceof Error ? error.message : "Unknown error")
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch default account",
    }
  }
}

// Get bank info (from HEAD)
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
    console.error("Error fetching bank info:", error instanceof Error ? error.message : "Unknown error")
    return null
  }
}

// Update account balance (from HEAD)
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
    console.error("Error updating account balance:", error instanceof Error ? error.message : "Unknown error")
    return { success: false, error: "Failed to update balance" }
  }
}

// Reconcile account (from HEAD)
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

    revalidatePath("/finance/banking")

    return { success: true }
  } catch (error) {
    console.error("Error reconciling account:", error instanceof Error ? error.message : "Unknown error")
    return { success: false, error: "Failed to reconcile account" }
  }
}
