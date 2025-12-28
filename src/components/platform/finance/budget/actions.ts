/**
 * Budget Module - Server Actions (Stubbed)
 *
 * TODO: Implement with Prisma when Budget models are added
 */

"use server"

import type { BudgetActionResult } from "./types"

export async function createBudget(
  formData: FormData
): Promise<BudgetActionResult> {
  console.log("createBudget called with:", Object.fromEntries(formData))
  return { success: false, error: "Budget creation not yet implemented" }
}

export async function updateBudget(
  budgetId: string,
  formData: FormData
): Promise<BudgetActionResult> {
  console.log("updateBudget called for:", budgetId)
  return { success: false, error: "Budget update not yet implemented" }
}

export async function createBudgetAllocation(formData: FormData) {
  console.log("createBudgetAllocation called with:", Object.fromEntries(formData))
  return { success: false, error: "Budget allocation not yet implemented" }
}

export async function getBudgets(filters?: {
  status?: string
  fiscalYearId?: string
}) {
  console.log("getBudgets called with filters:", filters)
  return { success: true, data: [] }
}
