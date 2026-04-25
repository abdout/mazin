/**
 * Duty calculation math — mocked HS code row so we can cover the rate-math
 * without hitting the DB.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: { id: "s", email: "s@x", type: "STAFF", role: "ADMIN" } })),
}))

const findUnique = vi.fn()
vi.mock("@/lib/db", () => ({
  db: {
    hsCode: { findUnique: (args: unknown) => findUnique(args) },
  },
}))

import { estimateDuty } from "@/components/platform/customs/hs-code-actions"

describe("estimateDuty", () => {
  beforeEach(() => findUnique.mockReset())

  it("computes cascading VAT (CIF + duty + excise)", async () => {
    findUnique.mockResolvedValue({
      code: "8703.23",
      customsDutyRate: 25,
      vatRate: 17,
      exciseRate: 15,
      developmentFee: 0,
      isActive: true,
    })
    const r = await estimateDuty("8703.23", 10000)
    expect(r.breakdown.customsDuty).toBe(2500)
    expect(r.breakdown.excise).toBe(1500)
    // VAT base = 10000 + 2500 + 1500 = 14000 → VAT = 2380
    expect(r.breakdown.vat).toBeCloseTo(2380, 2)
    expect(r.total).toBeCloseTo(6380, 2)
  })

  it("handles zero-rate duties", async () => {
    findUnique.mockResolvedValue({
      code: "3004.90",
      customsDutyRate: 0,
      vatRate: 17,
      exciseRate: 0,
      developmentFee: 0,
      isActive: true,
    })
    const r = await estimateDuty("3004.90", 5000)
    expect(r.breakdown.customsDuty).toBe(0)
    expect(r.breakdown.vat).toBe(850) // 17% of 5000 since no additive duties
  })

  it("throws for unknown code", async () => {
    findUnique.mockResolvedValue(null)
    await expect(estimateDuty("9999.99", 1000)).rejects.toThrow(/Unknown HS code/)
  })
})
