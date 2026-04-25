import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import { auth } from "@/auth"
import { db } from "@/lib/db"
import {
  createExchangeRate,
  getActiveExchangeRate,
  getExchangeRateHistory,
  convertCurrency,
} from "@/actions/exchange-rate"
import { makeSession } from "@/__tests__/helpers/factories"

describe("exchange-rate actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(makeSession() as any)
  })

  describe("createExchangeRate", () => {
    it("rejects without auth", async () => {
      vi.mocked(auth).mockResolvedValue(null as any)
      await expect(createExchangeRate({ rate: 100 } as any)).rejects.toThrow("Unauthorized")
    })

    it("deactivates prior active rates before creating", async () => {
      const created = { id: "er-1", rate: 555 }
      vi.mocked((db.exchangeRate as any).updateMany).mockResolvedValue({ count: 2 } as any)
      vi.mocked((db.exchangeRate as any).create).mockResolvedValue(created as any)

      const result = await createExchangeRate({ rate: 555 } as any)
      expect((db.exchangeRate as any).updateMany).toHaveBeenCalledWith({
        where: { fromCurrency: "USD", toCurrency: "SDG", isActive: true },
        data: { isActive: false },
      })
      expect(result).toBe(created)
    })

    it("accepts string effectiveDate and parses to Date", async () => {
      vi.mocked((db.exchangeRate as any).updateMany).mockResolvedValue({ count: 0 } as any)
      vi.mocked((db.exchangeRate as any).create).mockResolvedValue({ id: "er-2" } as any)
      await createExchangeRate({ rate: 3000, effectiveDate: "2026-01-01" } as any)
      const arg = vi.mocked((db.exchangeRate as any).create).mock.calls[0]![0] as any
      expect(arg.data.effectiveDate).toBeInstanceOf(Date)
    })

    it("rejects non-positive rate", async () => {
      await expect(createExchangeRate({ rate: -5 } as any)).rejects.toThrow()
    })
  })

  describe("getActiveExchangeRate", () => {
    it("returns null when none active", async () => {
      vi.mocked((db.exchangeRate as any).findFirst).mockResolvedValue(null)
      expect(await getActiveExchangeRate()).toBeNull()
    })

    it("coerces rate to number", async () => {
      vi.mocked((db.exchangeRate as any).findFirst).mockResolvedValue({
        id: "er-1",
        rate: "3150.25",
        effectiveDate: new Date(),
      } as any)
      const result = await getActiveExchangeRate()
      expect(result?.rate).toBe(3150.25)
    })
  })

  describe("getExchangeRateHistory", () => {
    it("returns rates as numbers", async () => {
      vi.mocked((db.exchangeRate as any).findMany).mockResolvedValue([
        { id: "1", rate: "100", user: { name: "a" } },
        { id: "2", rate: 200, user: { name: "b" } },
      ] as any)
      const result = await getExchangeRateHistory()
      expect(result[0]!.rate).toBe(100)
      expect(result[1]!.rate).toBe(200)
    })
  })

  describe("convertCurrency", () => {
    it("returns null when no active rate", async () => {
      vi.mocked((db.exchangeRate as any).findFirst).mockResolvedValue(null)
      expect(await convertCurrency(100)).toBeNull()
    })

    it("multiplies amount by active rate and rounds to 2 decimals", async () => {
      vi.mocked((db.exchangeRate as any).findFirst).mockResolvedValue({
        id: "er-1",
        rate: "2.345",
        effectiveDate: new Date("2026-01-01"),
      } as any)
      const result = await convertCurrency(10)
      // 10 * 2.345 = 23.45
      expect(result?.converted).toBe(23.45)
      expect(result?.rate).toBe(2.345)
    })
  })
})
