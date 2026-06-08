"use server"

/**
 * Profit margin per shipment.
 *
 * Revenue model for Mazin (the clearing agent):
 * - Revenue = invoice line-items where `feeCategory` is in the agent-fee list
 *   (Customs Declaration, Examination, Supervision, Local Transport, Labor
 *   Wages, Commission). These are what Mazin actually keeps.
 *
 * Cost model:
 * - Pass-through `ShipmentPayment` rows where the payee is NOT `CLEARING_AGENT`
 *   (Customs, Sea Ports, Shipping Line, SSMO, Ministry of Trade, Transport).
 * - `CustomsPayment` rows linked to the shipment via the declaration are also
 *   treated as cost (they're the duty/VAT/excise paid to the authority).
 *
 * Margin = revenue − cost, expressed as both an absolute number (SDG) and a
 * percentage of revenue. Snapshot is computed live; we'll persist it on
 * shipment close in a follow-up to keep historical margins stable.
 */

import { db } from "@/lib/db"
import { auth } from "@/auth"
import type { FeeCategory } from "@prisma/client"

// Agent fees that count as Mazin's revenue. Drawn from `FeeCategory` enum
// (`prisma/models/invoice.prisma`) cross-referenced with the real fee shape in
// `docs/knowledge/fee-structure.md`. Everything not in this list is pass-through.
const AGENT_REVENUE_CATEGORIES: FeeCategory[] = [
  "CUSTOMS_DECLARATION",
  "EXAMINATION",
  "CUSTOMS_SUPERVISION",
  "TRANSPORTATION",
  "LABOURERS_WAGES",
  "CHECKERS_WAGES",
  "OVERTIME_CHARGES",
  "COMMISSION",
  "OTHER",
]

export interface ShipmentProfit {
  shipmentId: string
  currency: string
  revenue: number
  cost: number
  margin: number
  marginPercent: number
  breakdown: {
    agentFees: number
    passThroughPayments: number
    customsPayments: number
  }
}

export async function getShipmentProfit(shipmentId: string): Promise<ShipmentProfit> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const shipment = await db.shipment.findFirst({
    where: { id: shipmentId, userId: session.user.id },
    select: { id: true },
  })
  if (!shipment) throw new Error("Shipment not found")

  const [invoiceItems, payments, customsPayments] = await Promise.all([
    db.invoiceItem.findMany({
      where: {
        invoice: { shipmentId, status: { not: "CANCELLED" } },
        feeCategory: { in: AGENT_REVENUE_CATEGORIES },
      },
      select: { total: true, invoice: { select: { currency: true } } },
    }),
    db.shipmentPayment.findMany({
      where: {
        shipmentId,
        payee: { not: "CLEARING_AGENT" },
        status: { in: ["PAID", "CONFIRMED"] },
      },
      select: { amount: true, currency: true },
    }),
    db.customsPayment.findMany({
      where: {
        declaration: { shipmentId },
        status: { in: ["PAID", "CONFIRMED"] },
      },
      select: { amount: true },
    }),
  ])

  const currency = invoiceItems[0]?.invoice?.currency ?? "SDG"
  const agentFees = invoiceItems.reduce((sum, i) => sum + Number(i.total), 0)
  const passThroughPayments = payments.reduce((sum, p) => sum + Number(p.amount), 0)
  const customsTotal = customsPayments.reduce((sum, p) => sum + Number(p.amount), 0)

  const revenue = agentFees
  const cost = passThroughPayments + customsTotal
  const margin = revenue - cost
  const marginPercent = revenue > 0 ? (margin / revenue) * 100 : 0

  return {
    shipmentId,
    currency,
    revenue,
    cost,
    margin,
    marginPercent,
    breakdown: {
      agentFees,
      passThroughPayments,
      customsPayments: customsTotal,
    },
  }
}

/** Aggregate profit across every shipment in a client's recent history. */
export async function getClientProfit(clientId: string, opts: { since?: Date } = {}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const shipments = await db.shipment.findMany({
    where: {
      userId: session.user.id,
      clientId,
      createdAt: opts.since ? { gte: opts.since } : undefined,
    },
    select: { id: true, shipmentNumber: true, createdAt: true },
  })

  const profits = await Promise.all(shipments.map((s) => getShipmentProfit(s.id)))

  const totalRevenue = profits.reduce((sum, p) => sum + p.revenue, 0)
  const totalCost = profits.reduce((sum, p) => sum + p.cost, 0)
  const totalMargin = totalRevenue - totalCost
  const avgMarginPercent =
    totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0

  return {
    clientId,
    shipmentCount: shipments.length,
    totalRevenue,
    totalCost,
    totalMargin,
    avgMarginPercent,
    perShipment: shipments.map((s, i) => ({
      shipmentNumber: s.shipmentNumber,
      ...profits[i]!,
    })),
  }
}
