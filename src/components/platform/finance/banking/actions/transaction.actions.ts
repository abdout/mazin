"use server"

/**
 * Transaction Actions - Full Prisma Implementation
 * Manages financial transactions for customs clearance
 */

import { revalidatePath } from "next/cache"

import { auth } from "@/auth"
import { db } from "@/lib/db"

// Types
export interface Transaction {
  id: string
  transactionDate: Date
  description: string
  reference?: string | null
  type: string
  category: string
  amount: number
  currency: string
  balanceAfter?: number | null
  status: string
  invoiceId?: string | null
  expenseId?: string | null
  shipmentId?: string | null
  clientId?: string | null
  bankAccountId: string
  bankAccount?: {
    accountName: string
    bankName: string
  }
  createdAt: Date
}

export interface TransactionFilters {
  bankAccountId?: string
  type?: "CREDIT" | "DEBIT" | "TRANSFER"
  category?: string
  status?: string
  startDate?: Date
  endDate?: Date
  search?: string
  page?: number
  limit?: number
}

export interface TransactionListResponse {
  data: Transaction[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// ============================================================================
// TRANSACTION QUERIES
// ============================================================================

export async function getTransactions(params: {
  userId?: string
  filters?: TransactionFilters
  page?: number
  pageSize?: number
}): Promise<TransactionListResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return { data: [], total: 0, page: 1, pageSize: 20, hasMore: false }
  }

  try {
    const page = params.page || 1
    const pageSize = params.pageSize || 20
    const skip = (page - 1) * pageSize
    const filters = params.filters

    const where: any = { userId: session.user.id }

    if (filters?.bankAccountId) {
      where.bankAccountId = filters.bankAccountId
    }

    if (filters?.type) {
      where.type = filters.type
    }

    if (filters?.category) {
      where.category = filters.category
    }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.startDate || filters?.endDate) {
      where.transactionDate = {}
      if (filters.startDate) where.transactionDate.gte = filters.startDate
      if (filters.endDate) where.transactionDate.lte = filters.endDate
    }

    if (filters?.search) {
      where.OR = [
        { description: { contains: filters.search, mode: "insensitive" } },
        { reference: { contains: filters.search, mode: "insensitive" } },
      ]
    }

    const [transactions, total] = await Promise.all([
      db.transaction.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { transactionDate: "desc" },
        include: {
          bankAccount: {
            select: { accountName: true, bankName: true },
          },
        },
      }),
      db.transaction.count({ where }),
    ])

    return {
      data: transactions.map((t) => ({
        id: t.id,
        transactionDate: t.transactionDate,
        description: t.description,
        reference: t.reference,
        type: t.type,
        category: t.category,
        amount: Number(t.amount),
        currency: t.currency,
        balanceAfter: t.balanceAfter ? Number(t.balanceAfter) : null,
        status: t.status,
        invoiceId: t.invoiceId,
        expenseId: t.expenseId,
        shipmentId: t.shipmentId,
        clientId: t.clientId,
        bankAccountId: t.bankAccountId,
        bankAccount: t.bankAccount,
        createdAt: t.createdAt,
      })),
      total,
      page,
      pageSize,
      hasMore: skip + transactions.length < total,
    }
  } catch (error) {
    console.error("Error fetching transactions:", error)
    return { data: [], total: 0, page: 1, pageSize: 20, hasMore: false }
  }
}

export async function getTransaction(transactionId: string): Promise<Transaction | null> {
  const session = await auth()
  if (!session?.user?.id) {
    return null
  }

  try {
    const transaction = await db.transaction.findFirst({
      where: { id: transactionId, userId: session.user.id },
      include: {
        bankAccount: {
          select: { accountName: true, bankName: true },
        },
      },
    })

    if (!transaction) return null

    return {
      id: transaction.id,
      transactionDate: transaction.transactionDate,
      description: transaction.description,
      reference: transaction.reference,
      type: transaction.type,
      category: transaction.category,
      amount: Number(transaction.amount),
      currency: transaction.currency,
      balanceAfter: transaction.balanceAfter ? Number(transaction.balanceAfter) : null,
      status: transaction.status,
      invoiceId: transaction.invoiceId,
      expenseId: transaction.expenseId,
      shipmentId: transaction.shipmentId,
      clientId: transaction.clientId,
      bankAccountId: transaction.bankAccountId,
      bankAccount: transaction.bankAccount,
      createdAt: transaction.createdAt,
    }
  } catch (error) {
    console.error("Error fetching transaction:", error)
    return null
  }
}

export async function getTransactionsByAccount(params: {
  accountId: string
  page?: number
  pageSize?: number
}): Promise<TransactionListResponse> {
  return getTransactions({
    filters: { bankAccountId: params.accountId },
    page: params.page,
    pageSize: params.pageSize,
  })
}

// ============================================================================
// TRANSACTION CRUD
// ============================================================================

export async function createTransaction(params: {
  bankAccountId: string
  description: string
  amount: number
  type: "CREDIT" | "DEBIT"
  category: string
  reference?: string
  transactionDate?: Date
  invoiceId?: string
  expenseId?: string
  shipmentId?: string
  clientId?: string
}): Promise<{ success: boolean; data?: Transaction; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    // Verify bank account ownership
    const bankAccount = await db.bankAccount.findFirst({
      where: { id: params.bankAccountId, userId: session.user.id },
    })

    if (!bankAccount) {
      return { success: false, error: "Bank account not found" }
    }

    // Calculate new balance
    const currentBalance = Number(bankAccount.currentBalance)
    const newBalance = params.type === "CREDIT"
      ? currentBalance + params.amount
      : currentBalance - params.amount

    // Create transaction and update balance atomically
    const result = await db.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          transactionDate: params.transactionDate || new Date(),
          description: params.description,
          reference: params.reference,
          type: params.type,
          category: params.category as any,
          amount: params.amount,
          currency: bankAccount.currency,
          balanceAfter: newBalance,
          status: "COMPLETED",
          invoiceId: params.invoiceId,
          expenseId: params.expenseId,
          shipmentId: params.shipmentId,
          clientId: params.clientId,
          bankAccountId: params.bankAccountId,
          userId: session.user.id,
        },
        include: {
          bankAccount: {
            select: { accountName: true, bankName: true },
          },
        },
      })

      await tx.bankAccount.update({
        where: { id: params.bankAccountId },
        data: {
          currentBalance: newBalance,
          availableBalance: newBalance,
        },
      })

      return transaction
    })

    revalidatePath("/finance/banking")
    revalidatePath("/finance/dashboard")

    return {
      success: true,
      data: {
        id: result.id,
        transactionDate: result.transactionDate,
        description: result.description,
        reference: result.reference,
        type: result.type,
        category: result.category,
        amount: Number(result.amount),
        currency: result.currency,
        balanceAfter: result.balanceAfter ? Number(result.balanceAfter) : null,
        status: result.status,
        invoiceId: result.invoiceId,
        expenseId: result.expenseId,
        shipmentId: result.shipmentId,
        clientId: result.clientId,
        bankAccountId: result.bankAccountId,
        bankAccount: result.bankAccount,
        createdAt: result.createdAt,
      },
    }
  } catch (error) {
    console.error("Error creating transaction:", error)
    return { success: false, error: "Failed to create transaction" }
  }
}

export async function categorizeTransaction(params: {
  transactionId: string
  category: string
  subcategory?: string
}): Promise<Transaction | null> {
  const session = await auth()
  if (!session?.user?.id) {
    return null
  }

  try {
    const transaction = await db.transaction.update({
      where: { id: params.transactionId },
      data: {
        category: params.category as any,
      },
      include: {
        bankAccount: {
          select: { accountName: true, bankName: true },
        },
      },
    })

    revalidatePath("/finance/banking")

    return {
      id: transaction.id,
      transactionDate: transaction.transactionDate,
      description: transaction.description,
      reference: transaction.reference,
      type: transaction.type,
      category: transaction.category,
      amount: Number(transaction.amount),
      currency: transaction.currency,
      balanceAfter: transaction.balanceAfter ? Number(transaction.balanceAfter) : null,
      status: transaction.status,
      invoiceId: transaction.invoiceId,
      expenseId: transaction.expenseId,
      shipmentId: transaction.shipmentId,
      clientId: transaction.clientId,
      bankAccountId: transaction.bankAccountId,
      bankAccount: transaction.bankAccount,
      createdAt: transaction.createdAt,
    }
  } catch (error) {
    console.error("Error categorizing transaction:", error)
    return null
  }
}

export async function deleteTransaction(
  transactionId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const transaction = await db.transaction.findFirst({
      where: { id: transactionId, userId: session.user.id },
    })

    if (!transaction) {
      return { success: false, error: "Transaction not found" }
    }

    if (transaction.status === "RECONCILED") {
      return { success: false, error: "Cannot delete a reconciled transaction" }
    }

    // Reverse the balance change
    const amount = Number(transaction.amount)
    const reverseAmount = transaction.type === "CREDIT" ? -amount : amount

    await db.$transaction(async (tx) => {
      await tx.transaction.delete({ where: { id: transactionId } })

      await tx.bankAccount.update({
        where: { id: transaction.bankAccountId },
        data: {
          currentBalance: { increment: reverseAmount },
          availableBalance: { increment: reverseAmount },
        },
      })
    })

    revalidatePath("/finance/banking")
    revalidatePath("/finance/dashboard")

    return { success: true }
  } catch (error) {
    console.error("Error deleting transaction:", error)
    return { success: false, error: "Failed to delete transaction" }
  }
}

// ============================================================================
// PAYMENT RECORDING
// ============================================================================

export async function recordInvoicePayment(params: {
  invoiceId: string
  bankAccountId: string
  amount: number
  paymentDate?: Date
  reference?: string
}): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    // Verify invoice ownership
    const invoice = await db.invoice.findFirst({
      where: { id: params.invoiceId, userId: session.user.id },
      include: { client: { select: { companyName: true } } },
    })

    if (!invoice) {
      return { success: false, error: "Invoice not found" }
    }

    if (invoice.status === "PAID") {
      return { success: false, error: "Invoice is already paid" }
    }

    // Create transaction and update invoice
    await db.$transaction(async (tx) => {
      // Get bank account
      const bankAccount = await tx.bankAccount.findFirst({
        where: { id: params.bankAccountId, userId: session.user.id },
      })

      if (!bankAccount) {
        throw new Error("Bank account not found")
      }

      const newBalance = Number(bankAccount.currentBalance) + params.amount

      // Create transaction
      await tx.transaction.create({
        data: {
          transactionDate: params.paymentDate || new Date(),
          description: `Payment received: ${invoice.invoiceNumber} - ${invoice.client?.companyName || "Client"}`,
          reference: params.reference,
          type: "CREDIT",
          category: "INVOICE_PAYMENT",
          amount: params.amount,
          currency: invoice.currency,
          balanceAfter: newBalance,
          status: "COMPLETED",
          invoiceId: params.invoiceId,
          clientId: invoice.clientId,
          bankAccountId: params.bankAccountId,
          userId: session.user.id,
        },
      })

      // Update bank balance
      await tx.bankAccount.update({
        where: { id: params.bankAccountId },
        data: {
          currentBalance: newBalance,
          availableBalance: newBalance,
        },
      })

      // Update invoice status
      const invoiceTotal = Number(invoice.total)
      const newStatus = params.amount >= invoiceTotal ? "PAID" : "SENT"

      await tx.invoice.update({
        where: { id: params.invoiceId },
        data: {
          status: newStatus,
          paidAt: newStatus === "PAID" ? new Date() : null,
        },
      })
    })

    revalidatePath("/finance/banking")
    revalidatePath("/finance/invoice")
    revalidatePath("/finance/dashboard")

    return { success: true }
  } catch (error) {
    console.error("Error recording payment:", error)
    return { success: false, error: "Failed to record payment" }
  }
}

// ============================================================================
// TRANSACTION STATS
// ============================================================================

export async function getTransactionStats(dateRange?: {
  startDate: Date
  endDate: Date
}): Promise<{
  totalIncome: number
  totalExpenses: number
  netFlow: number
  transactionCount: number
  byCategory: { category: string; amount: number; count: number }[]
}> {
  const session = await auth()
  if (!session?.user?.id) {
    return {
      totalIncome: 0,
      totalExpenses: 0,
      netFlow: 0,
      transactionCount: 0,
      byCategory: [],
    }
  }

  try {
    const where: any = { userId: session.user.id }

    if (dateRange) {
      where.transactionDate = {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      }
    }

    const [credits, debits, byCategory, count] = await Promise.all([
      db.transaction.aggregate({
        where: { ...where, type: "CREDIT" },
        _sum: { amount: true },
      }),
      db.transaction.aggregate({
        where: { ...where, type: "DEBIT" },
        _sum: { amount: true },
      }),
      db.transaction.groupBy({
        by: ["category"],
        where,
        _sum: { amount: true },
        _count: true,
      }),
      db.transaction.count({ where }),
    ])

    const totalIncome = Number(credits._sum.amount || 0)
    const totalExpenses = Number(debits._sum.amount || 0)

    return {
      totalIncome,
      totalExpenses,
      netFlow: totalIncome - totalExpenses,
      transactionCount: count,
      byCategory: byCategory.map((c) => ({
        category: c.category,
        amount: Number(c._sum.amount || 0),
        count: c._count,
      })),
    }
  } catch (error) {
    console.error("Error fetching transaction stats:", error)
    return {
      totalIncome: 0,
      totalExpenses: 0,
      netFlow: 0,
      transactionCount: 0,
      byCategory: [],
    }
  }
}
