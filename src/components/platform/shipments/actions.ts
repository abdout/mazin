"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { logAudit } from "@/lib/audit"
import { requireStaff } from "@/lib/auth-context"
import { requireCan } from "@/lib/authorization"
import {
  shipmentIntakeSchema,
  stageTransitionSchema,
  type ShipmentIntakeData,
  type StageTransitionData,
} from "./validation"
import { STAGE_SEQUENCE, prerequisites } from "./stage-machine"

const log = logger.forModule("shipments")

function generateShipmentNumber(): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `SHP-${ts}${rand}`
}

function generateTrackingNumber(): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `TRK-${rand}`
}

export async function listShipments(filters?: {
  status?: "PENDING" | "IN_TRANSIT" | "ARRIVED" | "CLEARED" | "DELIVERED"
  clientId?: string
  search?: string
  page?: number
  pageSize?: number
}) {
  const ctx = await requireStaff()
  requireCan(ctx, "read", "shipment")

  const page = Math.max(1, filters?.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, filters?.pageSize ?? 20))

  const where: Record<string, unknown> = {}
  if (filters?.status) where.status = filters.status
  if (filters?.clientId) where.clientId = filters.clientId
  if (filters?.search) {
    where.OR = [
      { shipmentNumber: { contains: filters.search, mode: "insensitive" } },
      { trackingNumber: { contains: filters.search, mode: "insensitive" } },
      { consignee: { contains: filters.search, mode: "insensitive" } },
      { consignor: { contains: filters.search, mode: "insensitive" } },
      { vesselName: { contains: filters.search, mode: "insensitive" } },
    ]
  }

  const [rows, total] = await Promise.all([
    db.shipment.findMany({
      where,
      include: {
        client: { select: { id: true, companyName: true } },
        trackingStages: { select: { stageType: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.shipment.count({ where }),
  ])

  return { rows, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

export async function getShipment(id: string) {
  const ctx = await requireStaff()
  requireCan(ctx, "read", "shipment")

  return db.shipment.findUnique({
    where: { id },
    include: {
      client: true,
      project: true,
      trackingStages: { orderBy: { createdAt: "asc" } },
      declarations: true,
      acds: true,
      invoices: { select: { id: true, invoiceNumber: true, status: true, totalAmount: true } },
      containers: true,
      documents: true,
    },
  })
}

export async function createShipment(data: ShipmentIntakeData) {
  const ctx = await requireStaff()
  requireCan(ctx, "create", "shipment")

  const validated = shipmentIntakeSchema.parse(data)

  // Seed one TrackingStage row per canonical stage so the timeline UI has
  // something to render — all start PENDING, progressed via transitionStage.
  const stageSeed = STAGE_SEQUENCE.map(stageType => ({ stageType, status: "PENDING" as const }))

  const shipment = await db.shipment.create({
    data: {
      shipmentNumber: generateShipmentNumber(),
      trackingNumber: generateTrackingNumber(),
      userId: ctx.userId,
      type: validated.type,
      description: validated.description,
      weight: validated.weight,
      quantity: validated.quantity,
      containerNumber: validated.containerNumber,
      vesselName: validated.vesselName,
      consignor: validated.consignor,
      consignee: validated.consignee,
      arrivalDate: validated.arrivalDate,
      departureDate: validated.departureDate,
      freeDays: validated.freeDays,
      demurrageDailyRate: validated.demurrageDailyRate,
      clientId: validated.clientId,
      projectId: validated.projectId,
      publicTrackingEnabled: validated.publicTrackingEnabled,
      trackingStages: { create: stageSeed },
    },
  })

  await logAudit({
    action: "RECORD_CREATE",
    actor: ctx,
    resource: "shipment",
    resourceId: shipment.id,
    metadata: { shipmentNumber: shipment.shipmentNumber },
  })

  revalidatePath("/shipments")
  log.info("shipment created", { id: shipment.id })
  return shipment
}

export async function updateShipment(id: string, data: Partial<ShipmentIntakeData>) {
  const ctx = await requireStaff()
  requireCan(ctx, "update", "shipment")

  // Whitelist-validate partial input. Extra fields (e.g. `userId`) are dropped.
  const validated = shipmentIntakeSchema.partial().parse(data)

  const shipment = await db.shipment.update({
    where: { id },
    data: validated,
  })

  await logAudit({
    action: "RECORD_UPDATE",
    actor: ctx,
    resource: "shipment",
    resourceId: id,
    metadata: { fields: Object.keys(validated) },
  })

  revalidatePath("/shipments")
  revalidatePath(`/shipments/${id}`)
  return shipment
}

export async function deleteShipment(id: string) {
  const ctx = await requireStaff()
  requireCan(ctx, "delete", "shipment")

  const shipment = await db.shipment.findUnique({
    where: { id },
    include: { invoices: { select: { id: true } } },
  })
  if (!shipment) throw new Error("Shipment not found")
  if (shipment.invoices.length > 0) {
    throw new Error("Cannot delete shipment with invoices — cancel invoices first")
  }

  await db.shipment.delete({ where: { id } })
  await logAudit({
    action: "RECORD_DELETE",
    actor: ctx,
    resource: "shipment",
    resourceId: id,
  })

  revalidatePath("/shipments")
}

/**
 * Transition a tracking stage. Enforces the state machine:
 *  - cannot COMPLETE a stage whose prerequisites are not COMPLETED or SKIPPED
 *  - records `startedAt` on first non-PENDING status, `completedAt` on COMPLETED
 */
export async function transitionStage(data: StageTransitionData) {
  const ctx = await requireStaff()
  requireCan(ctx, "update", "shipment")

  const validated = stageTransitionSchema.parse(data)

  if (validated.status === "COMPLETED") {
    const prereqs = prerequisites(validated.stageType)
    if (prereqs.length > 0) {
      const unresolved = await db.trackingStage.findMany({
        where: {
          shipmentId: validated.shipmentId,
          stageType: { in: prereqs },
          status: { notIn: ["COMPLETED", "SKIPPED"] },
        },
        select: { stageType: true },
      })
      if (unresolved.length > 0) {
        throw new Error(
          `Cannot complete ${validated.stageType} — prerequisite stages pending: ${unresolved
            .map(s => s.stageType)
            .join(", ")}`
        )
      }
    }
  }

  const now = new Date()
  const stage = await db.trackingStage.upsert({
    where: {
      shipmentId_stageType: {
        shipmentId: validated.shipmentId,
        stageType: validated.stageType,
      },
    },
    update: {
      status: validated.status,
      notes: validated.notes,
      updatedById: ctx.userId,
      startedAt: validated.status !== "PENDING" ? now : undefined,
      completedAt: validated.status === "COMPLETED" ? now : null,
    },
    create: {
      shipmentId: validated.shipmentId,
      stageType: validated.stageType,
      status: validated.status,
      notes: validated.notes,
      updatedById: ctx.userId,
      startedAt: validated.status !== "PENDING" ? now : null,
      completedAt: validated.status === "COMPLETED" ? now : null,
    },
  })

  // Roll up to the shipment-level status when the final stage completes.
  if (validated.stageType === "DELIVERED" && validated.status === "COMPLETED") {
    await db.shipment.update({
      where: { id: validated.shipmentId },
      data: { status: "DELIVERED" },
    })
  }

  await logAudit({
    action: "RECORD_UPDATE",
    actor: ctx,
    resource: "tracking_stage",
    resourceId: stage.id,
    metadata: { stage: validated.stageType, status: validated.status },
  })

  revalidatePath(`/shipments/${validated.shipmentId}`)
  return stage
}
