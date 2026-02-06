"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { auth } from "@/auth"
import { TransactionType, TransactionSourceType } from "@prisma/client"
import { z } from "zod"
import { parse } from "csv-parse/sync"

// Validation schemas
const createTransactionSchema = z.object({
  bankAccountId: z.string().min(1, "Bank account is required"),
  type: z.enum(["CREDIT", "DEBIT"]),
  amount: z.number().positive("Amount must be positive"),
  description: z.string().optional(),
  reference: z.string().optional(),
  transactionDate: z.date().optional(),
  sourceType: z.enum(["EXPENSE", "PAYROLL", "CUSTOMS", "INVOICE", "MANUAL"]).optional(),
  sourceId: z.string().optional(),
})

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>

// Response types
export interface TransactionRecord {
  id: string
  transactionRef: string
  type: TransactionType
  amount: number
  balanceAfter: number | null
  description: string | null
  reference: string | null
  transactionDate: Date
  sourceType: TransactionSourceType | null
  sourceId: string | null
  isReconciled: boolean
  reconciledAt: Date | null
  bankAccountId: string
  createdAt: Date
  updatedAt: Date
  bankAccount?: {
    id: string
    accountName: string
    bankName: string
  }
}

export interface TransactionListResponse {
  data: TransactionRecord[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface TransactionFilters {
  accountId?: string
  startDate?: Date
  endDate?: Date
  type?: TransactionType
  sourceType?: TransactionSourceType
  isReconciled?: boolean
  minAmount?: number
  maxAmount?: number
  search?: string
}

// Generate unique transaction reference
function generateTransactionRef(): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "")
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `TXN-${dateStr}-${random}`
}

// Get transactions with filtering and pagination
export async function getTransactions(params: {
  filters?: TransactionFilters
  page?: number
  pageSize?: number
}): Promise<{
  success: boolean
  data?: TransactionListResponse
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const page = params.page || 1
    const pageSize = params.pageSize || 20
    const skip = (page - 1) * pageSize

    // Build where clause
    const where: Record<string, unknown> = {
      bankAccount: {
        userId: session.user.id,
      },
    }

    if (params.filters) {
      const f = params.filters

      if (f.accountId) {
        where.bankAccountId = f.accountId
      }

      if (f.type) {
        where.type = f.type
      }

      if (f.sourceType) {
        where.sourceType = f.sourceType
      }

      if (f.isReconciled !== undefined) {
        where.isReconciled = f.isReconciled
      }

      if (f.startDate || f.endDate) {
        where.transactionDate = {}
        if (f.startDate) {
          (where.transactionDate as Record<string, Date>).gte = f.startDate
        }
        if (f.endDate) {
          (where.transactionDate as Record<string, Date>).lte = f.endDate
        }
      }

      if (f.minAmount || f.maxAmount) {
        where.amount = {}
        if (f.minAmount) {
          (where.amount as Record<string, number>).gte = f.minAmount
        }
        if (f.maxAmount) {
          (where.amount as Record<string, number>).lte = f.maxAmount
        }
      }

      if (f.search) {
        where.OR = [
          { description: { contains: f.search, mode: "insensitive" } },
          { reference: { contains: f.search, mode: "insensitive" } },
          { transactionRef: { contains: f.search, mode: "insensitive" } },
        ]
      }
    }

    const [transactions, total] = await Promise.all([
      db.bankTransaction.findMany({
        where,
        include: {
          bankAccount: {
            select: {
              id: true,
              accountName: true,
              bankName: true,
            },
          },
        },
        orderBy: { transactionDate: "desc" },
        skip,
        take: pageSize,
      }),
      db.bankTransaction.count({ where }),
    ])

    return {
      success: true,
      data: {
        data: transactions.map((t) => ({
          ...t,
          amount: Number(t.amount),
          balanceAfter: t.balanceAfter ? Number(t.balanceAfter) : null,
        })),
        total,
        page,
        pageSize,
        hasMore: skip + transactions.length < total,
      },
    }
  } catch (error) {
    console.error("Error fetching transactions:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch transactions",
    }
  }
}

// Get transactions for a specific account
export async function getAccountTransactions(params: {
  accountId: string
  page?: number
  pageSize?: number
}): Promise<{
  success: boolean
  data?: TransactionListResponse
  error?: string
}> {
  return getTransactions({
    filters: { accountId: params.accountId },
    page: params.page,
    pageSize: params.pageSize,
  })
}

// Get a single transaction
export async function getTransaction(transactionId: string): Promise<{
  success: boolean
  data?: TransactionRecord
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const transaction = await db.bankTransaction.findFirst({
      where: {
        id: transactionId,
        bankAccount: {
          userId: session.user.id,
        },
      },
      include: {
        bankAccount: {
          select: {
            id: true,
            accountName: true,
            bankName: true,
          },
        },
      },
    })

    if (!transaction) {
      return { success: false, error: "Transaction not found" }
    }

    return {
      success: true,
      data: {
        ...transaction,
        amount: Number(transaction.amount),
        balanceAfter: transaction.balanceAfter
          ? Number(transaction.balanceAfter)
          : null,
      },
    }
  } catch (error) {
    console.error("Error fetching transaction:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch transaction",
    }
  }
}

// Create a manual transaction
export async function createTransaction(
  input: CreateTransactionInput
): Promise<{
  success: boolean
  data?: TransactionRecord
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const validated = createTransactionSchema.parse(input)

    // Verify account ownership
    const account = await db.bankAccount.findFirst({
      where: {
        id: validated.bankAccountId,
        userId: session.user.id,
        isActive: true,
      },
    })

    if (!account) {
      return { success: false, error: "Bank account not found" }
    }

    // Calculate new balance
    const currentBalance = Number(account.currentBalance)
    const newBalance =
      validated.type === "CREDIT"
        ? currentBalance + validated.amount
        : currentBalance - validated.amount

    // Create transaction and update balance in a single transaction
    const result = await db.$transaction(async (tx) => {
      const transaction = await tx.bankTransaction.create({
        data: {
          transactionRef: generateTransactionRef(),
          type: validated.type,
          amount: validated.amount,
          balanceAfter: newBalance,
          description: validated.description,
          reference: validated.reference,
          transactionDate: validated.transactionDate || new Date(),
          sourceType: validated.sourceType || "MANUAL",
          sourceId: validated.sourceId,
          bankAccountId: validated.bankAccountId,
        },
        include: {
          bankAccount: {
            select: {
              id: true,
              accountName: true,
              bankName: true,
            },
          },
        },
      })

      await tx.bankAccount.update({
        where: { id: validated.bankAccountId },
        data: { currentBalance: newBalance },
      })

      return transaction
    })

    revalidatePath("/finance/banking")

    return {
      success: true,
      data: {
        ...result,
        amount: Number(result.amount),
        balanceAfter: result.balanceAfter ? Number(result.balanceAfter) : null,
      },
    }
  } catch (error) {
    console.error("Error creating transaction:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Validation error" }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create transaction",
    }
  }
}

// Reconcile a transaction
export async function reconcileTransaction(
  transactionId: string,
  reconciled: boolean = true
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Verify ownership
    const transaction = await db.bankTransaction.findFirst({
      where: {
        id: transactionId,
        bankAccount: {
          userId: session.user.id,
        },
      },
    })

    if (!transaction) {
      return { success: false, error: "Transaction not found" }
    }

    await db.bankTransaction.update({
      where: { id: transactionId },
      data: {
        isReconciled: reconciled,
        reconciledAt: reconciled ? new Date() : null,
      },
    })

    revalidatePath("/finance/banking")

    return { success: true }
  } catch (error) {
    console.error("Error reconciling transaction:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reconcile transaction",
    }
  }
}

// Batch reconcile transactions
export async function batchReconcileTransactions(
  transactionIds: string[],
  reconciled: boolean = true
): Promise<{
  success: boolean
  count?: number
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const result = await db.bankTransaction.updateMany({
      where: {
        id: { in: transactionIds },
        bankAccount: {
          userId: session.user.id,
        },
      },
      data: {
        isReconciled: reconciled,
        reconciledAt: reconciled ? new Date() : null,
      },
    })

    revalidatePath("/finance/banking")

    return { success: true, count: result.count }
  } catch (error) {
    console.error("Error batch reconciling transactions:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reconcile transactions",
    }
  }
}

// Import bank statement (CSV)
export async function importBankStatement(params: {
  bankAccountId: string
  csvContent: string
  dateColumn?: string
  amountColumn?: string
  descriptionColumn?: string
  referenceColumn?: string
}): Promise<{
  success: boolean
  imported?: number
  errors?: string[]
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Verify account ownership
    const account = await db.bankAccount.findFirst({
      where: {
        id: params.bankAccountId,
        userId: session.user.id,
        isActive: true,
      },
    })

    if (!account) {
      return { success: false, error: "Bank account not found" }
    }

    // Parse CSV
    let records: Record<string, string>[]
    try {
      records = parse(params.csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      })
    } catch {
      return { success: false, error: "Failed to parse CSV file" }
    }

    if (records.length === 0) {
      return { success: false, error: "No records found in CSV" }
    }

    // Determine column names
    const dateCol = params.dateColumn || "Date" || "date" || "DATE"
    const amountCol = params.amountColumn || "Amount" || "amount" || "AMOUNT"
    const descCol = params.descriptionColumn || "Description" || "description" || "DESC"
    const refCol = params.referenceColumn || "Reference" || "reference" || "REF"

    const errors: string[] = []
    const transactions: {
      transactionRef: string
      type: TransactionType
      amount: number
      description: string | null
      reference: string | null
      transactionDate: Date
      sourceType: TransactionSourceType
      bankAccountId: string
    }[] = []

    let currentBalance = Number(account.currentBalance)

    for (let i = 0; i < records.length; i++) {
      const record = records[i]
      if (!record) continue
      const rowNum = i + 2 // Account for header row

      // Parse amount
      const amountStr = record[amountCol]
      if (!amountStr) {
        errors.push(`Row ${rowNum}: Missing amount`)
        continue
      }

      const amount = parseFloat(amountStr.replace(/[^0-9.-]/g, ""))
      if (isNaN(amount) || amount === 0) {
        errors.push(`Row ${rowNum}: Invalid amount "${amountStr}"`)
        continue
      }

      // Parse date
      const dateStr = record[dateCol]
      let transactionDate: Date
      try {
        transactionDate = dateStr ? new Date(dateStr) : new Date()
        if (isNaN(transactionDate.getTime())) {
          transactionDate = new Date()
        }
      } catch {
        transactionDate = new Date()
      }

      // Determine transaction type
      const type: TransactionType = amount >= 0 ? "CREDIT" : "DEBIT"
      const absAmount = Math.abs(amount)

      transactions.push({
        transactionRef: generateTransactionRef(),
        type,
        amount: absAmount,
        description: record[descCol] ?? null,
        reference: record[refCol] ?? null,
        transactionDate,
        sourceType: "MANUAL",
        bankAccountId: params.bankAccountId,
      })

      // Update running balance
      currentBalance += amount
    }

    if (transactions.length === 0) {
      return { success: false, error: "No valid transactions found", errors }
    }

    // Insert transactions and update balance
    await db.$transaction(async (tx) => {
      await tx.bankTransaction.createMany({
        data: transactions,
      })

      await tx.bankAccount.update({
        where: { id: params.bankAccountId },
        data: { currentBalance },
      })
    })

    revalidatePath("/finance/banking")

    return {
      success: true,
      imported: transactions.length,
      errors: errors.length > 0 ? errors : undefined,
    }
  } catch (error) {
    console.error("Error importing bank statement:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to import statement",
    }
  }
}

// Get unreconciled transactions count
export async function getUnreconciledCount(accountId?: string): Promise<{
  success: boolean
  count?: number
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const count = await db.bankTransaction.count({
      where: {
        bankAccount: {
          userId: session.user.id,
          ...(accountId ? { id: accountId } : {}),
        },
        isReconciled: false,
      },
    })

    return { success: true, count }
  } catch (error) {
    console.error("Error fetching unreconciled count:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch count",
    }
  }
}

// Get transaction summary by type
export async function getTransactionSummary(params: {
  accountId?: string
  startDate?: Date
  endDate?: Date
}): Promise<{
  success: boolean
  data?: {
    totalCredits: number
    totalDebits: number
    netChange: number
    transactionCount: number
  }
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const where: Record<string, unknown> = {
      bankAccount: {
        userId: session.user.id,
        ...(params.accountId ? { id: params.accountId } : {}),
      },
    }

    if (params.startDate || params.endDate) {
      where.transactionDate = {}
      if (params.startDate) {
        (where.transactionDate as Record<string, Date>).gte = params.startDate
      }
      if (params.endDate) {
        (where.transactionDate as Record<string, Date>).lte = params.endDate
      }
    }

    const [credits, debits, count] = await Promise.all([
      db.bankTransaction.aggregate({
        where: { ...where, type: "CREDIT" },
        _sum: { amount: true },
      }),
      db.bankTransaction.aggregate({
        where: { ...where, type: "DEBIT" },
        _sum: { amount: true },
      }),
      db.bankTransaction.count({ where }),
    ])

    const totalCredits = Number(credits._sum.amount || 0)
    const totalDebits = Number(debits._sum.amount || 0)

    return {
      success: true,
      data: {
        totalCredits,
        totalDebits,
        netChange: totalCredits - totalDebits,
        transactionCount: count,
      },
    }
  } catch (error) {
    console.error("Error fetching transaction summary:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch summary",
    }
  }
}
