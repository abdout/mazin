/**
 * Schematic Access Token Provider (Stubbed)
 *
 * TODO: Install @schematichq/schematic-typescript-node for subscription management
 * This stub allows the build to pass without the Schematic dependencies
 */

"use server"

import { auth } from "@/auth"
import { getTenantContext } from "@/lib/tenant-context"
import { logger } from "@/lib/logger"

const log = logger.forModule("receipt.access-token")

/**
 * Get a temporary Schematic access token for the current user/company (Stubbed)
 *
 * @returns Temporary access token or null if not authenticated
 */
export async function getTemporaryAccessToken(): Promise<string | null> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      log.warn("getTemporaryAccessToken: No authenticated user")
      return null
    }

    const tenantContext = await getTenantContext()
    const companyId = tenantContext?.companyId

    if (!companyId) {
      log.warn("getTemporaryAccessToken: No companyId found")
      return null
    }

    // Return stub token for development
    return `stub-access-token-${companyId}-${Date.now()}`
  } catch (error) {
    log.error("Failed to get temporary access token", error as Error)
    return null
  }
}
