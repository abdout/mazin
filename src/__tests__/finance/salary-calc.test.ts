/**
 * Direct unit test of the salary calculation math, driven via a mocked
 * structure. Integration tests with the DB live elsewhere.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/auth", () => ({ auth: vi.fn(async () => ({ user: { id: "s", email: "s@x", type: "STAFF", role: "ADMIN" } })) }))
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn() }))

const findUnique = vi.fn()
vi.mock("@/lib/db", () => ({
  db: {
    salaryStructure: { findUnique: (args: unknown) => findUnique(args) },
  },
}))

import { calculateSalary } from "@/components/platform/finance/salary/actions"

describe("calculateSalary", () => {
  beforeEach(() => findUnique.mockReset())

  it("flat allowance + flat deduction", async () => {
    findUnique.mockResolvedValue({
      basicSalary: 10000,
      allowances: [{ amount: 2000, isPercentage: false }],
      deductions: [{ amount: 500, isPercentage: false }],
    })
    const r = await calculateSalary("sid", { start: new Date(), end: new Date() })
    // @ts-expect-error loose result shape for test
    expect(r.data.grossSalary).toBe(12000)
    // @ts-expect-error loose result shape for test
    expect(r.data.netSalary).toBe(11500)
  })

  it("percentage allowance computed against basic", async () => {
    findUnique.mockResolvedValue({
      basicSalary: 10000,
      allowances: [{ amount: 10, isPercentage: true }], // 10% of basic = 1000
      deductions: [{ amount: 8, isPercentage: true }], // 8% of basic = 800 (social sec)
    })
    const r = await calculateSalary("sid", { start: new Date(), end: new Date() })
    // @ts-expect-error loose result shape for test
    expect(r.data.grossSalary).toBe(11000)
    // @ts-expect-error loose result shape for test
    expect(r.data.netSalary).toBe(10200)
  })

  it("missing structure returns error", async () => {
    findUnique.mockResolvedValue(null)
    const r = await calculateSalary("sid", { start: new Date(), end: new Date() })
    expect(r.success).toBe(false)
  })
})
