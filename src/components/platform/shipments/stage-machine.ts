import type { TrackingStageType } from "@prisma/client"

/**
 * Canonical order of the 11 clearance stages. Stages must be completed roughly
 * in order; skipping is allowed per-stage (e.g. IN_TRANSIT for port pickups),
 * but you cannot *complete* stage N+1 before stage N is COMPLETED or SKIPPED.
 */
export const STAGE_SEQUENCE: TrackingStageType[] = [
  "PRE_ARRIVAL_DOCS",
  "VESSEL_ARRIVAL",
  "CUSTOMS_DECLARATION",
  "CUSTOMS_PAYMENT",
  "INSPECTION",
  "PORT_FEES",
  "QUALITY_STANDARDS",
  "RELEASE",
  "LOADING",
  "IN_TRANSIT",
  "DELIVERED",
]

export function stageIndex(stage: TrackingStageType): number {
  return STAGE_SEQUENCE.indexOf(stage)
}

/**
 * Predecessor stages that must be COMPLETED or SKIPPED before `stage` can
 * transition to COMPLETED. Returns the list of prerequisites.
 */
export function prerequisites(stage: TrackingStageType): TrackingStageType[] {
  const idx = stageIndex(stage)
  if (idx <= 0) return []
  return STAGE_SEQUENCE.slice(0, idx)
}
