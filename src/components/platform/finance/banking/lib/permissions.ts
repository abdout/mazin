/**
 * Banking Permissions - Stubbed Implementation
 *
 * TODO: This requires UserRole enum updates for customs clearance roles
 */

// Define available roles for customs clearance
export const UserRole = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  CLERK: "CLERK",
  VIEWER: "VIEWER",
} as const

export type UserRole = (typeof UserRole)[keyof typeof UserRole]

// Permission configuration by action
export const BankingPermissions = {
  viewDashboard: [UserRole.ADMIN, UserRole.MANAGER, UserRole.CLERK, UserRole.VIEWER],
  viewAccounts: [UserRole.ADMIN, UserRole.MANAGER, UserRole.CLERK, UserRole.VIEWER],
  viewTransactions: [UserRole.ADMIN, UserRole.MANAGER, UserRole.CLERK, UserRole.VIEWER],
  createAccount: [UserRole.ADMIN, UserRole.MANAGER],
  deleteAccount: [UserRole.ADMIN],
  initiateTransfer: [UserRole.ADMIN, UserRole.MANAGER],
  approveTransfer: [UserRole.ADMIN],
  viewReports: [UserRole.ADMIN, UserRole.MANAGER, UserRole.CLERK],
  exportData: [UserRole.ADMIN, UserRole.MANAGER],
} as const

export type BankingAction = keyof typeof BankingPermissions

/**
 * Check if a role has permission for an action
 */
export function hasPermission(role: UserRole, action: BankingAction): boolean {
  const allowedRoles = BankingPermissions[action] as readonly UserRole[]
  return allowedRoles.includes(role)
}

/**
 * Check current user's permission for an action
 */
export async function checkCurrentUserPermission(
  action: BankingAction
): Promise<boolean> {
  // TODO: Implement with actual session/auth check
  // For now, return true to allow development
  return true
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): BankingAction[] {
  const permissions: BankingAction[] = []
  for (const [action, allowedRoles] of Object.entries(BankingPermissions)) {
    if ((allowedRoles as readonly UserRole[]).includes(role)) {
      permissions.push(action as BankingAction)
    }
  }
  return permissions
}
