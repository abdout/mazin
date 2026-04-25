import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import type { AuditAction, Prisma } from "@prisma/client"
import type { AuthContext } from "@/lib/auth-context"

const log = logger.forModule("audit")

/**
 * Append an audit log entry. Failures are logged but never thrown — auditing
 * must not block the primary operation.
 */
export async function logAudit(entry: {
  action: AuditAction
  actor?: Pick<AuthContext, "userId" | "email"> | null
  resource?: string
  resourceId?: string
  metadata?: Prisma.JsonValue
  ipAddress?: string
  userAgent?: string
}): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        action: entry.action,
        actorId: entry.actor?.userId,
        actorEmail: entry.actor?.email,
        resource: entry.resource,
        resourceId: entry.resourceId,
        metadata: entry.metadata as Prisma.InputJsonValue,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
      },
    })
  } catch (error) {
    log.error("audit log write failed", error as Error, { action: entry.action })
  }
}
