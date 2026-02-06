"use server"

import { db } from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// ============================================
// Types
// ============================================

export interface DemurrageCalculation {
  shipmentId: string
  shipmentNumber: string
  daysElapsed: number
  freeDays: number
  freeDaysRemaining: number
  daysOverdue: number
  dailyRate: number
  demurrageAmount: number
  isOverdue: boolean
  demurrageStartDate: Date
  currency: string
}

export interface DemurrageAlert {
  shipmentId: string
  shipmentNumber: string
  trackingNumber: string | null
  clientName: string | null
  freeDaysRemaining: number
  estimatedDailyRate: number
  demurrageStartDate: Date
  urgency: "critical" | "warning" | "approaching"
}

// ============================================
// Validation Schemas
// ============================================

const setDemurrageParamsSchema = z.object({
  freeDays: z.coerce.number().int().min(0).optional(),
  demurrageDailyRate: z.coerce.number().min(0).optional(),
  demurrageStartDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
})

// ============================================
// Helper: Convert Prisma Decimal to number
// ============================================

function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0
  if (typeof value === "number") return value
  return parseFloat(String(value))
}

// ============================================
// Server Actions
// ============================================

/**
 * Calculate current demurrage for a shipment
 *
 * - If days <= freeDays: no demurrage, returns freeDaysRemaining
 * - If days > freeDays: demurrageAmount = (days - freeDays) * dailyRate
 */
export async function calculateDemurrage(
  shipmentId: string
): Promise<DemurrageCalculation> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const shipment = await db.shipment.findFirst({
    where: {
      id: shipmentId,
      userId: session.user.id,
    },
    select: {
      id: true,
      shipmentNumber: true,
      freeDays: true,
      demurrageDailyRate: true,
      demurrageStartDate: true,
    },
  })

  if (!shipment) {
    throw new Error("Shipment not found")
  }

  if (!shipment.demurrageStartDate) {
    throw new Error(
      "Demurrage start date is not set for this shipment. Set demurrage parameters first."
    )
  }

  const freeDays = shipment.freeDays ?? 14
  const dailyRate = toNumber(shipment.demurrageDailyRate)
  const startDate = new Date(shipment.demurrageStartDate)
  const now = new Date()

  // Calculate days elapsed since demurrage start date
  const diffMs = now.getTime() - startDate.getTime()
  const daysElapsed = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))

  const freeDaysRemaining = Math.max(0, freeDays - daysElapsed)
  const daysOverdue = Math.max(0, daysElapsed - freeDays)
  const isOverdue = daysElapsed > freeDays
  const demurrageAmount = isOverdue ? daysOverdue * dailyRate : 0

  return {
    shipmentId: shipment.id,
    shipmentNumber: shipment.shipmentNumber,
    daysElapsed,
    freeDays,
    freeDaysRemaining,
    daysOverdue,
    dailyRate,
    demurrageAmount: Math.round(demurrageAmount * 100) / 100,
    isOverdue,
    demurrageStartDate: startDate,
    currency: "SDG", // Default currency
  }
}

/**
 * Get shipments approaching demurrage deadline
 * Returns shipments with <= 3 free days remaining, sorted by urgency
 */
export async function getDemurrageAlerts(): Promise<DemurrageAlert[]> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  // Find all shipments where demurrageStartDate is set AND status is not DELIVERED
  const shipments = await db.shipment.findMany({
    where: {
      userId: session.user.id,
      demurrageStartDate: { not: null },
      status: { not: "DELIVERED" },
    },
    select: {
      id: true,
      shipmentNumber: true,
      trackingNumber: true,
      freeDays: true,
      demurrageDailyRate: true,
      demurrageStartDate: true,
      client: {
        select: {
          companyName: true,
          contactName: true,
        },
      },
    },
    orderBy: { demurrageStartDate: "asc" },
  })

  const now = new Date()
  const alerts: DemurrageAlert[] = []

  for (const shipment of shipments) {
    if (!shipment.demurrageStartDate) continue

    const freeDays = shipment.freeDays ?? 14
    const startDate = new Date(shipment.demurrageStartDate)
    const diffMs = now.getTime() - startDate.getTime()
    const daysElapsed = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
    const freeDaysRemaining = freeDays - daysElapsed

    // Only include shipments with <= 3 free days remaining (or already overdue)
    if (freeDaysRemaining <= 3) {
      let urgency: "critical" | "warning" | "approaching"
      if (freeDaysRemaining <= 0) {
        urgency = "critical" // Already incurring demurrage
      } else if (freeDaysRemaining <= 1) {
        urgency = "warning" // 1 day or less
      } else {
        urgency = "approaching" // 2-3 days
      }

      alerts.push({
        shipmentId: shipment.id,
        shipmentNumber: shipment.shipmentNumber,
        trackingNumber: shipment.trackingNumber,
        clientName:
          shipment.client?.companyName ||
          shipment.client?.contactName ||
          null,
        freeDaysRemaining: Math.max(0, freeDaysRemaining),
        estimatedDailyRate: toNumber(shipment.demurrageDailyRate),
        demurrageStartDate: startDate,
        urgency,
      })
    }
  }

  // Sort by urgency: critical first, then warning, then approaching
  const urgencyOrder = { critical: 0, warning: 1, approaching: 2 }
  alerts.sort((a, b) => {
    const orderDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
    if (orderDiff !== 0) return orderDiff
    // Within same urgency, sort by fewer days remaining
    return a.freeDaysRemaining - b.freeDaysRemaining
  })

  return alerts
}

/**
 * Set demurrage parameters for a shipment
 */
export async function setDemurrageParams(
  shipmentId: string,
  data: z.input<typeof setDemurrageParamsSchema>
) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const validated = setDemurrageParamsSchema.parse(data)

  // Verify shipment exists and user has access
  const shipment = await db.shipment.findFirst({
    where: {
      id: shipmentId,
      userId: session.user.id,
    },
  })

  if (!shipment) {
    throw new Error("Shipment not found or access denied")
  }

  const updateData: Record<string, unknown> = {}

  if (validated.freeDays !== undefined) {
    updateData.freeDays = validated.freeDays
  }

  if (validated.demurrageDailyRate !== undefined) {
    updateData.demurrageDailyRate = validated.demurrageDailyRate
  }

  if (validated.demurrageStartDate !== undefined) {
    updateData.demurrageStartDate = validated.demurrageStartDate
  }

  const updated = await db.shipment.update({
    where: { id: shipmentId },
    data: updateData,
    select: {
      id: true,
      shipmentNumber: true,
      freeDays: true,
      demurrageDailyRate: true,
      demurrageStartDate: true,
    },
  })

  revalidatePath("/shipments")
  revalidatePath(`/shipments/${shipmentId}`)
  revalidatePath("/dashboard")

  return updated
}
