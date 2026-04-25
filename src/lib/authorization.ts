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
  | "finance"
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
 * CLERK: operational CRUD, no approvals or deletes on financial records.
 * VIEWER: read-only everywhere.
 */
const MATRIX: Record<Exclude<UserRole, "ADMIN">, Partial<Record<Resource, Action[]>>> = {
  MANAGER: {
    shipment: ["read", "create", "update", "delete", "approve"],
    customs: ["read", "create", "update", "approve"],
    invoice: ["read", "create", "update", "approve"],
    finance: ["read", "create", "update", "approve"],
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
    client: ["read"],
    project: ["read"],
    task: ["read"],
    team: ["read"],
    settings: ["read"],
    "marketplace-admin": ["read"],
  },
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
 * Throws if the staff user cannot perform `action` on `resource`.
 * Use at the top of server actions after `requireStaff()`.
 */
export function requireCan(ctx: AuthContext, action: Action, resource: Resource): void {
  if (!can(ctx, action, resource)) {
    throw new Error(`Forbidden: ${ctx.role} cannot ${action} ${resource}`)
  }
}
