"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { auth } from "@/auth"
import { ExpenseStatus } from "@prisma/client"
import { z } from "zod"
import { logger } from "@/lib/logger"

const log = logger.forModule("expenses")

// Types
type ActionResult<T = void> = {
  success: boolean
  data?: T
  error?: string
}

// Validation schemas
const createExpenseSchema = z.object({
  categoryId: z.string().optional().nullable(),
  amount: z.number().positive("Amount must be positive"),
  description: z.string().min(1, "Description is required").max(500),
  vendor: z.string().max(255).optional().nullable(),
  expenseDate: z.coerce.date().optional(),
  receiptUrl: z.string().url().max(2048).optional().or(z.literal("")),
  receiptNumber: z.string().max(120).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  shipmentId: z.string().optional().nullable(),
  bankAccountId: z.string().optional().nullable(),
})

const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  nameAr: z.string().max(120).optional().nullable(),
  code: z.string().min(1, "Code is required").max(32),
  description: z.string().max(500).optional().nullable(),
  monthlyBudget: z.number().min(0).max(100_000_000).optional().nullable(),
})

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>
export type CreateCategoryInput = z.infer<typeof createCategorySchema>

// Helper: Generate expense number
function generateExpenseNumber(): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "")
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `EXP-${dateStr}-${random}`
}

// ============================================
// EXPENSE CATEGORY MANAGEMENT
// ============================================

// Returns both global categories (userId=null) and the caller's own categories.
export async function getExpenseCategories(): Promise<ActionResult<unknown[]>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const categories = await db.expenseCategory.findMany({
      where: {
        isActive: true,
        OR: [{ userId: null }, { userId: session.user.id }],
      },
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
    log.error("Error fetching categories", error as Error)
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
        nameAr: validated.nameAr ?? undefined,
        code: validated.code,
        description: validated.description ?? undefined,
        monthlyBudget: validated.monthlyBudget ?? undefined,
        isActive: true,
        userId: session.user.id,
      },
    })

    revalidatePath("/finance/expenses")

    return { success: true, data: { id: category.id } }
  } catch (error) {
    log.error("Error creating category", error as Error)
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

    const where: Record<string, unknown> = { userId: session.user.id }

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
            select: { id: true, name: true, email: true },
          },
          approvedByUser: {
            select: { id: true, name: true, email: true },
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
          totalAmount: Number(e.totalAmount),
        })),
        total,
        page,
        pageSize,
        hasMore: skip + expenses.length < total,
      },
    }
  } catch (error) {
    log.error("Error fetching expenses", error as Error)
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

    const expense = await db.expense.findFirst({
      where: { id: expenseId, userId: session.user.id },
      include: {
        category: true,
        shipment: {
          select: {
            id: true,
            shipmentNumber: true,
            description: true,
          },
        },
        submittedByUser: { select: { id: true, name: true, email: true } },
        approvedByUser: { select: { id: true, name: true, email: true } },
        transaction: true,
        bankAccount: { select: { id: true, accountName: true, bankName: true } },
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
    log.error("Error fetching expense", error as Error)
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

    // Ownership: if the expense references a shipment, confirm it belongs to
    // the caller. Preventing cross-tenant writes that bypass the tenant filter
    // through FK linkage.
    if (validated.shipmentId) {
      const shipment = await db.shipment.findFirst({
        where: { id: validated.shipmentId, userId: session.user.id },
        select: { id: true },
      })
      if (!shipment) {
        return { success: false, error: "Shipment not found" }
      }
    }

    const expense = await db.expense.create({
      data: {
        expenseNumber: generateExpenseNumber(),
        amount: validated.amount,
        totalAmount: validated.amount,
        description: validated.description,
        vendor: validated.vendor ?? undefined,
        expenseDate: validated.expenseDate || new Date(),
        receiptUrl: validated.receiptUrl || undefined,
        receiptNumber: validated.receiptNumber ?? undefined,
        notes: validated.notes ?? undefined,
        categoryId: validated.categoryId ?? undefined,
        shipmentId: validated.shipmentId ?? undefined,
        bankAccountId: validated.bankAccountId ?? undefined,
        submittedById: session.user.id,
        submittedAt: new Date(),
        userId: session.user.id,
        status: "PENDING",
      },
    })

    revalidatePath("/finance/expenses")

    return { success: true, data: { id: expense.id } }
  } catch (error) {
    log.error("Error creating expense", error as Error)
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

    const expense = await db.expense.findFirst({
      where: { id: expenseId, userId: session.user.id },
      select: { id: true, status: true },
    })

    if (!expense) {
      return { success: false, error: "Expense not found" }
    }

    if (expense.status !== "PENDING" && expense.status !== "DRAFT") {
      return { success: false, error: "Only pending expenses can be edited" }
    }

    // Whitelist editable fields — strip unknowns so the client can't rebind
    // `userId` / `status` / `submittedById`.
    const editable: Record<string, unknown> = {}
    if (input.amount !== undefined) {
      editable.amount = input.amount
      editable.totalAmount = input.amount
    }
    if (input.description !== undefined) editable.description = input.description
    if (input.vendor !== undefined) editable.vendor = input.vendor ?? null
    if (input.expenseDate !== undefined) editable.expenseDate = input.expenseDate
    if (input.receiptUrl !== undefined) editable.receiptUrl = input.receiptUrl || null
    if (input.receiptNumber !== undefined) editable.receiptNumber = input.receiptNumber ?? null
    if (input.notes !== undefined) editable.notes = input.notes ?? null
    if (input.categoryId !== undefined) editable.categoryId = input.categoryId ?? null

    await db.expense.update({
      where: { id: expenseId },
      data: editable,
    })

    revalidatePath("/finance/expenses")

    return { success: true }
  } catch (error) {
    log.error("Error updating expense", error as Error)
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

    const expense = await db.expense.findFirst({
      where: { id: expenseId, userId: session.user.id },
      select: { id: true, status: true },
    })

    if (!expense) {
      return { success: false, error: "Expense not found" }
    }

    if (expense.status === "PAID") {
      return { success: false, error: "Paid expenses cannot be deleted" }
    }

    await db.expense.delete({ where: { id: expenseId } })

    revalidatePath("/finance/expenses")

    return { success: true }
  } catch (error) {
    log.error("Error deleting expense", error as Error)
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

    const expense = await db.expense.findFirst({
      where: { id: expenseId, userId: session.user.id },
      select: { id: true, status: true },
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
    log.error("Error approving expense", error as Error)
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

    const expense = await db.expense.findFirst({
      where: { id: expenseId, userId: session.user.id },
      select: { id: true, status: true },
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
    log.error("Error rejecting expense", error as Error)
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

    const expense = await db.expense.findFirst({
      where: { id: expenseId, userId: session.user.id },
      select: {
        id: true,
        status: true,
        amount: true,
        description: true,
        expenseNumber: true,
      },
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
      select: { id: true, currentBalance: true },
    })

    if (!bankAccount) {
      return { success: false, error: "Bank account not found" }
    }

    const amount = Number(expense.amount)
    const currentBalance = Number(bankAccount.currentBalance)
    const newBalance = currentBalance - amount

    await db.$transaction(async (tx) => {
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

      await tx.expense.update({
        where: { id: expenseId },
        data: {
          status: "PAID",
          transactionId: transaction.id,
          bankAccountId,
          paidAt: new Date(),
        },
      })

      await tx.bankAccount.update({
        where: { id: bankAccountId },
        data: { currentBalance: newBalance },
      })
    })

    revalidatePath("/finance/expenses")
    revalidatePath("/finance/banking")

    return { success: true }
  } catch (error) {
    log.error("Error marking expense as paid", error as Error)
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
    const userId = session.user.id

    const tenant: Record<string, unknown> = { userId }
    if (params?.startDate || params?.endDate) {
      tenant.expenseDate = {}
      if (params.startDate) {
        (tenant.expenseDate as Record<string, Date>).gte = params.startDate
      }
      if (params.endDate) {
        (tenant.expenseDate as Record<string, Date>).lte = params.endDate
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
      db.expense.count({ where: tenant }),
      db.expense.count({ where: { ...tenant, status: "PENDING" } }),
      db.expense.count({ where: { ...tenant, status: "APPROVED" } }),
      db.expense.count({ where: { ...tenant, status: "PAID" } }),
      db.expense.aggregate({
        where: { ...tenant, status: "PENDING" },
        _sum: { amount: true },
      }),
      db.expense.aggregate({
        where: { ...tenant, status: "APPROVED" },
        _sum: { amount: true },
      }),
      db.expense.aggregate({
        where: { ...tenant, status: "PAID" },
        _sum: { amount: true },
      }),
      db.expense.groupBy({
        by: ["categoryId"],
        where: tenant,
        _sum: { amount: true },
      }),
    ])

    const categoryIds = byCategory
      .map((c) => c.categoryId)
      .filter((id): id is string => id !== null)

    const categories = await db.expenseCategory.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true, nameAr: true },
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
    log.error("Error fetching expense summary", error as Error)
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
      where: { shipmentId, userId: session.user.id },
      include: {
        category: true,
        submittedByUser: { select: { id: true, name: true } },
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
    log.error("Error fetching shipment expenses", error as Error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch expenses",
    }
  }
}
