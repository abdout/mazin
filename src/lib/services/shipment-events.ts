/**
 * Operator-facing activity feed for a single shipment.
 *
 * `AuditLog` is for security (compliance, who-changed-what at the column level).
 * This module is the *operational* feed — what the operator sees when they open
 * `/project/[id]` ("yesterday Mazin advanced this to INSPECTION; this morning a
 * receipt was uploaded by Hafiz; the demurrage cron flagged a warning at 06:00").
 *
 * Helpers are deliberately small and side-effect-only. Callers should still call
 * `logAudit(...)` separately when the change is security-relevant.
 */

import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import type { ShipmentEventKind, Prisma } from "@prisma/client"

const log = logger.forModule("services.shipment-events")

export interface RecordShipmentEventInput {
  shipmentId: string
  actorId?: string | null
  kind: ShipmentEventKind
  /** Bilingual one-liner; rendered as-is in the activity feed UI. */
  summary: string
  summaryAr?: string
  metadata?: Record<string, unknown>
}

/**
 * Append an event to the shipment's activity feed.
 *
 * Failures are logged but do not throw — the activity feed is non-critical and
 * we never want a feed write to break a stage advance or a payment record.
 */
export async function recordShipmentEvent(
  input: RecordShipmentEventInput
): Promise<void> {
  try {
    await db.shipmentEvent.create({
      data: {
        shipmentId: input.shipmentId,
        actorId: input.actorId ?? undefined,
        kind: input.kind,
        summary: input.summary,
        summaryAr: input.summaryAr ?? undefined,
        metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    })
  } catch (err) {
    log.warn("Failed to record shipment event — continuing", {
      shipmentId: input.shipmentId,
      kind: input.kind,
      error: err instanceof Error ? err.message : String(err),
    })
  }
}

/**
 * List events for one shipment, newest first. Used on the per-shipment timeline
 * drawer in the project view.
 */
export async function listShipmentEvents(
  shipmentId: string,
  opts: { take?: number; cursor?: string } = {}
) {
  return db.shipmentEvent.findMany({
    where: { shipmentId },
    orderBy: { createdAt: "desc" },
    take: opts.take ?? 50,
    ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
    include: {
      actor: { select: { id: true, name: true, image: true } },
    },
  })
}

/**
 * Org-wide activity feed for the cockpit and `/activity` route. Optionally
 * filter by actor, kind, or date window.
 */
export async function listOrgActivity(filters: {
  actorId?: string
  kinds?: ShipmentEventKind[]
  since?: Date
  take?: number
} = {}) {
  return db.shipmentEvent.findMany({
    where: {
      actorId: filters.actorId,
      kind: filters.kinds ? { in: filters.kinds } : undefined,
      createdAt: filters.since ? { gte: filters.since } : undefined,
    },
    orderBy: { createdAt: "desc" },
    take: filters.take ?? 100,
    include: {
      actor: { select: { id: true, name: true, image: true } },
      shipment: { select: { id: true, shipmentNumber: true, trackingNumber: true } },
    },
  })
}
