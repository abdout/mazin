import { describe, it, expect } from "vitest"
import {
  generateTrackingNumber,
  calculateInitialETAs,
  recalculateRemainingETAs,
  getCurrentStage,
  getNextStage,
  getProgress,
  getEstimatedDelivery,
} from "@/lib/tracking/utils"
import {
  STAGE_ORDER,
  STAGE_CONFIG,
  PAYABLE_STAGES,
  isPayableStage,
} from "@/lib/tracking/constants"
import type { TrackingStage, TrackingStageType, TrackingStageStatus } from "@prisma/client"

// ---------------------------------------------------------------------------
// Helper: build a minimal TrackingStage for testing
// ---------------------------------------------------------------------------

function makeStage(
  stageType: TrackingStageType,
  status: TrackingStageStatus,
  overrides: Partial<TrackingStage> = {}
): TrackingStage {
  return {
    id: `stage-${stageType}`,
    shipmentId: "ship-1",
    stageType,
    status,
    notes: null,
    startedAt: null,
    completedAt: null,
    estimatedAt: null,
    paymentReceived: false,
    paymentRequested: false,
    updatedById: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

// =============================================================================
// generateTrackingNumber
// =============================================================================

describe("generateTrackingNumber", () => {
  it("starts with TRK- prefix", () => {
    const num = generateTrackingNumber()
    expect(num).toMatch(/^TRK-/)
  })

  it("has exactly 6 alphanumeric chars after the prefix", () => {
    const num = generateTrackingNumber()
    expect(num).toMatch(/^TRK-[A-Z0-9]{6}$/)
  })

  it("generates unique numbers across calls", () => {
    const nums = new Set(Array.from({ length: 50 }, () => generateTrackingNumber()))
    // Very high probability of uniqueness with 36^6 possibilities
    expect(nums.size).toBeGreaterThan(45)
  })
})

// =============================================================================
// calculateInitialETAs
// =============================================================================

describe("calculateInitialETAs", () => {
  const arrivalDate = new Date("2025-06-15T08:00:00Z")

  it("returns a Map with 11 stage entries", () => {
    const etas = calculateInitialETAs(arrivalDate)
    expect(etas.size).toBe(11)
  })

  it("contains all stages from STAGE_ORDER", () => {
    const etas = calculateInitialETAs(arrivalDate)
    for (const stage of STAGE_ORDER) {
      expect(etas.has(stage)).toBe(true)
    }
  })

  it("sets VESSEL_ARRIVAL to exactly the arrival date", () => {
    const etas = calculateInitialETAs(arrivalDate)
    expect(etas.get("VESSEL_ARRIVAL")!.getTime()).toBe(arrivalDate.getTime())
  })

  it("sets PRE_ARRIVAL_DOCS to 24 hours before arrival", () => {
    const etas = calculateInitialETAs(arrivalDate)
    const preArrival = etas.get("PRE_ARRIVAL_DOCS")!
    const expected = new Date(arrivalDate)
    expected.setHours(expected.getHours() - 24)
    expect(preArrival.getTime()).toBe(expected.getTime())
  })

  it("calculates sequential stages after VESSEL_ARRIVAL based on estimatedHours", () => {
    const etas = calculateInitialETAs(arrivalDate)
    // After VESSEL_ARRIVAL (order 2), CUSTOMS_DECLARATION (order 3) adds 24h
    const vesselTime = etas.get("VESSEL_ARRIVAL")!.getTime()
    const customsDecl = etas.get("CUSTOMS_DECLARATION")!
    const expectedTime = vesselTime + STAGE_CONFIG.CUSTOMS_DECLARATION.estimatedHours * 3600000
    expect(customsDecl.getTime()).toBe(expectedTime)
  })

  it("returns Date objects for all entries", () => {
    const etas = calculateInitialETAs(arrivalDate)
    for (const [, date] of etas) {
      expect(date).toBeInstanceOf(Date)
    }
  })
})

// =============================================================================
// recalculateRemainingETAs
// =============================================================================

describe("recalculateRemainingETAs", () => {
  it("returns empty map when completed stage has no completedAt", () => {
    const stages: TrackingStage[] = [
      makeStage("CUSTOMS_DECLARATION", "IN_PROGRESS"),
    ]
    const result = recalculateRemainingETAs(stages, "CUSTOMS_DECLARATION")
    expect(result.size).toBe(0)
  })

  it("only recalculates stages after the completed one", () => {
    const completedAt = new Date("2025-06-16T12:00:00Z")
    const stages: TrackingStage[] = STAGE_ORDER.map((st) =>
      makeStage(st, st === "CUSTOMS_DECLARATION" ? "COMPLETED" : "PENDING", {
        completedAt: st === "CUSTOMS_DECLARATION" ? completedAt : null,
      })
    )

    const etas = recalculateRemainingETAs(stages, "CUSTOMS_DECLARATION")

    // Stages before or equal to CUSTOMS_DECLARATION (order 3) should not be recalculated
    expect(etas.has("PRE_ARRIVAL_DOCS")).toBe(false)
    expect(etas.has("VESSEL_ARRIVAL")).toBe(false)
    expect(etas.has("CUSTOMS_DECLARATION")).toBe(false)

    // Stages after should be recalculated
    expect(etas.has("CUSTOMS_PAYMENT")).toBe(true)
    expect(etas.has("INSPECTION")).toBe(true)
    expect(etas.has("DELIVERED")).toBe(true)
  })

  it("bases recalculated ETAs on the completed stage's completedAt", () => {
    const completedAt = new Date("2025-06-16T12:00:00Z")
    const stages: TrackingStage[] = STAGE_ORDER.map((st) =>
      makeStage(st, st === "CUSTOMS_DECLARATION" ? "COMPLETED" : "PENDING", {
        completedAt: st === "CUSTOMS_DECLARATION" ? completedAt : null,
      })
    )

    const etas = recalculateRemainingETAs(stages, "CUSTOMS_DECLARATION")
    const customsPaymentEta = etas.get("CUSTOMS_PAYMENT")!
    const expectedMs = completedAt.getTime() + STAGE_CONFIG.CUSTOMS_PAYMENT.estimatedHours * 3600000
    expect(customsPaymentEta.getTime()).toBe(expectedMs)
  })
})

// =============================================================================
// getCurrentStage
// =============================================================================

describe("getCurrentStage", () => {
  it("returns the IN_PROGRESS stage when one exists", () => {
    const stages: TrackingStage[] = [
      makeStage("PRE_ARRIVAL_DOCS", "COMPLETED"),
      makeStage("VESSEL_ARRIVAL", "IN_PROGRESS"),
      makeStage("CUSTOMS_DECLARATION", "PENDING"),
    ]
    expect(getCurrentStage(stages)).toBe("VESSEL_ARRIVAL")
  })

  it("returns the first PENDING stage when none is IN_PROGRESS", () => {
    const stages: TrackingStage[] = [
      makeStage("PRE_ARRIVAL_DOCS", "COMPLETED"),
      makeStage("CUSTOMS_DECLARATION", "PENDING"),
      makeStage("VESSEL_ARRIVAL", "PENDING"),
    ]
    // Sorted by order: VESSEL_ARRIVAL (order 2) comes before CUSTOMS_DECLARATION (order 3)
    expect(getCurrentStage(stages)).toBe("VESSEL_ARRIVAL")
  })

  it("returns DELIVERED when all stages are COMPLETED", () => {
    const stages: TrackingStage[] = STAGE_ORDER.map((st) =>
      makeStage(st, "COMPLETED")
    )
    expect(getCurrentStage(stages)).toBe("DELIVERED")
  })

  it("treats SKIPPED as non-pending, non-in-progress", () => {
    const stages: TrackingStage[] = [
      makeStage("PRE_ARRIVAL_DOCS", "SKIPPED"),
      makeStage("VESSEL_ARRIVAL", "SKIPPED"),
      makeStage("CUSTOMS_DECLARATION", "PENDING"),
    ]
    expect(getCurrentStage(stages)).toBe("CUSTOMS_DECLARATION")
  })
})

// =============================================================================
// getNextStage
// =============================================================================

describe("getNextStage", () => {
  it("returns the next stage in order", () => {
    expect(getNextStage("PRE_ARRIVAL_DOCS")).toBe("VESSEL_ARRIVAL")
    expect(getNextStage("VESSEL_ARRIVAL")).toBe("CUSTOMS_DECLARATION")
    expect(getNextStage("IN_TRANSIT")).toBe("DELIVERED")
  })

  it("returns null for the last stage (DELIVERED)", () => {
    expect(getNextStage("DELIVERED")).toBeNull()
  })
})

// =============================================================================
// getProgress
// =============================================================================

describe("getProgress", () => {
  it("returns 0% for all-PENDING stages", () => {
    const stages: TrackingStage[] = STAGE_ORDER.map((st) =>
      makeStage(st, "PENDING")
    )
    const progress = getProgress(stages)
    expect(progress.completed).toBe(0)
    expect(progress.total).toBe(11)
    expect(progress.percentage).toBe(0)
  })

  it("counts COMPLETED stages", () => {
    const stages: TrackingStage[] = [
      makeStage("PRE_ARRIVAL_DOCS", "COMPLETED"),
      makeStage("VESSEL_ARRIVAL", "COMPLETED"),
      makeStage("CUSTOMS_DECLARATION", "PENDING"),
    ]
    const progress = getProgress(stages)
    expect(progress.completed).toBe(2)
    expect(progress.total).toBe(3)
    expect(progress.percentage).toBe(67)
  })

  it("counts SKIPPED stages as completed", () => {
    const stages: TrackingStage[] = [
      makeStage("PRE_ARRIVAL_DOCS", "COMPLETED"),
      makeStage("VESSEL_ARRIVAL", "SKIPPED"),
      makeStage("CUSTOMS_DECLARATION", "PENDING"),
      makeStage("CUSTOMS_PAYMENT", "PENDING"),
    ]
    const progress = getProgress(stages)
    expect(progress.completed).toBe(2)
    expect(progress.total).toBe(4)
    expect(progress.percentage).toBe(50)
  })

  it("returns 100% when all stages are completed", () => {
    const stages: TrackingStage[] = STAGE_ORDER.map((st) =>
      makeStage(st, "COMPLETED")
    )
    const progress = getProgress(stages)
    expect(progress.percentage).toBe(100)
  })

  it("returns 0% for empty array", () => {
    const progress = getProgress([])
    expect(progress.completed).toBe(0)
    expect(progress.total).toBe(0)
    expect(progress.percentage).toBe(0)
  })
})

// =============================================================================
// getEstimatedDelivery
// =============================================================================

describe("getEstimatedDelivery", () => {
  it("returns completedAt when DELIVERED stage is completed", () => {
    const completedAt = new Date("2025-07-01T10:00:00Z")
    const stages: TrackingStage[] = [
      makeStage("DELIVERED", "COMPLETED", { completedAt }),
    ]
    expect(getEstimatedDelivery(stages)).toEqual(completedAt)
  })

  it("returns estimatedAt when DELIVERED stage is not completed", () => {
    const estimatedAt = new Date("2025-07-10T10:00:00Z")
    const stages: TrackingStage[] = [
      makeStage("DELIVERED", "PENDING", { estimatedAt }),
    ]
    expect(getEstimatedDelivery(stages)).toEqual(estimatedAt)
  })

  it("returns null when there is no DELIVERED stage", () => {
    const stages: TrackingStage[] = [
      makeStage("PRE_ARRIVAL_DOCS", "COMPLETED"),
    ]
    expect(getEstimatedDelivery(stages)).toBeNull()
  })

  it("prefers completedAt over estimatedAt when both exist", () => {
    const completedAt = new Date("2025-07-01T10:00:00Z")
    const estimatedAt = new Date("2025-07-10T10:00:00Z")
    const stages: TrackingStage[] = [
      makeStage("DELIVERED", "COMPLETED", { completedAt, estimatedAt }),
    ]
    expect(getEstimatedDelivery(stages)).toEqual(completedAt)
  })
})

// =============================================================================
// STAGE_ORDER constant
// =============================================================================

describe("STAGE_ORDER", () => {
  it("contains all 11 stage types", () => {
    expect(STAGE_ORDER).toHaveLength(11)
  })

  it("starts with PRE_ARRIVAL_DOCS and ends with DELIVERED", () => {
    expect(STAGE_ORDER[0]).toBe("PRE_ARRIVAL_DOCS")
    expect(STAGE_ORDER[STAGE_ORDER.length - 1]).toBe("DELIVERED")
  })

  const expectedOrder: TrackingStageType[] = [
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

  it("is in the correct order", () => {
    expect(STAGE_ORDER).toEqual(expectedOrder)
  })
})

// =============================================================================
// STAGE_CONFIG constant
// =============================================================================

describe("STAGE_CONFIG", () => {
  it("has an entry for every stage in STAGE_ORDER", () => {
    for (const stage of STAGE_ORDER) {
      expect(STAGE_CONFIG[stage]).toBeDefined()
    }
  })

  it("each entry has order, estimatedHours, and color", () => {
    for (const stage of STAGE_ORDER) {
      const config = STAGE_CONFIG[stage]
      expect(typeof config.order).toBe("number")
      expect(typeof config.estimatedHours).toBe("number")
      expect(typeof config.color).toBe("string")
    }
  })

  it("orders are sequential 1-11", () => {
    const orders = STAGE_ORDER.map((s) => STAGE_CONFIG[s].order)
    expect(orders).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
  })
})

// =============================================================================
// isPayableStage
// =============================================================================

describe("isPayableStage", () => {
  const expectedPayable: TrackingStageType[] = [
    "PRE_ARRIVAL_DOCS",
    "CUSTOMS_DECLARATION",
    "CUSTOMS_PAYMENT",
    "INSPECTION",
    "PORT_FEES",
    "RELEASE",
  ]

  it("returns true for each payable stage", () => {
    for (const stage of expectedPayable) {
      expect(isPayableStage(stage)).toBe(true)
    }
  })

  it("returns false for non-payable stages", () => {
    const nonPayable: TrackingStageType[] = [
      "VESSEL_ARRIVAL",
      "QUALITY_STANDARDS",
      "LOADING",
      "IN_TRANSIT",
      "DELIVERED",
    ]
    for (const stage of nonPayable) {
      expect(isPayableStage(stage)).toBe(false)
    }
  })

  it("PAYABLE_STAGES contains exactly 6 entries", () => {
    expect(PAYABLE_STAGES).toHaveLength(6)
  })
})
