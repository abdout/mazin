/**
 * @deprecated Use `@/lib/auth-context` instead.
 *
 * Kept as a thin compatibility shim. The "tenant" abstraction is a holdover
 * from the school-management fork; Mazin is single-tenant.
 */
import { auth } from "@/auth"
import { getAuthContext } from "@/lib/auth-context"

export interface TenantContext {
  userId: string
  organizationId?: string
  companyId?: string
}

export async function getTenantContext(): Promise<TenantContext | null> {
  const ctx = await getAuthContext()
  if (!ctx) return null
  return {
    userId: ctx.userId,
    organizationId: undefined,
    companyId: undefined,
  }
}

export async function checkTenantAccess(): Promise<boolean> {
  return (await getAuthContext()) !== null
}

export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.id ?? null
}
