import { auth } from "@/auth"
import type { UserRole, UserType } from "@prisma/client"

/**
 * Canonical session/access context for Mazin.
 *
 * Single-tenant: all staff share the same dataset. Ownership isolation only
 * applies to COMMUNITY users on marketplace rows (scoped by `userId`).
 */
export interface AuthContext {
  userId: string
  userType: UserType
  role: UserRole // Only meaningful when userType === 'STAFF'
  email: string
}

export async function getAuthContext(): Promise<AuthContext | null> {
  const session = await auth()
  if (!session?.user?.id) return null

  return {
    userId: session.user.id,
    userType: (session.user.type ?? "COMMUNITY") as UserType,
    role: (session.user.role ?? "VIEWER") as UserRole,
    email: session.user.email ?? "",
  }
}

export async function requireAuthContext(): Promise<AuthContext> {
  const ctx = await getAuthContext()
  if (!ctx) throw new Error("Unauthorized")
  return ctx
}

export async function requireStaff(): Promise<AuthContext> {
  const ctx = await requireAuthContext()
  if (ctx.userType !== "STAFF") throw new Error("Staff access required")
  return ctx
}

export function isStaff(ctx: AuthContext | null): ctx is AuthContext {
  return ctx?.userType === "STAFF"
}

/**
 * Ownership check for marketplace rows. Staff can see everything (moderation);
 * community users only see rows they own.
 */
export function canAccessRow(ctx: AuthContext | null, ownerId: string | null): boolean {
  if (!ctx) return false
  if (ctx.userType === "STAFF") return true
  return ownerId === ctx.userId
}
