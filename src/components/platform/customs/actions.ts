"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { logAudit } from "@/lib/audit"
import { requireStaff } from "@/lib/auth-context"
import { requireCan } from "@/lib/authorization"
import {
  acdSchema,
  validateAcdPreArrival,
  type AcdData,
} from "./acd-validation"

const log = logger.forModule("customs")

function generateAcnNumber(): string {
  const ym = new Date().toISOString().slice(0, 7).replace("-", "") // 202601
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase()
  return `ACN-${ym}-${rand}`
}

export async function createAcd(data: AcdData) {
  const ctx = await requireStaff()
  requireCan(ctx, "create", "customs")

  const validated = acdSchema.parse(data)

  // 5-day pre-arrival rule — enforced at the server, not just the form.
  const violation = validateAcdPreArrival(validated.estimatedArrival)
  if (violation) {
    throw new Error(violation)
  }

  // Shipment must exist; keep the FK relationship.
  const shipment = await db.shipment.findUnique({ where: { id: validated.shipmentId } })
  if (!shipment) throw new Error("Shipment not found")

  const acd = await db.advanceCargoDeclaration.create({
    data: {
      acnNumber: generateAcnNumber(),
      status: "DRAFT",
      shipmentId: validated.shipmentId,
      userId: ctx.userId,
      consignor: validated.consignor,
      consignee: validated.consignee,
      hsCode: validated.hsCode,
      cargoDescription: validated.cargoDescription,
      estimatedWeight: validated.estimatedWeight,
      quantity: validated.quantity,
      vesselName: validated.vesselName,
      voyageNumber: validated.voyageNumber,
      portOfLoading: validated.portOfLoading,
      portOfDischarge: validated.portOfDischarge,
      estimatedArrival: validated.estimatedArrival,
    },
  })

  await logAudit({
    action: "RECORD_CREATE",
    actor: ctx,
    resource: "acd",
    resourceId: acd.id,
    metadata: { acnNumber: acd.acnNumber, shipmentId: acd.shipmentId },
  })

  revalidatePath(`/shipments/${validated.shipmentId}`)
  revalidatePath("/customs")
  log.info("ACD created", { acn: acd.acnNumber })
  return acd
}

export async function validateAcd(acdId: string) {
  const ctx = await requireStaff()
  requireCan(ctx, "approve", "customs")

  const acd = await db.advanceCargoDeclaration.update({
    where: { id: acdId },
    data: {
      status: "VALIDATED",
      validatedAt: new Date(),
      validatedBy: ctx.userId,
    },
  })

  await logAudit({
    action: "RECORD_UPDATE",
    actor: ctx,
    resource: "acd",
    resourceId: acdId,
    metadata: { status: "VALIDATED" },
  })

  revalidatePath(`/shipments/${acd.shipmentId}`)
  revalidatePath("/customs")
  return acd
}

export async function listAcds(filters?: { status?: "DRAFT" | "SUBMITTED" | "VALIDATED" | "REJECTED" }) {
  const ctx = await requireStaff()
  requireCan(ctx, "read", "customs")

  return db.advanceCargoDeclaration.findMany({
    where: filters?.status ? { status: filters.status } : undefined,
    include: {
      shipment: { select: { shipmentNumber: true, consignee: true } },
    },
    orderBy: { createdAt: "desc" },
  })
}
