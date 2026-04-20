"use server"

import { auth } from "@/auth"
import { getTenantContext as getSessionTenant } from "@/lib/tenant-context"

/**
 * Operator/finance-module tenant adapter.
 *
 * The operator scaffolds were imported from the school template where tenant
 * scoping is `schoolId`. Mazin's real identity is session-based (userId).
 * We expose `schoolId` as the session userId so existing queries scope by
 * the caller's own data; when a dedicated Tenant/Company model is added,
 * swap this to return `session.user.companyId`.
 */
export async function getTenantContext() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const tenant = await getSessionTenant()
  const tenantId = tenant?.companyId ?? tenant?.organizationId ?? session.user.id

  return {
    schoolId: tenantId,
    userId: session.user.id,
    role: session.user.role ?? "USER",
  }
}
