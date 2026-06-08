"use server"

/**
 * Compliance reminders aggregator for the cockpit panel.
 *
 * Combines countdowns from IM Form expiry, ACD validation deadline, Delivery
 * Order expiry, and stage SLA breaches into a single sorted "act now" list.
 * Worst-first ordering — overdue items lead, then 1d / 3d / 5d / 10d windows.
 */

import { db } from "@/lib/db"
import { auth } from "@/auth"
import { STAGE_CONFIG } from "@/lib/tracking/constants"

export type ComplianceKind =
  | "im-expiring"
  | "acd-due"
  | "do-expiring"
  | "stage-sla"

export interface ComplianceItem {
  id: string
  kind: ComplianceKind
  shipmentId: string
  shipmentNumber?: string
  /** Negative for overdue, 0 for today, positive for "due in N days". */
  daysFromDeadline: number
  title: string
  href: string
}

const DAY = 24 * 60 * 60 * 1000

export async function getComplianceReminders(): Promise<ComplianceItem[]> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const now = new Date()
  const horizon = new Date(now.getTime() + 14 * DAY)
  const items: ComplianceItem[] = []

  // 1) IM Form expiry — every active or value-mismatched IM in the next 14 days.
  const imForms = await db.iMForm.findMany({
    where: {
      status: { in: ["ACTIVE", "VALUE_MISMATCH"] },
      expiryDate: { lte: horizon },
    },
    select: {
      id: true,
      imNumber: true,
      expiryDate: true,
      shipmentId: true,
      shipment: { select: { shipmentNumber: true } },
    },
  })
  for (const im of imForms) {
    if (!im.expiryDate) continue
    items.push({
      id: `im:${im.id}`,
      kind: "im-expiring",
      shipmentId: im.shipmentId,
      shipmentNumber: im.shipment?.shipmentNumber,
      daysFromDeadline: Math.ceil((im.expiryDate.getTime() - now.getTime()) / DAY),
      title: `IM ${im.imNumber}`,
      href: `/project/${im.shipmentId}/imform`,
    })
  }

  // 2) ACD validation deadline — DRAFT/SUBMITTED ACDs whose vessel ETA is
  //    within the horizon. Sudanese rule: ACD must be validated 5 days before
  //    arrival, so the deadline is `estimatedArrival - 5 days`.
  const acds = await db.advanceCargoDeclaration.findMany({
    where: {
      status: { in: ["DRAFT", "SUBMITTED"] },
      estimatedArrival: { lte: horizon, not: null },
    },
    select: {
      id: true,
      acnNumber: true,
      estimatedArrival: true,
      shipmentId: true,
    },
  })
  for (const acd of acds) {
    if (!acd.estimatedArrival) continue
    const deadline = new Date(acd.estimatedArrival.getTime() - 5 * DAY)
    items.push({
      id: `acd:${acd.id}`,
      kind: "acd-due",
      shipmentId: acd.shipmentId,
      daysFromDeadline: Math.ceil((deadline.getTime() - now.getTime()) / DAY),
      title: `ACD ${acd.acnNumber}`,
      href: `/project/${acd.shipmentId}/acd`,
    })
  }

  // 3) Delivery Order expiry — uploaded D/O docs whose `expiryDate` is set.
  const dos = await db.shipmentDocument.findMany({
    where: {
      docType: "DELIVERY_ORDER",
      expiryDate: { lte: horizon },
      status: { in: ["UPLOADED", "VERIFIED"] },
    },
    select: {
      id: true,
      documentNo: true,
      expiryDate: true,
      shipmentId: true,
      shipment: { select: { shipmentNumber: true } },
    },
  })
  for (const d of dos) {
    if (!d.expiryDate) continue
    items.push({
      id: `do:${d.id}`,
      kind: "do-expiring",
      shipmentId: d.shipmentId,
      shipmentNumber: d.shipment?.shipmentNumber,
      daysFromDeadline: Math.ceil((d.expiryDate.getTime() - now.getTime()) / DAY),
      title: `D/O ${d.documentNo ?? "—"}`,
      href: `/project/${d.shipmentId}/docs`,
    })
  }

  // 4) Stage SLA breaches — IN_PROGRESS stages that have overrun their estimate.
  const inProgress = await db.trackingStage.findMany({
    where: { status: "IN_PROGRESS" },
    select: {
      shipmentId: true,
      stageType: true,
      startedAt: true,
      shipment: { select: { shipmentNumber: true } },
    },
  })
  for (const stage of inProgress) {
    if (!stage.startedAt) continue
    const expected = STAGE_CONFIG[stage.stageType]?.estimatedHours
    if (!expected || expected <= 0) continue
    const elapsedHours = (now.getTime() - stage.startedAt.getTime()) / (60 * 60 * 1000)
    if (elapsedHours <= expected) continue
    items.push({
      id: `sla:${stage.shipmentId}:${stage.stageType}`,
      kind: "stage-sla",
      shipmentId: stage.shipmentId,
      shipmentNumber: stage.shipment?.shipmentNumber,
      // Translate "h over estimate" to a comparable days-from-deadline scalar
      // so the panel can sort them alongside calendar items.
      daysFromDeadline: -Math.floor((elapsedHours - expected) / 24),
      title: `Stage running long: ${stage.stageType}`,
      href: `/project/${stage.shipmentId}`,
    })
  }

  // Worst first: most-overdue (most-negative) → most-urgent (smallest positive).
  return items.sort((a, b) => a.daysFromDeadline - b.daysFromDeadline)
}
