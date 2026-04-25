import { describe, it, expect } from "vitest"
import {
  validateAcdPreArrival,
  ACD_MIN_DAYS_BEFORE_ARRIVAL,
} from "@/components/platform/customs/acd-validation"

describe("ACD pre-arrival rule", () => {
  const now = new Date("2026-01-15T00:00:00Z")

  it(`passes when arrival is ${ACD_MIN_DAYS_BEFORE_ARRIVAL}+ days away`, () => {
    const arrival = new Date("2026-01-21T00:00:00Z") // 6 days
    expect(validateAcdPreArrival(arrival, now)).toBeNull()
  })

  it("rejects when arrival is within 5 days", () => {
    const arrival = new Date("2026-01-18T00:00:00Z") // 3 days
    const result = validateAcdPreArrival(arrival, now)
    expect(result).toMatch(/at least 5 days/)
  })

  it("rejects when arrival is in the past", () => {
    const arrival = new Date("2026-01-10T00:00:00Z")
    expect(validateAcdPreArrival(arrival, now)).not.toBeNull()
  })

  it("accepts arrival exactly 5 days out", () => {
    const arrival = new Date("2026-01-20T00:00:00Z") // 5 days
    expect(validateAcdPreArrival(arrival, now)).toBeNull()
  })
})
