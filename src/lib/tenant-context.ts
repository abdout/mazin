import { auth } from "@/auth"

/**
 * Simplified tenant context for single-company deployment.
 * This replaces the multi-tenant schoolId pattern from the school management system.
 *
 * For single-company use, we simply return the authenticated user's ID.
 * The organizationId is currently unused but kept for future multi-tenant expansion.
 */

export interface TenantContext {
  userId: string
  organizationId?: string
  companyId?: string // Alias for organizationId for customs clearance context
}

export async function getTenantContext(): Promise<TenantContext | null> {
  const session = await auth()

  if (!session?.user?.id) {
    return null
  }

  return {
    userId: session.user.id,
    // For future multi-tenant support, this could be populated from user.organizationId
    organizationId: undefined,
    companyId: undefined, // Alias for organizationId
  }
}

/**
 * Helper to check if user has access (simplified for single-company)
 */
export async function checkTenantAccess(): Promise<boolean> {
  const context = await getTenantContext()
  return context !== null
}

/**
 * Get current user ID from session
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.id ?? null
}
