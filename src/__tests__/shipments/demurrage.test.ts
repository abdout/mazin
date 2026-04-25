import { describe, it, expect } from "vitest"
import { calculateDemurrage } from "@/components/platform/shipments/demurrage"

describe("demurrage calculator", () => {
  const start = new Date("2026-03-01T00:00:00Z")

  it("returns zero when no start date", () => {
    const r = calculateDemurrage({
      demurrageStartDate: null,
      freeDays: 14,
      demurrageDailyRate: 100,
      now: new Date("2026-03-10"),
    })
    expect(r.amount).toBe(0)
    expect(r.inFreeWindow).toBe(true)
  })

  it("charges 0 during free window", () => {
    const r = calculateDemurrage({
      demurrageStartDate: start,
      freeDays: 14,
      demurrageDailyRate: 100,
      now: new Date("2026-03-08T00:00:00Z"), // 7 days in
    })
    expect(r.daysElapsed).toBe(7)
    expect(r.chargeableDays).toBe(0)
    expect(r.amount).toBe(0)
    expect(r.freeDaysRemaining).toBe(7)
  })

  it("charges after free window expires", () => {
    const r = calculateDemurrage({
      demurrageStartDate: start,
      freeDays: 14,
      demurrageDailyRate: 250,
      now: new Date("2026-03-20T00:00:00Z"), // 19 days in
    })
    expect(r.daysElapsed).toBe(19)
    expect(r.chargeableDays).toBe(5)
    expect(r.amount).toBe(1250)
    expect(r.inFreeWindow).toBe(false)
  })

  it("handles missing rate gracefully", () => {
    const r = calculateDemurrage({
      demurrageStartDate: start,
      freeDays: 14,
      demurrageDailyRate: null,
      now: new Date("2026-03-30"),
    })
    expect(r.amount).toBe(0)
  })
})
