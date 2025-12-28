/**
 * Budget Module - Configuration
 *
 * TODO: BudgetStatus will come from Prisma when schema is added
 */

// Local enum until Prisma schema is added
export const BudgetStatus = {
  DRAFT: "DRAFT",
  PENDING_APPROVAL: "PENDING_APPROVAL",
  APPROVED: "APPROVED",
  ACTIVE: "ACTIVE",
  CLOSED: "CLOSED",
} as const

export type BudgetStatus = (typeof BudgetStatus)[keyof typeof BudgetStatus]

export const BudgetStatusLabels: Record<BudgetStatus, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  ACTIVE: "Active",
  CLOSED: "Closed",
}

export const BudgetCategories = [
  "OPERATIONS",
  "EQUIPMENT",
  "SUPPLIES",
  "TECHNOLOGY",
  "PERSONNEL",
  "CUSTOMS_DUTIES",
  "PORT_CHARGES",
  "TRANSPORTATION",
  "INSURANCE",
  "OTHER",
] as const

export type BudgetCategory = (typeof BudgetCategories)[number]

export const BudgetCategoryLabels: Record<BudgetCategory, string> = {
  OPERATIONS: "Operations",
  EQUIPMENT: "Equipment",
  SUPPLIES: "Supplies",
  TECHNOLOGY: "Technology",
  PERSONNEL: "Personnel",
  CUSTOMS_DUTIES: "Customs Duties",
  PORT_CHARGES: "Port Charges",
  TRANSPORTATION: "Transportation",
  INSURANCE: "Insurance",
  OTHER: "Other",
}

export const BUDGET_ALERTS = {
  WARNING_THRESHOLD: 0.8, // 80% utilization
  CRITICAL_THRESHOLD: 0.95, // 95% utilization
} as const
