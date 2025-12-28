"use server"

import { db } from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { TrackingStageType, TrackingStageStatus } from "@prisma/client"
import {
  STAGE_ORDER,
  generateTrackingNumber,
  calculateInitialETAs,
  recalculateRemainingETAs,
  toPublicTrackingData,
} from "@/lib/tracking"

// ============================================
// Public Actions (no auth required)
// ============================================

/**
 * Get public tracking data by tracking number or slug (no auth required)
 * Returns sanitized data safe for public display
 */
export async function getPublicTracking(identifier: string) {
  // Try to find by tracking number first (TRK-XXXXXX format)
  let shipment = await db.shipment.findUnique({
    where: { trackingNumber: identifier },
    include: {
      trackingStages: {
        orderBy: { createdAt: "asc" },
      },
    },
  })

  // If not found, try by tracking slug (URL-safe short code)
  if (!shipment) {
    shipment = await db.shipment.findFirst({
      where: { trackingSlug: identifier },
      include: {
        trackingStages: {
          orderBy: { createdAt: "asc" },
        },
      },
    })
  }

  if (!shipment) {
    return null
  }

  return toPublicTrackingData(shipment)
}

/**
 * Get public tracking link for a shipment
 */
export async function getPublicTrackingLink(
  trackingNumber: string,
  locale: string = "ar"
): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mazin.sd"
  return `${baseUrl}/${locale}/track/${trackingNumber}`
}

// ============================================
// Protected Actions (auth required)
// ============================================

/**
 * Get full shipment tracking data for admin view
 */
export async function getShipmentTracking(shipmentId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  return db.shipment.findFirst({
    where: {
      id: shipmentId,
      userId: session.user.id,
    },
    include: {
      trackingStages: {
        orderBy: { createdAt: "asc" },
      },
    },
  })
}

/**
 * Initialize all tracking stages for a shipment
 * Call this when a shipment is created
 */
export async function initializeTrackingStages(shipmentId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  // Get shipment to calculate ETAs
  const shipment = await db.shipment.findFirst({
    where: { id: shipmentId, userId: session.user.id },
  })

  if (!shipment) {
    throw new Error("Shipment not found")
  }

  // Calculate initial ETAs if arrival date is set
  const etas = shipment.arrivalDate
    ? calculateInitialETAs(shipment.arrivalDate)
    : new Map<TrackingStageType, Date>()

  // Generate tracking number if not exists
  let trackingNumber = shipment.trackingNumber
  if (!trackingNumber) {
    trackingNumber = generateTrackingNumber()
    await db.shipment.update({
      where: { id: shipmentId },
      data: { trackingNumber },
    })
  }

  // Create all stages
  const stages = await db.trackingStage.createMany({
    data: STAGE_ORDER.map((stageType, index) => ({
      shipmentId,
      stageType,
      status: index === 0 ? "IN_PROGRESS" : "PENDING", // First stage starts in progress
      startedAt: index === 0 ? new Date() : null,
      estimatedAt: etas.get(stageType) || null,
    })),
    skipDuplicates: true,
  })

  revalidatePath(`/shipments/${shipmentId}`)
  revalidatePath(`/track/${trackingNumber}`)

  return { trackingNumber, stagesCreated: stages.count }
}

/**
 * Generate a unique tracking number for a shipment
 */
export async function assignTrackingNumber(shipmentId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const shipment = await db.shipment.findFirst({
    where: { id: shipmentId, userId: session.user.id },
  })

  if (!shipment) {
    throw new Error("Shipment not found")
  }

  if (shipment.trackingNumber) {
    return shipment.trackingNumber
  }

  // Generate unique tracking number
  let trackingNumber: string
  let isUnique = false

  do {
    trackingNumber = generateTrackingNumber()
    const existing = await db.shipment.findUnique({
      where: { trackingNumber },
    })
    isUnique = !existing
  } while (!isUnique)

  await db.shipment.update({
    where: { id: shipmentId },
    data: { trackingNumber },
  })

  revalidatePath(`/shipments/${shipmentId}`)
  return trackingNumber
}

const updateStageSchema = z.object({
  shipmentId: z.string(),
  stageType: z.enum(STAGE_ORDER as [string, ...string[]]),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "SKIPPED"]),
  notes: z.string().optional(),
  estimatedAt: z.date().optional(),
})

/**
 * Update a specific tracking stage
 */
export async function updateTrackingStage(
  data: z.input<typeof updateStageSchema>
) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const validated = updateStageSchema.parse(data)

  // Verify ownership
  const shipment = await db.shipment.findFirst({
    where: { id: validated.shipmentId, userId: session.user.id },
    include: { trackingStages: true },
  })

  if (!shipment) {
    throw new Error("Shipment not found")
  }

  const now = new Date()
  const updateData: Record<string, unknown> = {
    status: validated.status as TrackingStageStatus,
    updatedById: session.user.id,
  }

  // Set timestamps based on status
  if (validated.status === "IN_PROGRESS") {
    updateData.startedAt = now
  } else if (validated.status === "COMPLETED") {
    updateData.completedAt = now
  }

  if (validated.notes !== undefined) {
    updateData.notes = validated.notes
  }

  if (validated.estimatedAt) {
    updateData.estimatedAt = validated.estimatedAt
  }

  const stage = await db.trackingStage.update({
    where: {
      shipmentId_stageType: {
        shipmentId: validated.shipmentId,
        stageType: validated.stageType as TrackingStageType,
      },
    },
    data: updateData,
  })

  // If stage completed, recalculate remaining ETAs
  if (validated.status === "COMPLETED") {
    const newEtas = recalculateRemainingETAs(
      shipment.trackingStages,
      validated.stageType as TrackingStageType
    )

    // Update ETAs for remaining stages
    for (const [stageType, eta] of newEtas) {
      await db.trackingStage.update({
        where: {
          shipmentId_stageType: {
            shipmentId: validated.shipmentId,
            stageType,
          },
        },
        data: { estimatedAt: eta },
      })
    }
  }

  revalidatePath(`/shipments/${validated.shipmentId}`)
  if (shipment.trackingNumber) {
    revalidatePath(`/track/${shipment.trackingNumber}`)
  }

  return stage
}

/**
 * Advance to the next stage (completes current, starts next)
 */
export async function advanceToNextStage(shipmentId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  // Get shipment with stages
  const shipment = await db.shipment.findFirst({
    where: { id: shipmentId, userId: session.user.id },
    include: {
      trackingStages: {
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!shipment) {
    throw new Error("Shipment not found")
  }

  // Find current in-progress stage
  const currentStage = shipment.trackingStages.find(
    (s) => s.status === "IN_PROGRESS"
  )

  if (!currentStage) {
    throw new Error("No stage in progress")
  }

  const currentIndex = STAGE_ORDER.indexOf(currentStage.stageType)
  const nextStageType = STAGE_ORDER[currentIndex + 1]

  const now = new Date()

  // Complete current stage
  await db.trackingStage.update({
    where: {
      shipmentId_stageType: {
        shipmentId,
        stageType: currentStage.stageType,
      },
    },
    data: {
      status: "COMPLETED",
      completedAt: now,
      updatedById: session.user.id,
    },
  })

  // Start next stage if exists
  if (nextStageType) {
    await db.trackingStage.update({
      where: {
        shipmentId_stageType: {
          shipmentId,
          stageType: nextStageType,
        },
      },
      data: {
        status: "IN_PROGRESS",
        startedAt: now,
        updatedById: session.user.id,
      },
    })
  }

  // Update shipment status based on current stage
  let shipmentStatus: "PENDING" | "IN_TRANSIT" | "ARRIVED" | "CLEARED" | "DELIVERED" = "PENDING"
  if (currentStage.stageType === "DELIVERED" || !nextStageType) {
    shipmentStatus = "DELIVERED"
  } else if (nextStageType === "IN_TRANSIT" || nextStageType === "LOADING") {
    shipmentStatus = "CLEARED"
  } else if (
    ["CUSTOMS_DECLARATION", "CUSTOMS_PAYMENT", "INSPECTION", "PORT_FEES", "QUALITY_STANDARDS", "RELEASE"].includes(nextStageType)
  ) {
    shipmentStatus = "ARRIVED"
  } else if (nextStageType === "VESSEL_ARRIVAL") {
    shipmentStatus = "IN_TRANSIT"
  }

  await db.shipment.update({
    where: { id: shipmentId },
    data: { status: shipmentStatus },
  })

  // Recalculate ETAs
  const newEtas = recalculateRemainingETAs(
    shipment.trackingStages,
    currentStage.stageType
  )

  for (const [stageType, eta] of newEtas) {
    await db.trackingStage.update({
      where: {
        shipmentId_stageType: {
          shipmentId,
          stageType,
        },
      },
      data: { estimatedAt: eta },
    })
  }

  revalidatePath(`/shipments/${shipmentId}`)
  if (shipment.trackingNumber) {
    revalidatePath(`/track/${shipment.trackingNumber}`)
  }

  return { completedStage: currentStage.stageType, nextStage: nextStageType }
}

/**
 * Skip a stage (mark as SKIPPED and move to next)
 */
export async function skipStage(shipmentId: string, stageType: TrackingStageType) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const shipment = await db.shipment.findFirst({
    where: { id: shipmentId, userId: session.user.id },
  })

  if (!shipment) {
    throw new Error("Shipment not found")
  }

  await db.trackingStage.update({
    where: {
      shipmentId_stageType: {
        shipmentId,
        stageType,
      },
    },
    data: {
      status: "SKIPPED",
      updatedById: session.user.id,
    },
  })

  revalidatePath(`/shipments/${shipmentId}`)
  if (shipment.trackingNumber) {
    revalidatePath(`/track/${shipment.trackingNumber}`)
  }
}
