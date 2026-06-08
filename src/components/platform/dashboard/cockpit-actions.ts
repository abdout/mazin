"use server"

/**
 * "Today" cockpit — action-oriented data that needs Mazin's attention right
 * now. Each function returns a small, focused list (max 8) so the cockpit
 * stays scannable.
 */

import { db } from "@/lib/db"
import { auth } from "@/auth"
import { STAGE_CONFIG } from "@/lib/tracking/constants"

const DAY = 24 * 60 * 60 * 1000

export interface StuckShipment {
  shipmentId: string
  shipmentNumber: string
  stageType: string
  hoursOver: number
  href: string
}

/** Shipments where the active stage has been IN_PROGRESS longer than expected. */
export async function getStuckShipments(): Promise<StuckShipment[]> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const stages = await db.trackingStage.findMany({
    where: { status: "IN_PROGRESS" },
    select: {
      shipmentId: true,
      stageType: true,
      startedAt: true,
      shipment: { select: { shipmentNumber: true } },
    },
  })

  const now = Date.now()
  const items: StuckShipment[] = []
  for (const s of stages) {
    if (!s.startedAt) continue
    const expected = STAGE_CONFIG[s.stageType]?.estimatedHours
    if (!expected || expected <= 0) continue
    const elapsed = (now - s.startedAt.getTime()) / (60 * 60 * 1000)
    if (elapsed <= expected) continue
    items.push({
      shipmentId: s.shipmentId,
      shipmentNumber: s.shipment?.shipmentNumber ?? "",
      stageType: s.stageType,
      hoursOver: Math.round(elapsed - expected),
      href: `/project/${s.shipmentId}`,
    })
  }
  return items.sort((a, b) => b.hoursOver - a.hoursOver).slice(0, 8)
}

export interface UnpaidPayee {
  paymentId: string
  shipmentId: string
  shipmentNumber: string
  payee: string
  amount: number
  currency: string
  daysOverdue: number
  href: string
}

/** Payments due now or already overdue, sorted worst-first. */
export async function getUnpaidPayees(): Promise<UnpaidPayee[]> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const dueWithin = new Date(Date.now() + 3 * DAY)
  const payments = await db.shipmentPayment.findMany({
    where: {
      status: { in: ["PENDING", "PARTIAL"] },
      dueDate: { lte: dueWithin },
    },
    select: {
      id: true,
      payee: true,
      amount: true,
      currency: true,
      dueDate: true,
      shipmentId: true,
      shipment: { select: { shipmentNumber: true } },
    },
    orderBy: { dueDate: "asc" },
    take: 12,
  })

  const now = Date.now()
  return payments.map((p) => ({
    paymentId: p.id,
    shipmentId: p.shipmentId,
    shipmentNumber: p.shipment?.shipmentNumber ?? "",
    payee: p.payee,
    amount: Number(p.amount),
    currency: p.currency,
    daysOverdue: p.dueDate
      ? Math.floor((now - p.dueDate.getTime()) / DAY)
      : 0,
    href: `/project/${p.shipmentId}/payments`,
  }))
}

export interface OpenLead {
  clientId: string
  companyName: string
  createdAt: Date
  daysSinceContact: number
  href: string
}

/** Recently-created clients without an active project — likely fresh leads. */
export async function getOpenLeads(): Promise<OpenLead[]> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const since = new Date(Date.now() - 30 * DAY)
  const clients = await db.client.findMany({
    where: {
      userId: session.user.id,
      createdAt: { gte: since },
      // No projects yet → still a lead.
      Project: { none: {} },
    },
    select: { id: true, companyName: true, contactName: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 8,
  })
  const now = Date.now()
  return clients.map((c) => ({
    clientId: c.id,
    companyName: c.companyName ?? c.contactName ?? "Unknown",
    createdAt: c.createdAt,
    daysSinceContact: Math.floor((now - c.createdAt.getTime()) / DAY),
    href: `/customer/${c.id}`,
  }))
}
