"use server"

/**
 * Budget Module - Server Actions
 * Full Prisma implementation for budget management
 */

import { revalidatePath } from "next/cache"

import { auth } from "@/auth"
import { db } from "@/lib/db"

// ============================================================================
// TYPES
// ============================================================================

export interface Budget {
  id: string
  name: string
  description: string | null
  fiscalYear: number
  status: string
  startDate: Date
  endDate: Date
  totalAllocated: number
  totalSpent: number
  totalRemaining: number
  approvedAt: Date | null
  approvedBy: string | null
  createdAt: Date
  updatedAt: Date
}

export interface BudgetItem {
  id: string
  categoryName: string
  categoryCode: string | null
  description: string | null
  allocated: number
  spent: number
  remaining: number
  monthlyAllocations: number[] | null
  varianceAmount: number | null
  variancePercent: number | null
}

export interface BudgetWithItems extends Budget {
  items: BudgetItem[]
}

export interface BudgetDashboardStats {
  budgetsCount: number
  activeBudgets: number
  totalAllocated: number
  totalSpent: number
  totalRemaining: number
  utilizationRate: number
  topCategories: {
    name: string
    allocated: number
    spent: number
    utilization: number
  }[]
  monthlyTrend: {
    month: string
    allocated: number
    spent: number
  }[]
}

export interface BudgetActionResult<T = Budget> {
  success: boolean
  data?: T
  error?: string
}

// ============================================================================
// BUDGET QUERIES
// ============================================================================

export async function getBudgets(filters?: {
  status?: string
  fiscalYear?: number
}): Promise<BudgetActionResult<Budget[]>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const where: any = { userId: session.user.id }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.fiscalYear) {
      where.fiscalYear = filters.fiscalYear
    }

    const budgets = await db.budget.findMany({
      where,
      orderBy: [{ fiscalYear: "desc" }, { createdAt: "desc" }],
    })

    return {
      success: true,
      data: budgets.map((b) => ({
        id: b.id,
        name: b.name,
        description: b.description,
        fiscalYear: b.fiscalYear,
        status: b.status,
        startDate: b.startDate,
        endDate: b.endDate,
        totalAllocated: Number(b.totalAllocated),
        totalSpent: Number(b.totalSpent),
        totalRemaining: Number(b.totalRemaining),
        approvedAt: b.approvedAt,
        approvedBy: b.approvedBy,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      })),
    }
  } catch (error) {
    console.error("Error fetching budgets:", error)
    return { success: false, error: "Failed to fetch budgets" }
  }
}

export async function getBudget(
  budgetId: string
): Promise<BudgetActionResult<BudgetWithItems>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const budget = await db.budget.findFirst({
      where: { id: budgetId, userId: session.user.id },
      include: {
        items: {
          orderBy: { categoryName: "asc" },
        },
      },
    })

    if (!budget) {
      return { success: false, error: "Budget not found" }
    }

    return {
      success: true,
      data: {
        id: budget.id,
        name: budget.name,
        description: budget.description,
        fiscalYear: budget.fiscalYear,
        status: budget.status,
        startDate: budget.startDate,
        endDate: budget.endDate,
        totalAllocated: Number(budget.totalAllocated),
        totalSpent: Number(budget.totalSpent),
        totalRemaining: Number(budget.totalRemaining),
        approvedAt: budget.approvedAt,
        approvedBy: budget.approvedBy,
        createdAt: budget.createdAt,
        updatedAt: budget.updatedAt,
        items: budget.items.map((item) => ({
          id: item.id,
          categoryName: item.categoryName,
          categoryCode: item.categoryCode,
          description: item.description,
          allocated: Number(item.allocated),
          spent: Number(item.spent),
          remaining: Number(item.remaining),
          monthlyAllocations: item.monthlyAllocations as number[] | null,
          varianceAmount: item.varianceAmount ? Number(item.varianceAmount) : null,
          variancePercent: item.variancePercent ? Number(item.variancePercent) : null,
        })),
      },
    }
  } catch (error) {
    console.error("Error fetching budget:", error)
    return { success: false, error: "Failed to fetch budget" }
  }
}

export async function getActiveBudget(): Promise<BudgetActionResult<BudgetWithItems | null>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const now = new Date()
    const currentYear = now.getFullYear()

    const budget = await db.budget.findFirst({
      where: {
        userId: session.user.id,
        status: "ACTIVE",
        fiscalYear: currentYear,
      },
      include: {
        items: {
          orderBy: { categoryName: "asc" },
        },
      },
    })

    if (!budget) {
      return { success: true, data: null }
    }

    return {
      success: true,
      data: {
        id: budget.id,
        name: budget.name,
        description: budget.description,
        fiscalYear: budget.fiscalYear,
        status: budget.status,
        startDate: budget.startDate,
        endDate: budget.endDate,
        totalAllocated: Number(budget.totalAllocated),
        totalSpent: Number(budget.totalSpent),
        totalRemaining: Number(budget.totalRemaining),
        approvedAt: budget.approvedAt,
        approvedBy: budget.approvedBy,
        createdAt: budget.createdAt,
        updatedAt: budget.updatedAt,
        items: budget.items.map((item) => ({
          id: item.id,
          categoryName: item.categoryName,
          categoryCode: item.categoryCode,
          description: item.description,
          allocated: Number(item.allocated),
          spent: Number(item.spent),
          remaining: Number(item.remaining),
          monthlyAllocations: item.monthlyAllocations as number[] | null,
          varianceAmount: item.varianceAmount ? Number(item.varianceAmount) : null,
          variancePercent: item.variancePercent ? Number(item.variancePercent) : null,
        })),
      },
    }
  } catch (error) {
    console.error("Error fetching active budget:", error)
    return { success: false, error: "Failed to fetch active budget" }
  }
}

// ============================================================================
// BUDGET CRUD
// ============================================================================

export async function createBudget(params: {
  name: string
  description?: string
  fiscalYear: number
  startDate: Date
  endDate: Date
  items?: {
    categoryName: string
    categoryCode?: string
    description?: string
    allocated: number
    monthlyAllocations?: number[]
  }[]
}): Promise<BudgetActionResult<Budget>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    // Calculate total allocated from items
    const totalAllocated = params.items?.reduce((sum, item) => sum + item.allocated, 0) || 0

    const budget = await db.budget.create({
      data: {
        name: params.name,
        description: params.description,
        fiscalYear: params.fiscalYear,
        status: "DRAFT",
        startDate: params.startDate,
        endDate: params.endDate,
        totalAllocated,
        totalSpent: 0,
        totalRemaining: totalAllocated,
        userId: session.user.id,
        items: params.items
          ? {
              create: params.items.map((item) => ({
                categoryName: item.categoryName,
                categoryCode: item.categoryCode,
                description: item.description,
                allocated: item.allocated,
                spent: 0,
                remaining: item.allocated,
                monthlyAllocations: item.monthlyAllocations || null,
              })),
            }
          : undefined,
      },
    })

    revalidatePath("/finance/budget")

    return {
      success: true,
      data: {
        id: budget.id,
        name: budget.name,
        description: budget.description,
        fiscalYear: budget.fiscalYear,
        status: budget.status,
        startDate: budget.startDate,
        endDate: budget.endDate,
        totalAllocated: Number(budget.totalAllocated),
        totalSpent: Number(budget.totalSpent),
        totalRemaining: Number(budget.totalRemaining),
        approvedAt: budget.approvedAt,
        approvedBy: budget.approvedBy,
        createdAt: budget.createdAt,
        updatedAt: budget.updatedAt,
      },
    }
  } catch (error) {
    console.error("Error creating budget:", error)
    return { success: false, error: "Failed to create budget" }
  }
}

export async function updateBudget(
  budgetId: string,
  params: {
    name?: string
    description?: string
    startDate?: Date
    endDate?: Date
  }
): Promise<BudgetActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const existing = await db.budget.findFirst({
      where: { id: budgetId, userId: session.user.id },
    })

    if (!existing) {
      return { success: false, error: "Budget not found" }
    }

    if (existing.status === "CLOSED") {
      return { success: false, error: "Cannot update a closed budget" }
    }

    const budget = await db.budget.update({
      where: { id: budgetId },
      data: {
        name: params.name,
        description: params.description,
        startDate: params.startDate,
        endDate: params.endDate,
      },
    })

    revalidatePath("/finance/budget")

    return {
      success: true,
      data: {
        id: budget.id,
        name: budget.name,
        description: budget.description,
        fiscalYear: budget.fiscalYear,
        status: budget.status,
        startDate: budget.startDate,
        endDate: budget.endDate,
        totalAllocated: Number(budget.totalAllocated),
        totalSpent: Number(budget.totalSpent),
        totalRemaining: Number(budget.totalRemaining),
        approvedAt: budget.approvedAt,
        approvedBy: budget.approvedBy,
        createdAt: budget.createdAt,
        updatedAt: budget.updatedAt,
      },
    }
  } catch (error) {
    console.error("Error updating budget:", error)
    return { success: false, error: "Failed to update budget" }
  }
}

export async function deleteBudget(budgetId: string): Promise<BudgetActionResult<void>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const existing = await db.budget.findFirst({
      where: { id: budgetId, userId: session.user.id },
    })

    if (!existing) {
      return { success: false, error: "Budget not found" }
    }

    if (existing.status === "ACTIVE" || existing.status === "CLOSED") {
      return { success: false, error: "Cannot delete an active or closed budget" }
    }

    // Delete budget (items cascade delete)
    await db.budget.delete({ where: { id: budgetId } })

    revalidatePath("/finance/budget")

    return { success: true }
  } catch (error) {
    console.error("Error deleting budget:", error)
    return { success: false, error: "Failed to delete budget" }
  }
}

// ============================================================================
// BUDGET ITEMS CRUD
// ============================================================================

export async function createBudgetAllocation(params: {
  budgetId: string
  categoryName: string
  categoryCode?: string
  description?: string
  allocated: number
  monthlyAllocations?: number[]
}): Promise<BudgetActionResult<BudgetItem>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const budget = await db.budget.findFirst({
      where: { id: params.budgetId, userId: session.user.id },
    })

    if (!budget) {
      return { success: false, error: "Budget not found" }
    }

    if (budget.status === "CLOSED") {
      return { success: false, error: "Cannot add items to a closed budget" }
    }

    // Create the item and update budget totals
    const [item] = await db.$transaction([
      db.budgetItem.create({
        data: {
          budgetId: params.budgetId,
          categoryName: params.categoryName,
          categoryCode: params.categoryCode,
          description: params.description,
          allocated: params.allocated,
          spent: 0,
          remaining: params.allocated,
          monthlyAllocations: params.monthlyAllocations || null,
        },
      }),
      db.budget.update({
        where: { id: params.budgetId },
        data: {
          totalAllocated: { increment: params.allocated },
          totalRemaining: { increment: params.allocated },
        },
      }),
    ])

    revalidatePath("/finance/budget")

    return {
      success: true,
      data: {
        id: item.id,
        categoryName: item.categoryName,
        categoryCode: item.categoryCode,
        description: item.description,
        allocated: Number(item.allocated),
        spent: Number(item.spent),
        remaining: Number(item.remaining),
        monthlyAllocations: item.monthlyAllocations as number[] | null,
        varianceAmount: item.varianceAmount ? Number(item.varianceAmount) : null,
        variancePercent: item.variancePercent ? Number(item.variancePercent) : null,
      },
    }
  } catch (error) {
    console.error("Error creating budget allocation:", error)
    return { success: false, error: "Failed to create budget allocation" }
  }
}

export async function updateBudgetAllocation(
  itemId: string,
  params: {
    categoryName?: string
    categoryCode?: string
    description?: string
    allocated?: number
    monthlyAllocations?: number[]
  }
): Promise<BudgetActionResult<BudgetItem>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const existing = await db.budgetItem.findFirst({
      where: { id: itemId },
      include: { budget: true },
    })

    if (!existing || existing.budget.userId !== session.user.id) {
      return { success: false, error: "Budget item not found" }
    }

    if (existing.budget.status === "CLOSED") {
      return { success: false, error: "Cannot update items in a closed budget" }
    }

    // Calculate allocation change
    const allocationChange = params.allocated !== undefined
      ? params.allocated - Number(existing.allocated)
      : 0

    // Calculate new remaining based on spent and new allocation
    const newRemaining = params.allocated !== undefined
      ? params.allocated - Number(existing.spent)
      : Number(existing.remaining)

    // Update item and budget totals
    const [item] = await db.$transaction([
      db.budgetItem.update({
        where: { id: itemId },
        data: {
          categoryName: params.categoryName,
          categoryCode: params.categoryCode,
          description: params.description,
          allocated: params.allocated,
          remaining: newRemaining,
          monthlyAllocations: params.monthlyAllocations || undefined,
          varianceAmount: params.allocated !== undefined
            ? newRemaining
            : undefined,
          variancePercent: params.allocated !== undefined && params.allocated > 0
            ? (newRemaining / params.allocated) * 100
            : undefined,
        },
      }),
      db.budget.update({
        where: { id: existing.budgetId },
        data: {
          totalAllocated: { increment: allocationChange },
          totalRemaining: { increment: allocationChange },
        },
      }),
    ])

    revalidatePath("/finance/budget")

    return {
      success: true,
      data: {
        id: item.id,
        categoryName: item.categoryName,
        categoryCode: item.categoryCode,
        description: item.description,
        allocated: Number(item.allocated),
        spent: Number(item.spent),
        remaining: Number(item.remaining),
        monthlyAllocations: item.monthlyAllocations as number[] | null,
        varianceAmount: item.varianceAmount ? Number(item.varianceAmount) : null,
        variancePercent: item.variancePercent ? Number(item.variancePercent) : null,
      },
    }
  } catch (error) {
    console.error("Error updating budget allocation:", error)
    return { success: false, error: "Failed to update budget allocation" }
  }
}

export async function deleteBudgetAllocation(
  itemId: string
): Promise<BudgetActionResult<void>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const existing = await db.budgetItem.findFirst({
      where: { id: itemId },
      include: { budget: true },
    })

    if (!existing || existing.budget.userId !== session.user.id) {
      return { success: false, error: "Budget item not found" }
    }

    if (existing.budget.status === "CLOSED") {
      return { success: false, error: "Cannot delete items from a closed budget" }
    }

    if (Number(existing.spent) > 0) {
      return { success: false, error: "Cannot delete an allocation that has spending" }
    }

    // Delete item and update budget totals
    await db.$transaction([
      db.budgetItem.delete({ where: { id: itemId } }),
      db.budget.update({
        where: { id: existing.budgetId },
        data: {
          totalAllocated: { decrement: Number(existing.allocated) },
          totalRemaining: { decrement: Number(existing.remaining) },
        },
      }),
    ])

    revalidatePath("/finance/budget")

    return { success: true }
  } catch (error) {
    console.error("Error deleting budget allocation:", error)
    return { success: false, error: "Failed to delete budget allocation" }
  }
}

// ============================================================================
// BUDGET WORKFLOW
// ============================================================================

export async function submitBudgetForApproval(
  budgetId: string
): Promise<BudgetActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const budget = await db.budget.findFirst({
      where: { id: budgetId, userId: session.user.id },
      include: { items: true },
    })

    if (!budget) {
      return { success: false, error: "Budget not found" }
    }

    if (budget.status !== "DRAFT") {
      return { success: false, error: "Only draft budgets can be submitted for approval" }
    }

    if (budget.items.length === 0) {
      return { success: false, error: "Budget must have at least one allocation" }
    }

    const updated = await db.budget.update({
      where: { id: budgetId },
      data: { status: "PENDING_APPROVAL" },
    })

    revalidatePath("/finance/budget")

    return {
      success: true,
      data: {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        fiscalYear: updated.fiscalYear,
        status: updated.status,
        startDate: updated.startDate,
        endDate: updated.endDate,
        totalAllocated: Number(updated.totalAllocated),
        totalSpent: Number(updated.totalSpent),
        totalRemaining: Number(updated.totalRemaining),
        approvedAt: updated.approvedAt,
        approvedBy: updated.approvedBy,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    }
  } catch (error) {
    console.error("Error submitting budget for approval:", error)
    return { success: false, error: "Failed to submit budget for approval" }
  }
}

export async function approveBudget(budgetId: string): Promise<BudgetActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const budget = await db.budget.findFirst({
      where: { id: budgetId, userId: session.user.id },
    })

    if (!budget) {
      return { success: false, error: "Budget not found" }
    }

    if (budget.status !== "PENDING_APPROVAL") {
      return { success: false, error: "Budget is not pending approval" }
    }

    const updated = await db.budget.update({
      where: { id: budgetId },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        approvedBy: session.user.id,
      },
    })

    revalidatePath("/finance/budget")

    return {
      success: true,
      data: {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        fiscalYear: updated.fiscalYear,
        status: updated.status,
        startDate: updated.startDate,
        endDate: updated.endDate,
        totalAllocated: Number(updated.totalAllocated),
        totalSpent: Number(updated.totalSpent),
        totalRemaining: Number(updated.totalRemaining),
        approvedAt: updated.approvedAt,
        approvedBy: updated.approvedBy,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    }
  } catch (error) {
    console.error("Error approving budget:", error)
    return { success: false, error: "Failed to approve budget" }
  }
}

export async function activateBudget(budgetId: string): Promise<BudgetActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const budget = await db.budget.findFirst({
      where: { id: budgetId, userId: session.user.id },
    })

    if (!budget) {
      return { success: false, error: "Budget not found" }
    }

    if (budget.status !== "APPROVED") {
      return { success: false, error: "Budget must be approved before activation" }
    }

    // Deactivate any other active budget for the same fiscal year
    await db.budget.updateMany({
      where: {
        userId: session.user.id,
        fiscalYear: budget.fiscalYear,
        status: "ACTIVE",
      },
      data: { status: "CLOSED" },
    })

    const updated = await db.budget.update({
      where: { id: budgetId },
      data: { status: "ACTIVE" },
    })

    revalidatePath("/finance/budget")

    return {
      success: true,
      data: {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        fiscalYear: updated.fiscalYear,
        status: updated.status,
        startDate: updated.startDate,
        endDate: updated.endDate,
        totalAllocated: Number(updated.totalAllocated),
        totalSpent: Number(updated.totalSpent),
        totalRemaining: Number(updated.totalRemaining),
        approvedAt: updated.approvedAt,
        approvedBy: updated.approvedBy,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    }
  } catch (error) {
    console.error("Error activating budget:", error)
    return { success: false, error: "Failed to activate budget" }
  }
}

export async function closeBudget(budgetId: string): Promise<BudgetActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const budget = await db.budget.findFirst({
      where: { id: budgetId, userId: session.user.id },
    })

    if (!budget) {
      return { success: false, error: "Budget not found" }
    }

    const updated = await db.budget.update({
      where: { id: budgetId },
      data: { status: "CLOSED" },
    })

    revalidatePath("/finance/budget")

    return {
      success: true,
      data: {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        fiscalYear: updated.fiscalYear,
        status: updated.status,
        startDate: updated.startDate,
        endDate: updated.endDate,
        totalAllocated: Number(updated.totalAllocated),
        totalSpent: Number(updated.totalSpent),
        totalRemaining: Number(updated.totalRemaining),
        approvedAt: updated.approvedAt,
        approvedBy: updated.approvedBy,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    }
  } catch (error) {
    console.error("Error closing budget:", error)
    return { success: false, error: "Failed to close budget" }
  }
}

// ============================================================================
// BUDGET SPENDING
// ============================================================================

export async function recordBudgetSpending(params: {
  budgetId: string
  categoryName: string
  amount: number
  description?: string
}): Promise<BudgetActionResult<BudgetItem>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const budget = await db.budget.findFirst({
      where: { id: params.budgetId, userId: session.user.id },
      include: {
        items: {
          where: { categoryName: params.categoryName },
        },
      },
    })

    if (!budget) {
      return { success: false, error: "Budget not found" }
    }

    if (budget.status !== "ACTIVE") {
      return { success: false, error: "Can only record spending against active budgets" }
    }

    const item = budget.items[0]
    if (!item) {
      return { success: false, error: `No budget allocation found for category: ${params.categoryName}` }
    }

    const newSpent = Number(item.spent) + params.amount
    const newRemaining = Number(item.allocated) - newSpent
    const variancePercent = Number(item.allocated) > 0
      ? (newRemaining / Number(item.allocated)) * 100
      : 0

    // Update item and budget totals
    const [updatedItem] = await db.$transaction([
      db.budgetItem.update({
        where: { id: item.id },
        data: {
          spent: newSpent,
          remaining: newRemaining,
          varianceAmount: newRemaining,
          variancePercent,
        },
      }),
      db.budget.update({
        where: { id: params.budgetId },
        data: {
          totalSpent: { increment: params.amount },
          totalRemaining: { decrement: params.amount },
        },
      }),
    ])

    revalidatePath("/finance/budget")

    return {
      success: true,
      data: {
        id: updatedItem.id,
        categoryName: updatedItem.categoryName,
        categoryCode: updatedItem.categoryCode,
        description: updatedItem.description,
        allocated: Number(updatedItem.allocated),
        spent: Number(updatedItem.spent),
        remaining: Number(updatedItem.remaining),
        monthlyAllocations: updatedItem.monthlyAllocations as number[] | null,
        varianceAmount: updatedItem.varianceAmount ? Number(updatedItem.varianceAmount) : null,
        variancePercent: updatedItem.variancePercent ? Number(updatedItem.variancePercent) : null,
      },
    }
  } catch (error) {
    console.error("Error recording budget spending:", error)
    return { success: false, error: "Failed to record budget spending" }
  }
}

// ============================================================================
// BUDGET DASHBOARD STATS
// ============================================================================

export async function getBudgetDashboardStats(): Promise<BudgetActionResult<BudgetDashboardStats>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const currentYear = new Date().getFullYear()

    const [budgetsCount, activeBudgets, totals, topItems] = await Promise.all([
      db.budget.count({ where: { userId: session.user.id } }),
      db.budget.count({
        where: { userId: session.user.id, status: "ACTIVE" },
      }),
      db.budget.aggregate({
        where: { userId: session.user.id, fiscalYear: currentYear },
        _sum: {
          totalAllocated: true,
          totalSpent: true,
          totalRemaining: true,
        },
      }),
      db.budgetItem.findMany({
        where: {
          budget: { userId: session.user.id, fiscalYear: currentYear },
        },
        orderBy: { allocated: "desc" },
        take: 5,
      }),
    ])

    const totalAllocated = Number(totals._sum.totalAllocated || 0)
    const totalSpent = Number(totals._sum.totalSpent || 0)
    const totalRemaining = Number(totals._sum.totalRemaining || 0)
    const utilizationRate = totalAllocated > 0
      ? (totalSpent / totalAllocated) * 100
      : 0

    // Get monthly trend (simplified - just show current year allocations)
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ]
    const monthlyTrend = months.map((month, index) => ({
      month,
      allocated: totalAllocated / 12, // Simplified even distribution
      spent: index < new Date().getMonth() ? totalSpent / (new Date().getMonth() || 1) : 0,
    }))

    return {
      success: true,
      data: {
        budgetsCount,
        activeBudgets,
        totalAllocated,
        totalSpent,
        totalRemaining,
        utilizationRate,
        topCategories: topItems.map((item) => ({
          name: item.categoryName,
          allocated: Number(item.allocated),
          spent: Number(item.spent),
          utilization: Number(item.allocated) > 0
            ? (Number(item.spent) / Number(item.allocated)) * 100
            : 0,
        })),
        monthlyTrend,
      },
    }
  } catch (error) {
    console.error("Error fetching budget dashboard stats:", error)
    return { success: false, error: "Failed to fetch budget stats" }
  }
}

// ============================================================================
// BUDGET COMPARISON
// ============================================================================

export async function compareBudgets(params: {
  budgetId1: string
  budgetId2: string
}): Promise<BudgetActionResult<{
  budget1: BudgetWithItems
  budget2: BudgetWithItems
  comparison: {
    categoryName: string
    budget1Allocated: number
    budget2Allocated: number
    difference: number
    percentChange: number
  }[]
}>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const [budget1Result, budget2Result] = await Promise.all([
      getBudget(params.budgetId1),
      getBudget(params.budgetId2),
    ])

    if (!budget1Result.success || !budget1Result.data) {
      return { success: false, error: "First budget not found" }
    }

    if (!budget2Result.success || !budget2Result.data) {
      return { success: false, error: "Second budget not found" }
    }

    const budget1 = budget1Result.data
    const budget2 = budget2Result.data

    // Build comparison by category
    const categoryMap = new Map<string, { b1: number; b2: number }>()

    for (const item of budget1.items) {
      categoryMap.set(item.categoryName, {
        b1: item.allocated,
        b2: 0,
      })
    }

    for (const item of budget2.items) {
      const existing = categoryMap.get(item.categoryName)
      if (existing) {
        existing.b2 = item.allocated
      } else {
        categoryMap.set(item.categoryName, {
          b1: 0,
          b2: item.allocated,
        })
      }
    }

    const comparison = Array.from(categoryMap.entries()).map(([name, values]) => ({
      categoryName: name,
      budget1Allocated: values.b1,
      budget2Allocated: values.b2,
      difference: values.b2 - values.b1,
      percentChange: values.b1 > 0
        ? ((values.b2 - values.b1) / values.b1) * 100
        : values.b2 > 0 ? 100 : 0,
    }))

    return {
      success: true,
      data: {
        budget1,
        budget2,
        comparison,
      },
    }
  } catch (error) {
    console.error("Error comparing budgets:", error)
    return { success: false, error: "Failed to compare budgets" }
  }
}
