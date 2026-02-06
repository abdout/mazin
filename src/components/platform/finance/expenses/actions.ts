"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { auth } from "@/auth"
import { ExpenseStatus } from "@prisma/client"
import { z } from "zod"

// Types
type ActionResult<T = void> = {
  success: boolean
  data?: T
  error?: string
}

// Validation schemas
const createExpenseSchema = z.object({
  categoryId: z.string().optional(),
  amount: z.number().positive("Amount must be positive"),
  description: z.string().min(1, "Description is required"),
  vendor: z.string().optional(),
  expenseDate: z.date().optional(),
  receiptUrl: z.string().optional(),
  receiptNumber: z.string().optional(),
  notes: z.string().optional(),
  shipmentId: z.string().optional(),
  bankAccountId: z.string().optional(),
})

const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  nameAr: z.string().optional(),
  code: z.string().min(1, "Code is required"),
  description: z.string().optional(),
  monthlyBudget: z.number().optional(),
})

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>
export type CreateCategoryInput = z.infer<typeof createCategorySchema>

// Helper: Generate expense number
function generateExpenseNumber(): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "")
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `EXP-${dateStr}-${random}`
}

// ============================================
// EXPENSE CATEGORY MANAGEMENT
// ============================================

export async function getExpenseCategories(): Promise<ActionResult<unknown[]>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const categories = await db.expenseCategory.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    })

    return {
      success: true,
      data: categories.map((c) => ({
        ...c,
        monthlyBudget: c.monthlyBudget ? Number(c.monthlyBudget) : null,
      })),
    }
  } catch (error) {
    console.error("Error fetching categories:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch categories",
    }
  }
}

export async function createExpenseCategory(
  input: CreateCategoryInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const validated = createCategorySchema.parse(input)

    const category = await db.expenseCategory.create({
      data: {
        name: validated.name,
        nameAr: validated.nameAr,
        code: validated.code,
        description: validated.description,
        monthlyBudget: validated.monthlyBudget,
        isActive: true,
      },
    })

    revalidatePath("/finance/expenses")

    return { success: true, data: { id: category.id } }
  } catch (error) {
    console.error("Error creating category:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Validation error" }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create category",
    }
  }
}

// ============================================
// EXPENSE MANAGEMENT
// ============================================

export async function getExpenses(params?: {
  status?: ExpenseStatus
  categoryId?: string
  shipmentId?: string
  startDate?: Date
  endDate?: Date
  page?: number
  pageSize?: number
}): Promise<ActionResult<{
  data: unknown[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const page = params?.page || 1
    const pageSize = params?.pageSize || 20
    const skip = (page - 1) * pageSize

    const where: Record<string, unknown> = {}

    if (params?.status) where.status = params.status
    if (params?.categoryId) where.categoryId = params.categoryId
    if (params?.shipmentId) where.shipmentId = params.shipmentId

    if (params?.startDate || params?.endDate) {
      where.expenseDate = {}
      if (params.startDate) {
        (where.expenseDate as Record<string, Date>).gte = params.startDate
      }
      if (params.endDate) {
        (where.expenseDate as Record<string, Date>).lte = params.endDate
      }
    }

    const [expenses, total] = await Promise.all([
      db.expense.findMany({
        where,
        include: {
          category: true,
          shipment: {
            select: {
              id: true,
              shipmentNumber: true,
              description: true,
            },
          },
          submittedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          approvedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      db.expense.count({ where }),
    ])

    return {
      success: true,
      data: {
        data: expenses.map((e) => ({
          ...e,
          amount: Number(e.amount),
        })),
        total,
        page,
        pageSize,
        hasMore: skip + expenses.length < total,
      },
    }
  } catch (error) {
    console.error("Error fetching expenses:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch expenses",
    }
  }
}

export async function getExpense(expenseId: string): Promise<ActionResult<unknown>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const expense = await db.expense.findUnique({
      where: { id: expenseId },
      include: {
        category: true,
        shipment: {
          select: {
            id: true,
            shipmentNumber: true,
            description: true,
          },
        },
        submittedByUser: {
          select: { id: true, name: true, email: true },
        },
        approvedByUser: {
          select: { id: true, name: true, email: true },
        },
        transaction: true,
        bankAccount: {
          select: { id: true, accountName: true, bankName: true },
        },
      },
    })

    if (!expense) {
      return { success: false, error: "Expense not found" }
    }

    return {
      success: true,
      data: {
        ...expense,
        amount: Number(expense.amount),
      },
    }
  } catch (error) {
    console.error("Error fetching expense:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch expense",
    }
  }
}

export async function createExpense(
  input: CreateExpenseInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const validated = createExpenseSchema.parse(input)

    const expense = await db.expense.create({
      data: {
        expenseNumber: generateExpenseNumber(),
        amount: validated.amount,
        totalAmount: validated.amount,
        description: validated.description,
        vendor: validated.vendor,
        expenseDate: validated.expenseDate || new Date(),
        receiptUrl: validated.receiptUrl,
        receiptNumber: validated.receiptNumber,
        notes: validated.notes,
        categoryId: validated.categoryId,
        shipmentId: validated.shipmentId,
        bankAccountId: validated.bankAccountId,
        submittedById: session.user.id,
        status: "PENDING",
      },
    })

    revalidatePath("/finance/expenses")

    return { success: true, data: { id: expense.id } }
  } catch (error) {
    console.error("Error creating expense:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Validation error" }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create expense",
    }
  }
}

export async function updateExpense(
  expenseId: string,
  input: Partial<CreateExpenseInput>
): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const expense = await db.expense.findUnique({
      where: { id: expenseId },
    })

    if (!expense) {
      return { success: false, error: "Expense not found" }
    }

    if (expense.status !== "PENDING") {
      return { success: false, error: "Only pending expenses can be edited" }
    }

    await db.expense.update({
      where: { id: expenseId },
      data: input,
    })

    revalidatePath("/finance/expenses")

    return { success: true }
  } catch (error) {
    console.error("Error updating expense:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update expense",
    }
  }
}

export async function deleteExpense(expenseId: string): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const expense = await db.expense.findUnique({
      where: { id: expenseId },
    })

    if (!expense) {
      return { success: false, error: "Expense not found" }
    }

    if (expense.status === "PAID") {
      return { success: false, error: "Paid expenses cannot be deleted" }
    }

    await db.expense.delete({
      where: { id: expenseId },
    })

    revalidatePath("/finance/expenses")

    return { success: true }
  } catch (error) {
    console.error("Error deleting expense:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete expense",
    }
  }
}

// ============================================
// APPROVAL WORKFLOW
// ============================================

export async function approveExpense(expenseId: string): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const expense = await db.expense.findUnique({
      where: { id: expenseId },
    })

    if (!expense) {
      return { success: false, error: "Expense not found" }
    }

    if (expense.status !== "PENDING") {
      return { success: false, error: "Expense is not pending approval" }
    }

    await db.expense.update({
      where: { id: expenseId },
      data: {
        status: "APPROVED",
        approvedById: session.user.id,
        approvedAt: new Date(),
      },
    })

    revalidatePath("/finance/expenses")

    return { success: true }
  } catch (error) {
    console.error("Error approving expense:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to approve expense",
    }
  }
}

export async function rejectExpense(
  expenseId: string,
  reason: string
): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const expense = await db.expense.findUnique({
      where: { id: expenseId },
    })

    if (!expense) {
      return { success: false, error: "Expense not found" }
    }

    if (expense.status !== "PENDING") {
      return { success: false, error: "Expense is not pending approval" }
    }

    await db.expense.update({
      where: { id: expenseId },
      data: {
        status: "REJECTED",
        approvedById: session.user.id,
        approvedAt: new Date(),
        rejectedReason: reason,
      },
    })

    revalidatePath("/finance/expenses")

    return { success: true }
  } catch (error) {
    console.error("Error rejecting expense:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reject expense",
    }
  }
}

// ============================================
// PAYMENT PROCESSING
// ============================================

export async function markExpenseAsPaid(
  expenseId: string,
  bankAccountId: string
): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const expense = await db.expense.findUnique({
      where: { id: expenseId },
    })

    if (!expense) {
      return { success: false, error: "Expense not found" }
    }

    if (expense.status !== "APPROVED") {
      return { success: false, error: "Expense must be approved before payment" }
    }

    const bankAccount = await db.bankAccount.findFirst({
      where: {
        id: bankAccountId,
        userId: session.user.id,
        isActive: true,
      },
    })

    if (!bankAccount) {
      return { success: false, error: "Bank account not found" }
    }

    const amount = Number(expense.amount)
    const currentBalance = Number(bankAccount.currentBalance)
    const newBalance = currentBalance - amount

    await db.$transaction(async (tx) => {
      // Create bank transaction
      const transaction = await tx.bankTransaction.create({
        data: {
          transactionRef: `EXP-${expense.expenseNumber}`,
          type: "DEBIT",
          amount,
          balanceAfter: newBalance,
          description: `Expense payment - ${expense.description}`,
          reference: expense.expenseNumber,
          transactionDate: new Date(),
          sourceType: "EXPENSE",
          sourceId: expense.id,
          bankAccountId,
        },
      })

      // Update expense
      await tx.expense.update({
        where: { id: expenseId },
        data: {
          status: "PAID",
          transactionId: transaction.id,
          bankAccountId,
          paidAt: new Date(),
        },
      })

      // Update bank account balance
      await tx.bankAccount.update({
        where: { id: bankAccountId },
        data: { currentBalance: newBalance },
      })
    })

    revalidatePath("/finance/expenses")
    revalidatePath("/finance/banking")

    return { success: true }
  } catch (error) {
    console.error("Error marking expense as paid:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process payment",
    }
  }
}

// ============================================
// REPORTING
// ============================================

export async function getExpenseSummary(params?: {
  startDate?: Date
  endDate?: Date
}): Promise<ActionResult<{
  totalExpenses: number
  pendingExpenses: number
  approvedExpenses: number
  paidExpenses: number
  totalPendingAmount: number
  totalApprovedAmount: number
  totalPaidAmount: number
  byCategory: { categoryId: string; name: string; total: number }[]
}>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const dateFilter: Record<string, unknown> = {}
    if (params?.startDate || params?.endDate) {
      dateFilter.expenseDate = {}
      if (params.startDate) {
        (dateFilter.expenseDate as Record<string, Date>).gte = params.startDate
      }
      if (params.endDate) {
        (dateFilter.expenseDate as Record<string, Date>).lte = params.endDate
      }
    }

    const [
      totalExpenses,
      pendingExpenses,
      approvedExpenses,
      paidExpenses,
      pendingAmount,
      approvedAmount,
      paidAmount,
      byCategory,
    ] = await Promise.all([
      db.expense.count({ where: dateFilter }),
      db.expense.count({ where: { ...dateFilter, status: "PENDING" } }),
      db.expense.count({ where: { ...dateFilter, status: "APPROVED" } }),
      db.expense.count({ where: { ...dateFilter, status: "PAID" } }),
      db.expense.aggregate({
        where: { ...dateFilter, status: "PENDING" },
        _sum: { amount: true },
      }),
      db.expense.aggregate({
        where: { ...dateFilter, status: "APPROVED" },
        _sum: { amount: true },
      }),
      db.expense.aggregate({
        where: { ...dateFilter, status: "PAID" },
        _sum: { amount: true },
      }),
      db.expense.groupBy({
        by: ["categoryId"],
        where: dateFilter,
        _sum: { amount: true },
      }),
    ])

    // Get category names
    const categoryIds = byCategory
      .map((c) => c.categoryId)
      .filter((id): id is string => id !== null)

    const categories = await db.expenseCategory.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    })

    const categoryMap = new Map(categories.map((c) => [c.id, c.name]))

    return {
      success: true,
      data: {
        totalExpenses,
        pendingExpenses,
        approvedExpenses,
        paidExpenses,
        totalPendingAmount: Number(pendingAmount._sum.amount || 0),
        totalApprovedAmount: Number(approvedAmount._sum.amount || 0),
        totalPaidAmount: Number(paidAmount._sum.amount || 0),
        byCategory: byCategory.map((c) => ({
          categoryId: c.categoryId || "uncategorized",
          name: c.categoryId ? categoryMap.get(c.categoryId) || "Unknown" : "Uncategorized",
          total: Number(c._sum.amount || 0),
        })),
      },
    }
  } catch (error) {
    console.error("Error fetching expense summary:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch summary",
    }
  }
}

export async function getExpensesByShipment(
  shipmentId: string
): Promise<ActionResult<unknown[]>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const expenses = await db.expense.findMany({
      where: { shipmentId },
      include: {
        category: true,
        submittedByUser: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return {
      success: true,
      data: expenses.map((e) => ({
        ...e,
        amount: Number(e.amount),
      })),
    }
  } catch (error) {
    console.error("Error fetching shipment expenses:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch expenses",
    }
  }
}
