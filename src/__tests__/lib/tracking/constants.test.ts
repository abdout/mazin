import { describe, it, expect } from "vitest"
import {
  STAGE_ORDER,
  STAGE_CONFIG,
  STAGE_ICONS,
  STATUS_STYLES,
  PAYABLE_STAGES,
  isPayableStage,
} from "@/lib/tracking/constants"

describe("tracking/constants", () => {
  it("STAGE_ORDER has 11 stages in the documented order", () => {
    expect(STAGE_ORDER).toHaveLength(11)
    expect(STAGE_ORDER[0]).toBe("PRE_ARRIVAL_DOCS")
    expect(STAGE_ORDER[STAGE_ORDER.length - 1]).toBe("DELIVERED")
  })

  it("STAGE_CONFIG covers every stage with matching order numbers", () => {
    for (let i = 0; i < STAGE_ORDER.length; i++) {
      const stage = STAGE_ORDER[i]!
      const cfg = STAGE_CONFIG[stage]
      expect(cfg).toBeDefined()
      expect(cfg.order).toBe(i + 1)
      expect(cfg.estimatedHours).toBeGreaterThanOrEqual(0)
    }
  })

  it("STAGE_ICONS maps every stage to an icon", () => {
    for (const stage of STAGE_ORDER) {
      expect(STAGE_ICONS[stage]).toBeDefined()
    }
  })

  it("STATUS_STYLES covers the 4 possible statuses", () => {
    expect(STATUS_STYLES.PENDING).toBeDefined()
    expect(STATUS_STYLES.IN_PROGRESS).toBeDefined()
    expect(STATUS_STYLES.COMPLETED).toBeDefined()
    expect(STATUS_STYLES.SKIPPED).toBeDefined()
  })

  describe("isPayableStage", () => {
    it("returns true for payable stages", () => {
      for (const stage of PAYABLE_STAGES) {
        expect(isPayableStage(stage)).toBe(true)
      }
    })

    it("returns false for non-payable stages (LOADING, IN_TRANSIT, DELIVERED)", () => {
      expect(isPayableStage("LOADING")).toBe(false)
      expect(isPayableStage("IN_TRANSIT")).toBe(false)
      expect(isPayableStage("DELIVERED")).toBe(false)
    })
  })
})
