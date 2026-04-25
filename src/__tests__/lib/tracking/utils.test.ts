import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  generateTrackingNumber,
  calculateInitialETAs,
  recalculateRemainingETAs,
  getCurrentStage,
  getNextStage,
  getProgress,
  getEstimatedDelivery,
  toPublicTrackingData,
  formatTrackingDate,
  getRelativeTime,
} from "@/lib/tracking/utils"
import { STAGE_ORDER } from "@/lib/tracking/constants"
import { makeTrackingStage, makeShipment } from "@/__tests__/helpers/factories"

describe("tracking/utils", () => {
  describe("generateTrackingNumber", () => {
    it("returns a string with TRK- prefix and 6 chars", () => {
      const n = generateTrackingNumber()
      expect(n).toMatch(/^TRK-[A-Z0-9]{6}$/)
    })

    it("produces unique-ish values across calls", () => {
      const values = new Set(Array.from({ length: 50 }, () => generateTrackingNumber()))
      expect(values.size).toBeGreaterThan(40) // allow a few duplicates in randomness
    })
  })

  describe("calculateInitialETAs", () => {
    it("covers every stage in STAGE_ORDER", () => {
      const etas = calculateInitialETAs(new Date("2026-05-01T00:00:00Z"))
      for (const stage of STAGE_ORDER) {
        expect(etas.has(stage)).toBe(true)
      }
    })

    it("puts PRE_ARRIVAL_DOCS 24h before arrival", () => {
      const arrival = new Date("2026-05-01T12:00:00Z")
      const etas = calculateInitialETAs(arrival)
      const pre = etas.get("PRE_ARRIVAL_DOCS")!
      expect(arrival.getTime() - pre.getTime()).toBe(24 * 60 * 60 * 1000)
    })

    it("VESSEL_ARRIVAL equals arrivalDate", () => {
      const arrival = new Date("2026-05-01T12:00:00Z")
      const etas = calculateInitialETAs(arrival)
      expect(etas.get("VESSEL_ARRIVAL")!.getTime()).toBe(arrival.getTime())
    })
  })

  describe("recalculateRemainingETAs", () => {
    it("returns empty map if completed stage has no completedAt", () => {
      const stages = [
        makeTrackingStage({ stageType: "CUSTOMS_DECLARATION", completedAt: null }),
      ]
      const res = recalculateRemainingETAs(stages as any, "CUSTOMS_DECLARATION")
      expect(res.size).toBe(0)
    })

    it("only recalculates stages after the completed one", () => {
      const completedAt = new Date("2026-05-05T00:00:00Z")
      const stages = [
        makeTrackingStage({ stageType: "CUSTOMS_PAYMENT", status: "COMPLETED", completedAt }),
      ]
      const res = recalculateRemainingETAs(stages as any, "CUSTOMS_PAYMENT")
      // CUSTOMS_PAYMENT has order 4, so stages 5-11 should be recalculated
      expect(res.has("INSPECTION")).toBe(true)
      expect(res.has("DELIVERED")).toBe(true)
      expect(res.has("CUSTOMS_PAYMENT")).toBe(false)
      expect(res.has("PRE_ARRIVAL_DOCS")).toBe(false)
    })
  })

  describe("getCurrentStage", () => {
    it("returns IN_PROGRESS stage if one exists", () => {
      const stages = [
        makeTrackingStage({ stageType: "PRE_ARRIVAL_DOCS", status: "COMPLETED" }),
        makeTrackingStage({ stageType: "INSPECTION", status: "IN_PROGRESS" }),
        makeTrackingStage({ stageType: "RELEASE", status: "PENDING" }),
      ]
      expect(getCurrentStage(stages as any)).toBe("INSPECTION")
    })

    it("returns first PENDING stage when no IN_PROGRESS", () => {
      const stages = [
        makeTrackingStage({ stageType: "PRE_ARRIVAL_DOCS", status: "COMPLETED" }),
        makeTrackingStage({ stageType: "VESSEL_ARRIVAL", status: "COMPLETED" }),
        makeTrackingStage({ stageType: "CUSTOMS_DECLARATION", status: "PENDING" }),
        makeTrackingStage({ stageType: "RELEASE", status: "PENDING" }),
      ]
      expect(getCurrentStage(stages as any)).toBe("CUSTOMS_DECLARATION")
    })

    it("returns DELIVERED when all stages are complete", () => {
      const stages = STAGE_ORDER.map((stageType) =>
        makeTrackingStage({ stageType, status: "COMPLETED" })
      )
      expect(getCurrentStage(stages as any)).toBe("DELIVERED")
    })
  })

  describe("getNextStage", () => {
    it("returns next stage in order", () => {
      expect(getNextStage("PRE_ARRIVAL_DOCS")).toBe("VESSEL_ARRIVAL")
      expect(getNextStage("CUSTOMS_PAYMENT")).toBe("INSPECTION")
    })

    it("returns null when at DELIVERED", () => {
      expect(getNextStage("DELIVERED")).toBeNull()
    })

    it("returns null for unknown stage", () => {
      expect(getNextStage("NOT_A_STAGE" as any)).toBeNull()
    })
  })

  describe("getProgress", () => {
    it("counts COMPLETED and SKIPPED as done", () => {
      const stages = [
        makeTrackingStage({ status: "COMPLETED" }),
        makeTrackingStage({ status: "SKIPPED" }),
        makeTrackingStage({ status: "PENDING" }),
        makeTrackingStage({ status: "IN_PROGRESS" }),
      ]
      expect(getProgress(stages as any)).toEqual({ completed: 2, total: 4, percentage: 50 })
    })

    it("returns 0% when empty", () => {
      expect(getProgress([])).toEqual({ completed: 0, total: 0, percentage: 0 })
    })
  })

  describe("getEstimatedDelivery", () => {
    it("returns completedAt when DELIVERED is complete", () => {
      const completedAt = new Date("2026-05-10T00:00:00Z")
      const stages = [makeTrackingStage({ stageType: "DELIVERED", completedAt })]
      expect(getEstimatedDelivery(stages as any)).toEqual(completedAt)
    })

    it("falls back to estimatedAt when not delivered", () => {
      const eta = new Date("2026-06-01T00:00:00Z")
      const stages = [makeTrackingStage({ stageType: "DELIVERED", completedAt: null, estimatedAt: eta })]
      expect(getEstimatedDelivery(stages as any)).toEqual(eta)
    })

    it("returns null when DELIVERED stage missing", () => {
      const stages = [makeTrackingStage({ stageType: "PRE_ARRIVAL_DOCS" })]
      expect(getEstimatedDelivery(stages as any)).toBeNull()
    })
  })

  describe("toPublicTrackingData", () => {
    it("sanitizes consignee to first name only", () => {
      const shipment = {
        ...makeShipment({ consignee: "Ahmed Mohamed Ali" }),
        trackingStages: [makeTrackingStage()],
      }
      const result = toPublicTrackingData(shipment as any)
      expect(result.consigneeFirstName).toBe("Ahmed")
    })

    it("sorts stages by order", () => {
      const shipment = {
        ...makeShipment(),
        trackingStages: [
          makeTrackingStage({ stageType: "RELEASE" }),
          makeTrackingStage({ stageType: "PRE_ARRIVAL_DOCS" }),
          makeTrackingStage({ stageType: "INSPECTION" }),
        ],
      }
      const result = toPublicTrackingData(shipment as any)
      expect(result.stages.map((s) => s.stageType)).toEqual([
        "PRE_ARRIVAL_DOCS",
        "INSPECTION",
        "RELEASE",
      ])
    })
  })

  describe("formatTrackingDate", () => {
    it("returns - for null", () => {
      expect(formatTrackingDate(null, "en")).toBe("-")
    })

    it("formats a date for each locale", () => {
      const d = new Date("2026-05-01T12:34:00Z")
      expect(formatTrackingDate(d, "en")).not.toBe("-")
      expect(formatTrackingDate(d, "ar")).not.toBe("-")
    })
  })

  describe("getRelativeTime", () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date("2026-05-01T00:00:00Z"))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it("returns - for null", () => {
      expect(getRelativeTime(null, "en")).toBe("-")
    })

    it("formats hours for dates within 24h", () => {
      const d = new Date("2026-05-01T02:00:00Z")
      expect(getRelativeTime(d, "en")).toMatch(/hour/i)
    })

    it("formats days for dates beyond 24h", () => {
      const d = new Date("2026-05-05T00:00:00Z")
      expect(getRelativeTime(d, "en")).toMatch(/day/i)
    })
  })
})
