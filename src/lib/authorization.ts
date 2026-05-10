import type { UserRole } from "@prisma/client"
import type { AuthContext } from "@/lib/auth-context"

/**
 * Role-based permission matrix for STAFF users.
 *
 * Single source of truth for `can(action, resource)` checks across server
 * actions. Community users (UserType.COMMUNITY) have no row here — they only
 * access marketplace surfaces, enforced via `canAccessRow` in auth-context.
 */

export type Resource =
  | "shipment"
  | "customs"
  | "invoice"
  // Finance domain — split per-module so each can be tuned independently.
  // Per the role matrix from `docs/audit/security.md` and issue #5:
  //   payroll/account/budget → ADMIN + MANAGER only
  //   wallet                 → ADMIN + MANAGER + CLERK
  //   expense                → all staff submit; only ADMIN + MANAGER approve
  | "finance" // legacy generic — kept for back-compat, prefer specifics
  | "payroll"
  | "account"
  | "wallet"
  | "expense"
  | "budget"
  | "client"
  | "project"
  | "task"
  | "team"
  | "settings"
  | "marketplace-admin"
  | "audit-log"

export type Action = "read" | "create" | "update" | "delete" | "approve"

/**
 * Permissions granted to each staff role. ADMIN is implicit-all.
 * MANAGER: full business ops, no destructive settings.
 * CLERK: operational CRUD, no approvals or destructive financial actions.
 * VIEWER: read-only everywhere.
 */
const MATRIX: Record<Exclude<UserRole, "ADMIN">, Partial<Record<Resource, Action[]>>> = {
  MANAGER: {
    shipment: ["read", "create", "update", "delete", "approve"],
    customs: ["read", "create", "update", "approve"],
    invoice: ["read", "create", "update", "approve"],
    finance: ["read", "create", "update", "approve"],
    payroll: ["read", "create", "update", "delete", "approve"],
    account: ["read", "create", "update", "delete"],
    wallet: ["read", "create", "update"],
    expense: ["read", "create", "update", "delete", "approve"],
    budget: ["read", "create", "update", "delete", "approve"],
    client: ["read", "create", "update", "delete"],
    project: ["read", "create", "update", "delete"],
    task: ["read", "create", "update", "delete"],
    team: ["read"],
    settings: ["read"],
    "marketplace-admin": ["read", "update", "approve"],
    "audit-log": ["read"],
  },
  CLERK: {
    shipment: ["read", "create", "update"],
    customs: ["read", "create", "update"],
    invoice: ["read", "create", "update"],
    finance: ["read", "create"],
    // No payroll, account, or budget — those are admin/manager only.
    payroll: ["read"],
    account: ["read"],
    wallet: ["read", "create", "update"],
    // CLERK can submit expenses but not approve, update existing, or delete.
    expense: ["read", "create"],
    budget: ["read"],
    client: ["read", "create", "update"],
    project: ["read", "create", "update"],
    task: ["read", "create", "update"],
    settings: ["read"],
    "marketplace-admin": ["read"],
  },
  VIEWER: {
    shipment: ["read"],
    customs: ["read"],
    invoice: ["read"],
    finance: ["read"],
    payroll: ["read"],
    account: ["read"],
    wallet: ["read"],
    expense: ["read"],
    budget: ["read"],
    client: ["read"],
    project: ["read"],
    task: ["read"],
    team: ["read"],
    settings: ["read"],
    "marketplace-admin": ["read"],
  },
}

/**
 * Thrown by `requireCan` when a staff user lacks the requested permission.
 * Distinguishing this from generic `Error` lets server-action error handlers
 * map it to a stable `FORBIDDEN` code instead of leaking the role name to
 * the client (see `safeActionError` in `src/lib/action-error.ts`).
 */
export class ForbiddenError extends Error {
  readonly action: Action
  readonly resource: Resource
  readonly role: UserRole
  constructor(role: UserRole, action: Action, resource: Resource) {
    super(`Forbidden: ${role} cannot ${action} ${resource}`)
    this.name = "ForbiddenError"
    this.role = role
    this.action = action
    this.resource = resource
  }
}

/**
 * True if the given staff user may perform `action` on `resource`.
 * Community users always get `false` here — they must go through `canAccessRow`.
 */
export function can(ctx: AuthContext | null, action: Action, resource: Resource): boolean {
  if (!ctx || ctx.userType !== "STAFF") return false
  if (ctx.role === "ADMIN") return true
  const allowed = MATRIX[ctx.role]?.[resource] ?? []
  return allowed.includes(action)
}

/**
 * Throws `ForbiddenError` if the staff user cannot perform `action` on
 * `resource`. Use at the top of server actions after `requireStaff()`.
 */
export function requireCan(ctx: AuthContext, action: Action, resource: Resource): void {
  if (!can(ctx, action, resource)) {
    throw new ForbiddenError(ctx.role, action, resource)
  }
}

/**
 * Permission check against a raw NextAuth session-user shape, without first
 * building a full `AuthContext`. Designed for the existing
 * `await auth()` → `if (!session?.user?.id)` pattern in server actions:
 *
 *     const session = await auth()
 *     if (!session?.user?.id) return { success: false, error: "Unauthorized" }
 *     if (!userCan(session.user, "create", "payroll")) {
 *       return { success: false, error: "Forbidden", code: "FORBIDDEN" }
 *     }
 *
 * Returns `false` for unknown roles, community users, and missing fields —
 * fail-closed by construction.
 */
export function userCan(
  user:
    | {
        id?: string | null
        type?: string | null
        role?: string | null
      }
    | null
    | undefined,
  action: Action,
  resource: Resource,
): boolean {
  if (!user?.id) return false
  if (user.type !== "STAFF") return false
  if (user.role === "ADMIN") return true
  const role = user.role as Exclude<UserRole, "ADMIN"> | null | undefined
  if (!role) return false
  const allowed = MATRIX[role]?.[resource] ?? []
  return allowed.includes(action)
}
