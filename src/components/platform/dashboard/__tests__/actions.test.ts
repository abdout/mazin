import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/auth", () => ({ auth: vi.fn() }))

import { auth } from "@/auth"
import { db } from "@/lib/db"
import {
  getCashFlowData,
  getExpenseCategories,
  getFinancialChartData,
  getQuickLookData,
  getTrendingStatsData,
  getUpcomingData,
} from "../actions"
import { makeSession } from "@/__tests__/helpers/factories"

const USER_A = "user-a"

const ZERO_AGG = { _sum: { total: 0, amount: 0, currentBalance: 0 } }

function mockZeroAggregates() {
  vi.mocked(db.shipment.count).mockResolvedValue(0 as any)
  vi.mocked(db.customsDeclaration.count).mockResolvedValue(0 as any)
  vi.mocked(db.invoice.count).mockResolvedValue(0 as any)
  vi.mocked(db.invoice.aggregate).mockResolvedValue(ZERO_AGG as any)
  vi.mocked(db.expense.aggregate).mockResolvedValue(ZERO_AGG as any)
  vi.mocked(db.expense.groupBy).mockResolvedValue([] as any)
  vi.mocked(db.expenseCategory.findMany).mockResolvedValue([] as any)
  vi.mocked(db.bankAccount.aggregate).mockResolvedValue(ZERO_AGG as any)
  vi.mocked(db.$queryRaw).mockResolvedValue([] as any)
}

describe("dashboard actions — tenant scoping", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(
      makeSession({ user: { id: USER_A, role: "ADMIN", name: "A", email: "a@t" } }) as any
    )
    mockZeroAggregates()
  })

  describe("getQuickLookData", () => {
    it("returns zeros and skips DB calls when unauthenticated", async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as any)
      const res = await getQuickLookData()
      expect(res).toEqual({
        totalShipments: 0,
        inTransit: 0,
        pendingCustoms: 0,
        unpaidTotal: 0,
      })
      expect(db.shipment.count).not.toHaveBeenCalled()
    })

    it("scopes every aggregate to session.user.id", async () => {
      await getQuickLookData()
      const shipCalls = vi.mocked(db.shipment.count).mock.calls as any[]
      for (const [args] of shipCalls) {
        expect(args.where.userId).toBe(USER_A)
      }
      const customsCalls = vi.mocked(db.customsDeclaration.count).mock.calls as any[]
      for (const [args] of customsCalls) {
        expect(args.where.userId).toBe(USER_A)
      }
      const invCall = vi.mocked(db.invoice.aggregate).mock.calls[0]?.[0] as any
      expect(invCall.where.userId).toBe(USER_A)
    })
  })

  describe("getCashFlowData", () => {
    it("returns empty data when unauthenticated", async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as any)
      const res = await getCashFlowData()
      expect(res).toEqual({ inflowData: [], outflowData: [], balanceData: [] })
    })

    it("scopes invoice, expense, and bankAccount aggregates to userId", async () => {
      await getCashFlowData()
      const invCall = vi.mocked(db.invoice.aggregate).mock.calls[0]?.[0] as any
      const expCall = vi.mocked(db.expense.aggregate).mock.calls[0]?.[0] as any
      const bankCall = vi.mocked(db.bankAccount.aggregate).mock.calls[0]?.[0] as any
      expect(invCall.where.userId).toBe(USER_A)
      expect(expCall.where.userId).toBe(USER_A)
      expect(bankCall.where.userId).toBe(USER_A)
    })
  })

  describe("getExpenseCategories", () => {
    it("scopes groupBy to userId (not global)", async () => {
      await getExpenseCategories()
      const call = vi.mocked(db.expense.groupBy).mock.calls[0]?.[0] as any
      expect(call.where.userId).toBe(USER_A)
    })

    it("returns [] when unauthenticated", async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as any)
      const res = await getExpenseCategories()
      expect(res).toEqual([])
    })
  })

  describe("getFinancialChartData", () => {
    it("scopes raw Invoice + Expense queries to userId via parameterized SQL", async () => {
      await getFinancialChartData()
      // Both $queryRaw calls should include a userId parameter — verify via
      // the TemplateStringsArray interpolation (args = [strings, ...values]).
      const rawCalls = vi.mocked(db.$queryRaw).mock.calls as any[]
      expect(rawCalls.length).toBeGreaterThanOrEqual(2)
      for (const args of rawCalls) {
        // First slot is the TemplateStringsArray; interpolated values follow.
        const interpolated = args.slice(1)
        expect(interpolated).toContain(USER_A)
      }
    })

    it("returns empty series when unauthenticated", async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as any)
      const res = await getFinancialChartData()
      expect(res).toEqual({
        revenueData: [],
        expenseData: [],
        profitData: [],
        labels: [],
      })
    })
  })

  describe("getTrendingStatsData", () => {
    it("scopes every count and aggregate (this/last month, totals) to userId", async () => {
      await getTrendingStatsData()
      const shipCalls = vi.mocked(db.shipment.count).mock.calls as any[]
      const invCalls = vi.mocked(db.invoice.aggregate).mock.calls as any[]
      const customsCalls = vi.mocked(db.customsDeclaration.count).mock.calls as any[]
      for (const [args] of shipCalls) {
        expect(args.where.userId).toBe(USER_A)
      }
      for (const [args] of invCalls) {
        expect(args.where.userId).toBe(USER_A)
      }
      for (const [args] of customsCalls) {
        expect(args.where.userId).toBe(USER_A)
      }
    })
  })

  describe("getUpcomingData (role dispatch)", () => {
    it("ADMIN path scopes totals to the session user, not global", async () => {
      const res = await getUpcomingData("ADMIN")
      expect(res).toBeDefined()
      // The admin flow invokes db.shipment.count and db.invoice.aggregate.
      const shipCall = vi.mocked(db.shipment.count).mock.calls[0]?.[0] as any
      const invCall = vi.mocked(db.invoice.aggregate).mock.calls[0]?.[0] as any
      expect(shipCall.where.userId).toBe(USER_A)
      expect(invCall.where.userId).toBe(USER_A)
    })

    it("CLERK path keeps its own-declarations filter", async () => {
      const res = await getUpcomingData("CLERK")
      expect(res).toBeDefined()
      const customsCalls = vi.mocked(db.customsDeclaration.count).mock.calls as any[]
      // Every clerk query uses userId (explicitly filtered to self already).
      for (const [args] of customsCalls) {
        expect(args.where.userId).toBe(USER_A)
      }
    })
  })
})
