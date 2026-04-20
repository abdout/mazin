import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { lookupHsCode, calculateDuty } from "@/actions/duty-calculator"
import { makeSession } from "@/__tests__/helpers/factories"

describe("lookupHsCode", () => {
  const session = makeSession()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(session as any)
  })

  it("throws Unauthorized when no session", async () => {
    vi.mocked(auth).mockResolvedValue(null as any)

    await expect(lookupHsCode("8703")).rejects.toThrow("Unauthorized")
  })

  it("returns HS code on exact match", async () => {
    const hsRecord = {
      id: "hs-1",
      code: "8703",
      description: "Motor cars",
      descriptionAr: "سيارات",
      category: "Vehicles",
      customsDutyRate: 40,
      vatRate: 17,
      exciseRate: 15,
      developmentFee: 0,
      isActive: true,
    }
    vi.mocked(db.hsCode.findFirst).mockResolvedValueOnce(hsRecord as any)

    const result = await lookupHsCode("8703")

    expect(result).toBeTruthy()
    expect(result!.code).toBe("8703")
    expect(result!.rates.customsDutyRate).toBe(40)
    expect(result!.rates.vatRate).toBe(17)
    expect(result!.rates.exciseRate).toBe(15)
  })

  it("falls back to partial match when exact match not found", async () => {
    const hsRecord = {
      id: "hs-2",
      code: "8703",
      description: "Motor cars",
      descriptionAr: "سيارات",
      category: "Vehicles",
      customsDutyRate: 40,
      vatRate: 17,
      exciseRate: 15,
      developmentFee: 0,
      isActive: true,
    }
    // First call (exact match) returns null
    vi.mocked(db.hsCode.findFirst).mockResolvedValueOnce(null)
    // Second call (partial match) returns record
    vi.mocked(db.hsCode.findFirst).mockResolvedValueOnce(hsRecord as any)

    const result = await lookupHsCode("8703.10")

    expect(result).toBeTruthy()
    expect(result!.code).toBe("8703")
    // Second call should use startsWith with first 4 chars
    expect(vi.mocked(db.hsCode.findFirst).mock.calls[1]![0]).toEqual({
      where: {
        code: { startsWith: "8703" },
        isActive: true,
      },
    })
  })

  it("returns null when no match found at all", async () => {
    vi.mocked(db.hsCode.findFirst).mockResolvedValue(null)

    const result = await lookupHsCode("9999")

    expect(result).toBeNull()
  })
})

describe("calculateDuty", () => {
  const session = makeSession()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(session as any)
  })

  it("throws Unauthorized when no session", async () => {
    vi.mocked(auth).mockResolvedValue(null as any)

    await expect(
      calculateDuty({ hsCode: "8703", cifValue: 100000, currency: "SDG" })
    ).rejects.toThrow("Unauthorized")
  })

  it("throws when HS code not found", async () => {
    vi.mocked(db.hsCode.findFirst).mockResolvedValue(null)

    await expect(
      calculateDuty({ hsCode: "0000", cifValue: 100000, currency: "SDG" })
    ).rejects.toThrow('HS Code "0000" not found')
  })

  it("calculates duties correctly with customs + VAT on CIF", async () => {
    // HS 8703: Motor cars — 40% customs, 17% VAT, 15% excise, 0% dev fee
    const hsRecord = {
      id: "hs-1",
      code: "8703",
      description: "Motor cars",
      descriptionAr: "سيارات",
      category: "Vehicles",
      customsDutyRate: 40,
      vatRate: 17,
      exciseRate: 15,
      developmentFee: 0,
      isActive: true,
    }
    vi.mocked(db.hsCode.findFirst).mockResolvedValue(hsRecord as any)

    const result = await calculateDuty({
      hsCode: "8703",
      cifValue: 100000,
      currency: "SDG",
    })

    // customsDuty = 100000 * 40/100 = 40000
    expect(result.customsDuty).toBe(40000)
    // exciseDuty = 100000 * 15/100 = 15000
    expect(result.exciseDuty).toBe(15000)
    // developmentFee = 100000 * 0/100 = 0
    expect(result.developmentFee).toBe(0)
    // vatBase = 100000 + 40000 + 15000 = 155000
    expect(result.breakdown.vatBase).toBe(155000)
    // vat = 155000 * 17/100 = 26350
    expect(result.vat).toBe(26350)
    // totalDuty = 40000 + 15000 + 0 + 26350 = 81350
    expect(result.totalDuty).toBe(81350)
    // effectiveRate = (81350 / 100000) * 100 = 81.35
    expect(result.effectiveRate).toBe(81.35)
  })

  it("handles zero-rate HS codes (e.g. wheat)", async () => {
    const hsRecord = {
      id: "hs-wheat",
      code: "1001",
      description: "Wheat and meslin",
      descriptionAr: "القمح والمزيج",
      category: "Food",
      customsDutyRate: 0,
      vatRate: 0,
      exciseRate: 0,
      developmentFee: 0,
      isActive: true,
    }
    vi.mocked(db.hsCode.findFirst).mockResolvedValue(hsRecord as any)

    const result = await calculateDuty({
      hsCode: "1001",
      cifValue: 50000,
      currency: "SDG",
    })

    expect(result.customsDuty).toBe(0)
    expect(result.vat).toBe(0)
    expect(result.exciseDuty).toBe(0)
    expect(result.developmentFee).toBe(0)
    expect(result.totalDuty).toBe(0)
    expect(result.effectiveRate).toBe(0)
  })

  it("calculates VAT on CIF + customsDuty + exciseDuty (not on CIF alone)", async () => {
    // HS 1006: Rice — 3% customs, 17% VAT, 0% excise
    const hsRecord = {
      id: "hs-rice",
      code: "1006",
      description: "Rice",
      descriptionAr: "الأرز",
      category: "Food",
      customsDutyRate: 3,
      vatRate: 17,
      exciseRate: 0,
      developmentFee: 0,
      isActive: true,
    }
    vi.mocked(db.hsCode.findFirst).mockResolvedValue(hsRecord as any)

    const result = await calculateDuty({
      hsCode: "1006",
      cifValue: 10000,
      currency: "SDG",
    })

    // customsDuty = 10000 * 3/100 = 300
    expect(result.customsDuty).toBe(300)
    // vatBase = 10000 + 300 + 0 = 10300
    expect(result.breakdown.vatBase).toBe(10300)
    // vat = 10300 * 17/100 = 1751
    expect(result.vat).toBe(1751)
    // totalDuty = 300 + 0 + 0 + 1751 = 2051
    expect(result.totalDuty).toBe(2051)
  })

  it("returns breakdown with all rate fields", async () => {
    const hsRecord = {
      id: "hs-cement",
      code: "2523",
      description: "Portland cement",
      descriptionAr: "الأسمنت البورتلاندي",
      category: "Construction",
      customsDutyRate: 10,
      vatRate: 17,
      exciseRate: 0,
      developmentFee: 0,
      isActive: true,
    }
    vi.mocked(db.hsCode.findFirst).mockResolvedValue(hsRecord as any)

    const result = await calculateDuty({
      hsCode: "2523",
      cifValue: 20000,
      currency: "USD",
    })

    expect(result.breakdown.customsDutyRate).toBe(10)
    expect(result.breakdown.vatRate).toBe(17)
    expect(result.breakdown.exciseRate).toBe(0)
    expect(result.breakdown.developmentFeeRate).toBe(0)
    expect(result.currency).toBe("USD")
    expect(result.hsCode).toBe("2523")
    expect(result.hsDescription).toBe("Portland cement")
  })
})
