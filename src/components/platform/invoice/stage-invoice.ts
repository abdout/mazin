"use server"

/**
 * Stage-invoice helper — creates an Invoice tied to a Shipment's clearance
 * stage (port fees, customs payment, SSMO, agent commission). Not auto-fired
 * from `transitionStage` yet because fee amounts are staff-entered per
 * shipment; expose as a button on the shipment detail timeline instead.
 */

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { logAudit } from "@/lib/audit"
import { requireStaff } from "@/lib/auth-context"
import { requireCan } from "@/lib/authorization"
import type { TrackingStageType } from "@prisma/client"

const log = logger.forModule("invoice.stage")

const VAT_RATE = 17

/**
 * Maps a tracking stage to the invoice fee type and a human label. If a stage
 * isn't in this map it doesn't warrant a stage invoice (e.g. PRE_ARRIVAL_DOCS).
 */
const STAGE_FEE_MAP: Partial<Record<TrackingStageType, { feeType: string; label: string; labelAr: string }>> = {
  CUSTOMS_PAYMENT: { feeType: "CUSTOMS_DUTY", label: "Customs duty", labelAr: "رسوم جمركية" },
  PORT_FEES: { feeType: "PORT_FEES", label: "Port fees", labelAr: "رسوم الميناء" },
  INSPECTION: { feeType: "INSPECTION", label: "Inspection fee", labelAr: "رسوم التفتيش" },
  QUALITY_STANDARDS: { feeType: "SSMO", label: "SSMO inspection", labelAr: "فحص المواصفات السودانية" },
  RELEASE: { feeType: "RELEASE_FEES", label: "Release fees", labelAr: "رسوم الإفراج" },
}

function generateInvoiceNumber(): string {
  const yr = new Date().getFullYear().toString().slice(-2)
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `${rand}/${yr}`
}

export async function createStageInvoice(params: {
  shipmentId: string
  stage: TrackingStageType
  amount: number
  currency?: string
  description?: string
  paymentTermsDays?: number
}) {
  const ctx = await requireStaff()
  requireCan(ctx, "create", "invoice")

  const mapping = STAGE_FEE_MAP[params.stage]
  if (!mapping) {
    throw new Error(`Stage ${params.stage} does not support stage invoicing`)
  }
  if (params.amount <= 0) {
    throw new Error("Amount must be positive")
  }

  const shipment = await db.shipment.findUnique({
    where: { id: params.shipmentId },
    select: { id: true, clientId: true, consignee: true },
  })
  if (!shipment) throw new Error("Shipment not found")

  const subtotal = params.amount
  const tax = (subtotal * VAT_RATE) / 100
  const total = subtotal + tax
  const currency = params.currency ?? "SDG"
  const dueDate = params.paymentTermsDays
    ? new Date(Date.now() + params.paymentTermsDays * 24 * 60 * 60 * 1000)
    : undefined

  const invoice = await db.invoice.create({
    data: {
      invoiceNumber: generateInvoiceNumber(),
      status: "DRAFT",
      invoiceType: "CLEARANCE",
      currency,
      subtotal,
      tax,
      total,
      taxRate: VAT_RATE,
      dueDate,
      paymentTermsDays: params.paymentTermsDays,
      supplierName: mapping.label,
      clientId: shipment.clientId,
      shipmentId: shipment.id,
      userId: ctx.userId,
      items: {
        create: {
          description: params.description ?? `${mapping.label} — ${shipment.consignee}`,
          descriptionAr: mapping.labelAr,
          quantity: 1,
          unitPrice: subtotal,
          total: subtotal,
          feeType: mapping.feeType,
        },
      },
      stageInvoices: {
        create: { shipmentId: shipment.id, stage: params.stage, feeType: mapping.feeType },
      },
    },
    include: { items: true, stageInvoices: true },
  })

  // Mark the stage as payment-requested so the timeline shows the billing.
  await db.trackingStage.updateMany({
    where: { shipmentId: shipment.id, stageType: params.stage },
    data: { paymentRequested: true },
  })

  await logAudit({
    action: "RECORD_CREATE",
    actor: ctx,
    resource: "invoice",
    resourceId: invoice.id,
    metadata: {
      invoiceNumber: invoice.invoiceNumber,
      stage: params.stage,
      feeType: mapping.feeType,
      total,
    },
  })

  revalidatePath(`/shipments/${shipment.id}`)
  revalidatePath("/invoice")
  log.info("stage invoice created", { id: invoice.id, stage: params.stage, total })
  return invoice
}
