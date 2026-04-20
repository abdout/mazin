"use server"

import { db } from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { ContainerSize, ContainerStatus } from "@prisma/client"

const createContainerSchema = z.object({
  shipmentId: z.string(),
  containerNumber: z.string().min(4),
  size: z.enum(["TWENTY_FT", "FORTY_FT", "FORTY_FT_HC", "FORTY_FIVE_FT", "OTHER"]).default("TWENTY_FT"),
  sealNumber: z.string().optional(),
  shippingLine: z.string().optional(),
  bookingReference: z.string().optional(),
  freeTimeDays: z.coerce.number().int().min(0).default(14),
  arrivalDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  demurrageRate: z.coerce.number().min(0).default(150),
  demurrageCurrency: z.string().default("USD"),
  notes: z.string().optional(),
})

const updateContainerSchema = createContainerSchema.partial().omit({ shipmentId: true })

function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0
  if (typeof value === "number") return value
  return parseFloat(String(value))
}

function calculateContainerStatus(
  arrivalDate: Date | null,
  freeTimeDays: number
): ContainerStatus {
  if (!arrivalDate) return "PENDING_ARRIVAL"
  const now = new Date()
  const daysElapsed = Math.floor(
    (now.getTime() - arrivalDate.getTime()) / (1000 * 60 * 60 * 24)
  )
  const remaining = freeTimeDays - daysElapsed
  if (remaining > 3) return "FREE"
  if (remaining > 0) return "WARNING"
  return "DEMURRAGE"
}

export async function createContainer(data: z.input<typeof createContainerSchema>) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const validated = createContainerSchema.parse(data)

  const shipment = await db.shipment.findFirst({
    where: { id: validated.shipmentId, userId: session.user.id },
  })
  if (!shipment) throw new Error("Shipment not found")

  const freeTimeExpiry = validated.arrivalDate
    ? new Date(validated.arrivalDate.getTime() + validated.freeTimeDays * 24 * 60 * 60 * 1000)
    : null

  const status = validated.arrivalDate
    ? calculateContainerStatus(validated.arrivalDate, validated.freeTimeDays)
    : "PENDING_ARRIVAL"

  const container = await db.container.create({
    data: {
      containerNumber: validated.containerNumber,
      size: validated.size as ContainerSize,
      sealNumber: validated.sealNumber,
      shippingLine: validated.shippingLine,
      bookingReference: validated.bookingReference,
      freeTimeDays: validated.freeTimeDays,
      arrivalDate: validated.arrivalDate,
      freeTimeExpiry,
      demurrageRate: validated.demurrageRate,
      demurrageCurrency: validated.demurrageCurrency,
      status,
      notes: validated.notes,
      shipmentId: validated.shipmentId,
    },
  })

  revalidatePath(`/project`)
  return container
}

export async function createContainersBatch(
  shipmentId: string,
  containers: z.input<typeof createContainerSchema>[]
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const shipment = await db.shipment.findFirst({
    where: { id: shipmentId, userId: session.user.id },
  })
  if (!shipment) throw new Error("Shipment not found")

  const results = []
  for (const containerData of containers) {
    const validated = createContainerSchema.parse({ ...containerData, shipmentId })

    const freeTimeExpiry = validated.arrivalDate
      ? new Date(validated.arrivalDate.getTime() + validated.freeTimeDays * 24 * 60 * 60 * 1000)
      : null

    const status = validated.arrivalDate
      ? calculateContainerStatus(validated.arrivalDate, validated.freeTimeDays)
      : "PENDING_ARRIVAL"

    results.push(
      await db.container.create({
        data: {
          containerNumber: validated.containerNumber,
          size: validated.size as ContainerSize,
          sealNumber: validated.sealNumber,
          shippingLine: validated.shippingLine,
          bookingReference: validated.bookingReference,
          freeTimeDays: validated.freeTimeDays,
          arrivalDate: validated.arrivalDate,
          freeTimeExpiry,
          demurrageRate: validated.demurrageRate,
          demurrageCurrency: validated.demurrageCurrency,
          status,
          notes: validated.notes,
          shipmentId,
        },
      })
    )
  }

  revalidatePath(`/project`)
  return results
}

export async function getContainers(shipmentId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const shipment = await db.shipment.findFirst({
    where: { id: shipmentId, userId: session.user.id },
  })
  if (!shipment) throw new Error("Shipment not found")

  const containers = await db.container.findMany({
    where: { shipmentId },
    orderBy: { createdAt: "asc" },
  })

  return containers.map((c) => ({
    ...c,
    demurrageRate: toNumber(c.demurrageRate),
    currentDemurrage: toNumber(c.currentDemurrage),
  }))
}

export async function updateContainer(
  containerId: string,
  data: z.input<typeof updateContainerSchema>
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const container = await db.container.findFirst({
    where: { id: containerId },
    include: { shipment: { select: { userId: true } } },
  })
  if (!container || container.shipment.userId !== session.user.id) {
    throw new Error("Container not found")
  }

  const validated = updateContainerSchema.parse(data)
  const updateData: Record<string, unknown> = {}

  if (validated.containerNumber !== undefined) updateData.containerNumber = validated.containerNumber
  if (validated.size !== undefined) updateData.size = validated.size
  if (validated.sealNumber !== undefined) updateData.sealNumber = validated.sealNumber
  if (validated.shippingLine !== undefined) updateData.shippingLine = validated.shippingLine
  if (validated.bookingReference !== undefined) updateData.bookingReference = validated.bookingReference
  if (validated.freeTimeDays !== undefined) updateData.freeTimeDays = validated.freeTimeDays
  if (validated.arrivalDate !== undefined) updateData.arrivalDate = validated.arrivalDate
  if (validated.demurrageRate !== undefined) updateData.demurrageRate = validated.demurrageRate
  if (validated.demurrageCurrency !== undefined) updateData.demurrageCurrency = validated.demurrageCurrency
  if (validated.notes !== undefined) updateData.notes = validated.notes

  const arrivalDate = validated.arrivalDate ?? container.arrivalDate
  const freeTimeDays = validated.freeTimeDays ?? container.freeTimeDays
  if (arrivalDate) {
    updateData.freeTimeExpiry = new Date(
      new Date(arrivalDate).getTime() + freeTimeDays * 24 * 60 * 60 * 1000
    )
    updateData.status = calculateContainerStatus(new Date(arrivalDate), freeTimeDays)
  }

  const updated = await db.container.update({
    where: { id: containerId },
    data: updateData,
  })

  revalidatePath(`/project`)
  return updated
}

export async function markContainerReleased(containerId: string, releaseNotes?: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const container = await db.container.findFirst({
    where: { id: containerId },
    include: { shipment: { select: { userId: true } } },
  })
  if (!container || container.shipment.userId !== session.user.id) {
    throw new Error("Container not found")
  }

  const updated = await db.container.update({
    where: { id: containerId },
    data: {
      status: "RELEASED",
      releasedAt: new Date(),
      releaseNotes,
    },
  })

  revalidatePath(`/project`)
  return updated
}

export async function deleteContainer(containerId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const container = await db.container.findFirst({
    where: { id: containerId },
    include: { shipment: { select: { userId: true } } },
  })
  if (!container || container.shipment.userId !== session.user.id) {
    throw new Error("Container not found")
  }

  await db.container.delete({ where: { id: containerId } })
  revalidatePath(`/project`)
}

export async function refreshDemurrageStatuses() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const containers = await db.container.findMany({
    where: {
      arrivalDate: { not: null },
      status: { in: ["FREE", "WARNING", "DEMURRAGE"] },
      shipment: { userId: session.user.id, status: { not: "DELIVERED" } },
    },
  })

  let updated = 0
  for (const container of containers) {
    if (!container.arrivalDate) continue
    const newStatus = calculateContainerStatus(container.arrivalDate, container.freeTimeDays)
    if (newStatus !== container.status) {
      await db.container.update({
        where: { id: container.id },
        data: { status: newStatus },
      })
      updated++
    }
  }

  revalidatePath(`/project`)
  return { checked: containers.length, updated }
}
