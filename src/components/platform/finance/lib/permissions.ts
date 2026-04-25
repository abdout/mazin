/**
 * Finance Permissions Utility
 *
 * Role-based permission checks for finance modules.
 * Uses the UserRole enum from Prisma: ADMIN, MANAGER, CLERK, VIEWER
 */

import { auth } from "@/auth"
import { db } from "@/lib/db"
import type { UserRole } from "@prisma/client"

/**
 * Finance modules that can have permissions
 */
export const FINANCE_MODULES = [
  "invoice",
  "receipt",
  "banking",
  "fees",
  "salary",
  "payroll",
  "timesheet",
  "wallet",
  "budget",
  "expenses",
  "accounts",
  "reports",
] as const

export type FinanceModule = (typeof FINANCE_MODULES)[number]

/**
 * Actions that can be performed on finance modules
 */
export type FinanceAction =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "approve"
  | "process"
  | "export"

/**
 * Role-permission matrix
 * ADMIN: full access to all modules
 * MANAGER: view, create, edit, approve, export on all modules
 * CLERK: view, create, edit on invoice/receipt/fees/expenses/timesheet
 * VIEWER: view-only on all modules
 */
const ROLE_PERMISSIONS: Record<UserRole, Partial<Record<FinanceModule, FinanceAction[]>>> = {
  ADMIN: {
    invoice: ["view", "create", "edit", "delete", "approve", "process", "export"],
    receipt: ["view", "create", "edit", "delete", "approve", "process", "export"],
    banking: ["view", "create", "edit", "delete", "approve", "process", "export"],
    fees: ["view", "create", "edit", "delete", "approve", "process", "export"],
    salary: ["view", "create", "edit", "delete", "approve", "process", "export"],
    payroll: ["view", "create", "edit", "delete", "approve", "process", "export"],
    timesheet: ["view", "create", "edit", "delete", "approve", "process", "export"],
    wallet: ["view", "create", "edit", "delete", "approve", "process", "export"],
    budget: ["view", "create", "edit", "delete", "approve", "process", "export"],
    expenses: ["view", "create", "edit", "delete", "approve", "process", "export"],
    accounts: ["view", "create", "edit", "delete", "approve", "process", "export"],
    reports: ["view", "create", "edit", "delete", "approve", "process", "export"],
  },
  MANAGER: {
    invoice: ["view", "create", "edit", "approve", "export"],
    receipt: ["view", "create", "edit", "approve", "export"],
    banking: ["view", "create", "edit", "approve", "export"],
    fees: ["view", "create", "edit", "approve", "export"],
    salary: ["view", "create", "edit", "approve", "export"],
    payroll: ["view", "create", "edit", "approve", "process", "export"],
    timesheet: ["view", "create", "edit", "approve", "export"],
    wallet: ["view", "create", "edit", "export"],
    budget: ["view", "create", "edit", "approve", "export"],
    expenses: ["view", "create", "edit", "approve", "export"],
    accounts: ["view", "edit", "export"],
    reports: ["view", "export"],
  },
  CLERK: {
    invoice: ["view", "create", "edit"],
    receipt: ["view", "create", "edit"],
    fees: ["view", "create", "edit"],
    expenses: ["view", "create"],
    timesheet: ["view", "create", "edit"],
    reports: ["view"],
    banking: ["view"],
    salary: ["view"],
    payroll: ["view"],
    wallet: ["view"],
    budget: ["view"],
    accounts: ["view"],
  },
  VIEWER: {
    invoice: ["view"],
    receipt: ["view"],
    banking: ["view"],
    fees: ["view"],
    salary: ["view"],
    payroll: ["view"],
    timesheet: ["view"],
    wallet: ["view"],
    budget: ["view"],
    expenses: ["view"],
    accounts: ["view"],
    reports: ["view"],
  },
}

/**
 * Check if a given role has permission to perform action on module
 */
function roleHasPermission(
  role: UserRole,
  module: FinanceModule,
  action: FinanceAction
): boolean {
  const modulePermissions = ROLE_PERMISSIONS[role]?.[module]
  if (!modulePermissions) return false
  return modulePermissions.includes(action)
}

/**
 * Check if user has permission to perform action on module
 */
export async function checkFinancePermission(
  userId: string,
  _companyId: string,
  module: FinanceModule,
  action: FinanceAction
): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })
  if (!user) return false
  return roleHasPermission(user.role, module, action)
}

/**
 * Check if current session user has permission
 */
export async function checkCurrentUserPermission(
  _companyId: string,
  module: FinanceModule,
  action: FinanceAction
): Promise<boolean> {
  const session = await auth()
  if (!session?.user?.id) return false
  const role = (session.user as { role?: UserRole }).role
  if (!role) return false
  return roleHasPermission(role, module, action)
}

/**
 * Get all permissions for a user in a specific module
 */
export async function getUserModulePermissions(
  userId: string,
  _companyId: string,
  module: FinanceModule
): Promise<FinanceAction[]> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })
  if (!user) return []
  return ROLE_PERMISSIONS[user.role]?.[module] ?? []
}

/**
 * Grant permission to a user for a specific module and action
 * Not implemented — roles are static, not per-user grants
 */
export async function grantFinancePermission(
  _grantedBy: string,
  _grantedTo: string,
  _companyId: string,
  _module: FinanceModule,
  _action: FinanceAction
): Promise<boolean> {
  return false
}

/**
 * Revoke permission from a user
 * Not implemented — roles are static, not per-user grants
 */
export async function revokeFinancePermission(
  _revokedBy: string,
  _revokedFrom: string,
  _companyId: string,
  _module: FinanceModule,
  _action: FinanceAction
): Promise<boolean> {
  return false
}

/**
 * Check if user has any of the specified roles
 */
export async function hasFinanceRole(
  userId: string,
  roles: UserRole[]
): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })
  if (!user) return false
  return roles.includes(user.role)
}

/**
 * Module-specific permission helpers
 */
export const FinancePermissions = {
  canViewInvoices: (userId: string, companyId: string) =>
    checkFinancePermission(userId, companyId, "invoice", "view"),
  canCreateInvoices: (userId: string, companyId: string) =>
    checkFinancePermission(userId, companyId, "invoice", "create"),
  canEditInvoices: (userId: string, companyId: string) =>
    checkFinancePermission(userId, companyId, "invoice", "edit"),

  canViewPayroll: (userId: string, companyId: string) =>
    checkFinancePermission(userId, companyId, "payroll", "view"),
  canProcessPayroll: (userId: string, companyId: string) =>
    checkFinancePermission(userId, companyId, "payroll", "process"),
  canApprovePayroll: (userId: string, companyId: string) =>
    checkFinancePermission(userId, companyId, "payroll", "approve"),

  canViewExpenses: (userId: string, companyId: string) =>
    checkFinancePermission(userId, companyId, "expenses", "view"),
  canCreateExpenses: (userId: string, companyId: string) =>
    checkFinancePermission(userId, companyId, "expenses", "create"),
  canApproveExpenses: (userId: string, companyId: string) =>
    checkFinancePermission(userId, companyId, "expenses", "approve"),

  canViewAccounts: (userId: string, companyId: string) =>
    checkFinancePermission(userId, companyId, "accounts", "view"),
  canEditAccounts: (userId: string, companyId: string) =>
    checkFinancePermission(userId, companyId, "accounts", "edit"),

  canViewReports: (userId: string, companyId: string) =>
    checkFinancePermission(userId, companyId, "reports", "view"),
  canExportReports: (userId: string, companyId: string) =>
    checkFinancePermission(userId, companyId, "reports", "export"),
}
