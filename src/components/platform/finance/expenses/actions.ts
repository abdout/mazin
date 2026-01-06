/**
 * Expenses Module - Server Actions
 * Full CRUD implementation with Prisma
 */

"use server"

import { revalidatePath } from "next/cache"

import { auth } from "@/auth"
import { db } from "@/lib/db"

import { EXPENSE_LIMITS } from "./config"
import type {
  ExpenseActionResult,
  ExpenseDashboardStats,
  ExpenseWithDetails,
} from "./types"
import { expenseApprovalSchema, expenseSchema, expenseCategorySchema } from "./validation"

// ============================================================================
// EXPENSE CRUD
// ============================================================================

export async function createExpense(
  formData: FormData
): Promise<ExpenseActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const rawData = {
      amount: parseFloat(formData.get("amount") as string),
      description: formData.get("description") as string,
      expenseDate: formData.get("expenseDate") as string,
      categoryId: formData.get("categoryId") as string,
      receiptUrl: formData.get("receiptUrl") as string || null,
      notes: formData.get("notes") as string || null,
    }

    const validated = expenseSchema.safeParse(rawData)
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message }
    }

    const data = validated.data
    const userId = session.user.id

    // Calculate tax (simplified - could be configurable)
    const taxRate = 0 // Sudan has variable VAT, set to 0 for now
    const taxAmount = data.amount * taxRate
    const totalAmount = data.amount + taxAmount

    // Determine initial status based on amount threshold
    const autoApprove = data.amount <= EXPENSE_LIMITS.MAX_AMOUNT_WITHOUT_APPROVAL / 100

    const expense = await db.expense.create({
      data: {
        description: data.description,
        expenseDate: data.expenseDate,
        amount: data.amount,
        taxAmount: taxAmount,
        totalAmount: totalAmount,
        currency: "SDG",
        status: autoApprove ? "APPROVED" : "PENDING",
        receiptUrl: data.receiptUrl,
        notes: data.notes,
        submittedAt: new Date(),
        submittedBy: userId,
        approvedAt: autoApprove ? new Date() : null,
        approvedBy: autoApprove ? userId : null,
        categoryId: data.categoryId,
        userId: userId,
      },
      include: {
        category: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
      },
    })

    revalidatePath("/finance/expenses")
    revalidatePath("/finance/dashboard")

    return {
      success: true,
      data: {
        id: expense.id,
        amount: Number(expense.amount),
        description: expense.description,
        expenseDate: expense.expenseDate,
        status: expense.status as any,
        categoryId: expense.categoryId,
        submittedById: expense.submittedBy || expense.userId,
        approvedById: expense.approvedBy,
        approvedAt: expense.approvedAt,
        receiptUrl: expense.receiptUrl,
        category: expense.category,
        submittedBy: expense.user,
        companyId: expense.userId, // Using userId as tenant
      },
    }
  } catch (error) {
    console.error("Error creating expense:", error)
    return { success: false, error: "Failed to create expense" }
  }
}

export async function updateExpense(
  expenseId: string,
  formData: FormData
): Promise<ExpenseActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    // Check ownership
    const existing = await db.expense.findFirst({
      where: { id: expenseId, userId: session.user.id },
    })

    if (!existing) {
      return { success: false, error: "Expense not found" }
    }

    if (existing.status !== "DRAFT" && existing.status !== "PENDING") {
      return { success: false, error: "Cannot update an approved or paid expense" }
    }

    const rawData = {
      amount: parseFloat(formData.get("amount") as string),
      description: formData.get("description") as string,
      expenseDate: formData.get("expenseDate") as string,
      categoryId: formData.get("categoryId") as string,
      receiptUrl: formData.get("receiptUrl") as string || null,
      notes: formData.get("notes") as string || null,
    }

    const validated = expenseSchema.safeParse(rawData)
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message }
    }

    const data = validated.data
    const taxAmount = 0
    const totalAmount = data.amount + taxAmount

    const expense = await db.expense.update({
      where: { id: expenseId },
      data: {
        description: data.description,
        expenseDate: data.expenseDate,
        amount: data.amount,
        taxAmount: taxAmount,
        totalAmount: totalAmount,
        receiptUrl: data.receiptUrl,
        notes: data.notes,
        categoryId: data.categoryId,
      },
      include: {
        category: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
      },
    })

    revalidatePath("/finance/expenses")

    return {
      success: true,
      data: {
        id: expense.id,
        amount: Number(expense.amount),
        description: expense.description,
        expenseDate: expense.expenseDate,
        status: expense.status as any,
        categoryId: expense.categoryId,
        submittedById: expense.submittedBy || expense.userId,
        approvedById: expense.approvedBy,
        approvedAt: expense.approvedAt,
        receiptUrl: expense.receiptUrl,
        category: expense.category,
        submittedBy: expense.user,
        companyId: expense.userId,
      },
    }
  } catch (error) {
    console.error("Error updating expense:", error)
    return { success: false, error: "Failed to update expense" }
  }
}

export async function deleteExpense(expenseId: string): Promise<ExpenseActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const existing = await db.expense.findFirst({
      where: { id: expenseId, userId: session.user.id },
    })

    if (!existing) {
      return { success: false, error: "Expense not found" }
    }

    if (existing.status === "PAID") {
      return { success: false, error: "Cannot delete a paid expense" }
    }

    await db.expense.delete({ where: { id: expenseId } })

    revalidatePath("/finance/expenses")
    revalidatePath("/finance/dashboard")

    return { success: true }
  } catch (error) {
    console.error("Error deleting expense:", error)
    return { success: false, error: "Failed to delete expense" }
  }
}

// ============================================================================
// EXPENSE APPROVAL
// ============================================================================

export async function approveExpense(
  formData: FormData
): Promise<ExpenseActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  // Check if user has approval permission (Admin, Manager)
  const userRole = session.user.role
  if (!["ADMIN", "MANAGER"].includes(userRole || "")) {
    return { success: false, error: "You do not have permission to approve expenses" }
  }

  try {
    const rawData = {
      expenseId: formData.get("expenseId") as string,
      status: formData.get("status") as "APPROVED" | "REJECTED",
      notes: formData.get("notes") as string || undefined,
    }

    const validated = expenseApprovalSchema.safeParse(rawData)
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message }
    }

    const { expenseId, status, notes } = validated.data

    const existing = await db.expense.findFirst({
      where: { id: expenseId, userId: session.user.id },
    })

    if (!existing) {
      return { success: false, error: "Expense not found" }
    }

    if (existing.status !== "PENDING") {
      return { success: false, error: "Expense is not pending approval" }
    }

    const expense = await db.expense.update({
      where: { id: expenseId },
      data: {
        status: status,
        approvedAt: status === "APPROVED" ? new Date() : null,
        approvedBy: status === "APPROVED" ? session.user.id : null,
        rejectedAt: status === "REJECTED" ? new Date() : null,
        rejectedBy: status === "REJECTED" ? session.user.id : null,
        rejectionReason: status === "REJECTED" ? notes : null,
      },
      include: {
        category: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
      },
    })

    revalidatePath("/finance/expenses")
    revalidatePath("/finance/dashboard")

    return {
      success: true,
      data: {
        id: expense.id,
        amount: Number(expense.amount),
        description: expense.description,
        expenseDate: expense.expenseDate,
        status: expense.status as any,
        categoryId: expense.categoryId,
        submittedById: expense.submittedBy || expense.userId,
        approvedById: expense.approvedBy,
        approvedAt: expense.approvedAt,
        receiptUrl: expense.receiptUrl,
        category: expense.category,
        submittedBy: expense.user,
        companyId: expense.userId,
      },
    }
  } catch (error) {
    console.error("Error approving expense:", error)
    return { success: false, error: "Failed to process approval" }
  }
}

export async function markExpenseAsPaid(
  expenseId: string,
  paymentMethod: string,
  bankAccountId?: string
): Promise<ExpenseActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const existing = await db.expense.findFirst({
      where: { id: expenseId, userId: session.user.id },
    })

    if (!existing) {
      return { success: false, error: "Expense not found" }
    }

    if (existing.status !== "APPROVED") {
      return { success: false, error: "Expense must be approved before marking as paid" }
    }

    // Start a transaction
    const result = await db.$transaction(async (tx) => {
      // Update expense
      const expense = await tx.expense.update({
        where: { id: expenseId },
        data: {
          status: "PAID",
          paidAt: new Date(),
          paymentMethod: paymentMethod as any,
        },
        include: {
          category: { select: { id: true, name: true } },
          user: { select: { id: true, name: true } },
        },
      })

      // Create transaction record if bank account provided
      if (bankAccountId) {
        await tx.transaction.create({
          data: {
            transactionDate: new Date(),
            description: `Expense: ${expense.description}`,
            type: "DEBIT",
            category: "OTHER_EXPENSE",
            amount: expense.totalAmount,
            currency: expense.currency,
            status: "COMPLETED",
            expenseId: expense.id,
            userId: session.user.id,
            bankAccountId: bankAccountId,
          },
        })

        // Update bank balance
        await tx.bankAccount.update({
          where: { id: bankAccountId },
          data: {
            currentBalance: { decrement: expense.totalAmount },
          },
        })
      }

      return expense
    })

    revalidatePath("/finance/expenses")
    revalidatePath("/finance/banking")
    revalidatePath("/finance/dashboard")

    return {
      success: true,
      data: {
        id: result.id,
        amount: Number(result.amount),
        description: result.description,
        expenseDate: result.expenseDate,
        status: result.status as any,
        categoryId: result.categoryId,
        submittedById: result.submittedBy || result.userId,
        approvedById: result.approvedBy,
        approvedAt: result.approvedAt,
        receiptUrl: result.receiptUrl,
        category: result.category,
        submittedBy: result.user,
        companyId: result.userId,
      },
    }
  } catch (error) {
    console.error("Error marking expense as paid:", error)
    return { success: false, error: "Failed to process payment" }
  }
}

// ============================================================================
// EXPENSE CATEGORIES
// ============================================================================

export async function createExpenseCategory(
  formData: FormData
): Promise<{ success: boolean; data?: { id: string; name: string }; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const rawData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string || undefined,
      isActive: formData.get("isActive") === "true",
    }

    const validated = expenseCategorySchema.safeParse(rawData)
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message }
    }

    const data = validated.data

    // Generate code from name
    const code = data.name.toUpperCase().replace(/\s+/g, "_").slice(0, 20)

    const category = await db.expenseCategory.create({
      data: {
        name: data.name,
        code: code,
        description: data.description,
        isActive: data.isActive,
        userId: session.user.id,
      },
    })

    revalidatePath("/finance/expenses")

    return { success: true, data: { id: category.id, name: category.name } }
  } catch (error) {
    console.error("Error creating expense category:", error)
    return { success: false, error: "Failed to create category" }
  }
}

export async function getExpenseCategories() {
  const session = await auth()
  if (!session?.user?.id) {
    return []
  }

  try {
    const categories = await db.expenseCategory.findMany({
      where: { userId: session.user.id, isActive: true },
      select: { id: true, name: true, nameAr: true, code: true },
      orderBy: { name: "asc" },
    })

    return categories
  } catch (error) {
    console.error("Error fetching expense categories:", error)
    return []
  }
}

// ============================================================================
// EXPENSE QUERIES
// ============================================================================

export async function getExpenses(filters?: {
  status?: string
  categoryId?: string
  startDate?: Date
  endDate?: Date
  search?: string
  page?: number
  limit?: number
}): Promise<{
  success: boolean
  data: ExpenseWithDetails[]
  total: number
  page: number
  totalPages: number
}> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, data: [], total: 0, page: 1, totalPages: 1 }
  }

  try {
    const page = filters?.page || 1
    const limit = filters?.limit || 20
    const skip = (page - 1) * limit

    const where: any = { userId: session.user.id }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId
    }

    if (filters?.startDate || filters?.endDate) {
      where.expenseDate = {}
      if (filters.startDate) where.expenseDate.gte = filters.startDate
      if (filters.endDate) where.expenseDate.lte = filters.endDate
    }

    if (filters?.search) {
      where.description = { contains: filters.search, mode: "insensitive" }
    }

    const [expenses, total] = await Promise.all([
      db.expense.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          category: { select: { id: true, name: true } },
          user: { select: { id: true, name: true } },
        },
      }),
      db.expense.count({ where }),
    ])

    return {
      success: true,
      data: expenses.map((e) => ({
        id: e.id,
        amount: Number(e.amount),
        description: e.description,
        expenseDate: e.expenseDate,
        status: e.status as any,
        categoryId: e.categoryId,
        submittedById: e.submittedBy || e.userId,
        approvedById: e.approvedBy,
        approvedAt: e.approvedAt,
        receiptUrl: e.receiptUrl,
        category: e.category,
        submittedBy: e.user,
        companyId: e.userId,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  } catch (error) {
    console.error("Error fetching expenses:", error)
    return { success: false, data: [], total: 0, page: 1, totalPages: 1 }
  }
}

export async function getExpenseById(
  expenseId: string
): Promise<ExpenseWithDetails | null> {
  const session = await auth()
  if (!session?.user?.id) {
    return null
  }

  try {
    const expense = await db.expense.findFirst({
      where: { id: expenseId, userId: session.user.id },
      include: {
        category: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
      },
    })

    if (!expense) return null

    return {
      id: expense.id,
      amount: Number(expense.amount),
      description: expense.description,
      expenseDate: expense.expenseDate,
      status: expense.status as any,
      categoryId: expense.categoryId,
      submittedById: expense.submittedBy || expense.userId,
      approvedById: expense.approvedBy,
      approvedAt: expense.approvedAt,
      receiptUrl: expense.receiptUrl,
      category: expense.category,
      submittedBy: expense.user,
      companyId: expense.userId,
    }
  } catch (error) {
    console.error("Error fetching expense:", error)
    return null
  }
}

export async function getExpenseDashboardStats(): Promise<ExpenseDashboardStats> {
  const session = await auth()
  if (!session?.user?.id) {
    return {
      categoriesCount: 0,
      expensesCount: 0,
      pendingExpensesCount: 0,
      approvedExpensesCount: 0,
      totalExpenses: 0,
    }
  }

  try {
    const [
      categoriesCount,
      expensesCount,
      pendingExpensesCount,
      approvedExpensesCount,
      totalExpensesSum,
    ] = await Promise.all([
      db.expenseCategory.count({ where: { userId: session.user.id } }),
      db.expense.count({ where: { userId: session.user.id } }),
      db.expense.count({ where: { userId: session.user.id, status: "PENDING" } }),
      db.expense.count({ where: { userId: session.user.id, status: "APPROVED" } }),
      db.expense.aggregate({
        where: { userId: session.user.id, status: { in: ["APPROVED", "PAID"] } },
        _sum: { totalAmount: true },
      }),
    ])

    return {
      categoriesCount,
      expensesCount,
      pendingExpensesCount,
      approvedExpensesCount,
      totalExpenses: Number(totalExpensesSum._sum.totalAmount || 0),
    }
  } catch (error) {
    console.error("Error fetching expense dashboard stats:", error)
    return {
      categoriesCount: 0,
      expensesCount: 0,
      pendingExpensesCount: 0,
      approvedExpensesCount: 0,
      totalExpenses: 0,
    }
  }
}
