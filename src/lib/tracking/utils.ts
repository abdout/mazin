import type { TrackingStage, TrackingStageType, TrackingStageStatus } from "@prisma/client"
import { STAGE_ORDER, STAGE_CONFIG } from "./constants"
import type { PublicTrackingData, PublicStageData, ShipmentWithTracking } from "./types"

/**
 * Generates a unique tracking number in format TRK-XXXXXX
 */
export function generateTrackingNumber(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = "TRK-"
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Calculates initial ETAs for all stages based on arrival date
 */
export function calculateInitialETAs(arrivalDate: Date): Map<TrackingStageType, Date> {
  const etas = new Map<TrackingStageType, Date>()
  let currentDate = new Date(arrivalDate)

  for (const stageType of STAGE_ORDER) {
    const config = STAGE_CONFIG[stageType]

    if (stageType === "VESSEL_ARRIVAL") {
      // Vessel arrival is the arrival date itself
      etas.set(stageType, new Date(arrivalDate))
    } else if (stageType === "PRE_ARRIVAL_DOCS") {
      // Pre-arrival docs should be done before vessel arrives
      const preArrival = new Date(arrivalDate)
      preArrival.setHours(preArrival.getHours() - 24)
      etas.set(stageType, preArrival)
    } else {
      // Add estimated hours to current date
      currentDate = new Date(currentDate.getTime() + config.estimatedHours * 60 * 60 * 1000)
      etas.set(stageType, new Date(currentDate))
    }
  }

  return etas
}

/**
 * Recalculates ETAs for remaining stages after a stage is completed
 */
export function recalculateRemainingETAs(
  stages: TrackingStage[],
  completedStageType: TrackingStageType
): Map<TrackingStageType, Date> {
  const etas = new Map<TrackingStageType, Date>()
  const completedStage = stages.find((s) => s.stageType === completedStageType)

  if (!completedStage?.completedAt) {
    return etas
  }

  let currentDate = new Date(completedStage.completedAt)
  const completedOrder = STAGE_CONFIG[completedStageType].order

  for (const stageType of STAGE_ORDER) {
    const config = STAGE_CONFIG[stageType]

    // Only recalculate stages after the completed one
    if (config.order > completedOrder) {
      currentDate = new Date(currentDate.getTime() + config.estimatedHours * 60 * 60 * 1000)
      etas.set(stageType, new Date(currentDate))
    }
  }

  return etas
}

/**
 * Gets the current active stage from a list of tracking stages
 */
export function getCurrentStage(stages: TrackingStage[]): TrackingStageType {
  // Find the stage that is IN_PROGRESS
  const inProgress = stages.find((s) => s.status === "IN_PROGRESS")
  if (inProgress) {
    return inProgress.stageType
  }

  // If no stage is in progress, find the first pending stage
  const sortedStages = [...stages].sort(
    (a, b) => STAGE_CONFIG[a.stageType].order - STAGE_CONFIG[b.stageType].order
  )

  const firstPending = sortedStages.find((s) => s.status === "PENDING")
  if (firstPending) {
    return firstPending.stageType
  }

  // All stages completed, return last stage
  return "DELIVERED"
}

/**
 * Gets the next stage after the current one
 */
export function getNextStage(currentStage: TrackingStageType): TrackingStageType | null {
  const currentIndex = STAGE_ORDER.indexOf(currentStage)
  if (currentIndex === -1 || currentIndex >= STAGE_ORDER.length - 1) {
    return null
  }
  return STAGE_ORDER[currentIndex + 1] ?? null
}

/**
 * Calculates progress through the tracking stages
 */
export function getProgress(stages: TrackingStage[]): {
  completed: number
  total: number
  percentage: number
} {
  const completed = stages.filter(
    (s) => s.status === "COMPLETED" || s.status === "SKIPPED"
  ).length
  const total = stages.length

  return {
    completed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  }
}

/**
 * Gets the estimated delivery date from the DELIVERED stage
 */
export function getEstimatedDelivery(stages: TrackingStage[]): Date | null {
  const deliveredStage = stages.find((s) => s.stageType === "DELIVERED")

  if (!deliveredStage) return null

  // If completed, return completion date
  if (deliveredStage.completedAt) {
    return deliveredStage.completedAt
  }

  // Otherwise return ETA
  return deliveredStage.estimatedAt
}

/**
 * Transforms shipment data to public tracking format (sanitized)
 */
export function toPublicTrackingData(shipment: ShipmentWithTracking): PublicTrackingData {
  const stages: PublicStageData[] = shipment.trackingStages
    .sort((a, b) => STAGE_CONFIG[a.stageType].order - STAGE_CONFIG[b.stageType].order)
    .map((stage) => ({
      stageType: stage.stageType,
      status: stage.status,
      startedAt: stage.startedAt,
      completedAt: stage.completedAt,
      estimatedAt: stage.estimatedAt,
    }))

  // Extract only first name from consignee for privacy
  const consigneeFirstName = shipment.consignee.split(" ")[0] ?? ""

  return {
    trackingNumber: shipment.trackingNumber || "",
    vesselName: shipment.vesselName,
    containerNumber: shipment.containerNumber,
    consigneeFirstName,
    shipmentType: shipment.type,
    currentStage: getCurrentStage(shipment.trackingStages),
    stages,
    estimatedDelivery: getEstimatedDelivery(shipment.trackingStages),
    progress: getProgress(shipment.trackingStages),
  }
}

/**
 * Formats a date for display based on locale
 */
export function formatTrackingDate(date: Date | null, locale: string): string {
  if (!date) return "-"

  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SD" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date))
}

/**
 * Gets relative time string (e.g., "2 hours ago", "in 3 days")
 */
export function getRelativeTime(date: Date | null, locale: string): string {
  if (!date) return "-"

  const rtf = new Intl.RelativeTimeFormat(locale === "ar" ? "ar" : "en", {
    numeric: "auto",
  })

  const now = new Date()
  const diff = new Date(date).getTime() - now.getTime()
  const diffHours = Math.round(diff / (1000 * 60 * 60))
  const diffDays = Math.round(diff / (1000 * 60 * 60 * 24))

  if (Math.abs(diffHours) < 24) {
    return rtf.format(diffHours, "hour")
  }
  return rtf.format(diffDays, "day")
}
