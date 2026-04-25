import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/auth", () => ({ auth: vi.fn() }))

import { auth } from "@/auth"
import { db } from "@/lib/db"
import {
  getARAging,
  getCashFlowThisMonth,
  getPnlSummary,
  getWalletSummary,
} from "../actions"
import { makeSession } from "@/__tests__/helpers/factories"

const USER_A = "user-a"

describe("finance reports — tenant isolation + math", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(
      makeSession({ user: { id: USER_A, role: "ADMIN", name: "A", email: "a@t" } }) as any
    )
  })

  describe("getPnlSummary", () => {
    it("rejects unauthenticated callers", async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as any)
      const res = await getPnlSummary()
      expect(res.success).toBe(false)
      expect(db.invoice.aggregate).not.toHaveBeenCalled()
    })

    it("scopes every invoice + expense aggregate to userId", async () => {
      vi.mocked(db.invoice.aggregate).mockResolvedValue({
        _sum: { total: 0 },
      } as any)
      vi.mocked(db.expense.aggregate).mockResolvedValue({
        _sum: { amount: 0 },
      } as any)
      await getPnlSummary()
      const invoiceCalls = vi.mocked(db.invoice.aggregate).mock.calls as any[]
      for (const [args] of invoiceCalls) {
        expect(args.where.userId).toBe(USER_A)
      }
      const expenseCalls = vi.mocked(db.expense.aggregate).mock.calls as any[]
      for (const [args] of expenseCalls) {
        expect(args.where.userId).toBe(USER_A)
      }
    })

    it("profit = revenue - expenses", async () => {
      vi.mocked(db.invoice.aggregate).mockResolvedValue({
        _sum: { total: 10_000 },
      } as any)
      vi.mocked(db.expense.aggregate).mockResolvedValue({
        _sum: { amount: 2_500 },
      } as any)
      const res = await getPnlSummary()
      expect(res.success).toBe(true)
      if (res.success && res.data) {
        expect(res.data.thisMonth.revenue).toBe(10_000)
        expect(res.data.thisMonth.expenses).toBe(2_500)
        expect(res.data.thisMonth.profit).toBe(7_500)
      }
    })
  })

  describe("getARAging", () => {
    it("buckets invoices by days outstanding", async () => {
      const now = Date.now()
      vi.mocked(db.invoice.findMany).mockResolvedValueOnce([
        // 10 days outstanding (0-30)
        { id: "1", total: 1000, dueDate: new Date(now - 10 * 86_400_000), createdAt: new Date() },
        // 45 days (31-60)
        { id: "2", total: 2000, dueDate: new Date(now - 45 * 86_400_000), createdAt: new Date() },
        // 75 days (61-90)
        { id: "3", total: 3000, dueDate: new Date(now - 75 * 86_400_000), createdAt: new Date() },
        // 120 days (90+)
        { id: "4", total: 4000, dueDate: new Date(now - 120 * 86_400_000), createdAt: new Date() },
        // No dueDate — falls back to createdAt (0 days → 0-30)
        { id: "5", total: 500, dueDate: null, createdAt: new Date() },
      ] as any)
      const res = await getARAging()
      expect(res.success).toBe(true)
      if (res.success && res.data) {
        expect(res.data.totalOutstanding).toBe(10_500)
        expect(res.data.buckets).toHaveLength(4)
        const [b1, b2, b3, b4] = res.data.buckets as [
          typeof res.data.buckets[0],
          typeof res.data.buckets[0],
          typeof res.data.buckets[0],
          typeof res.data.buckets[0],
        ]
        expect(b1.label).toBe("0-30")
        expect(b1.count).toBe(2)
        expect(b1.amount).toBe(1_500)
        expect(b2.amount).toBe(2_000)
        expect(b3.amount).toBe(3_000)
        expect(b4.amount).toBe(4_000)
      }
    })

    it("scopes findMany to userId and excludes paid / cancelled", async () => {
      vi.mocked(db.invoice.findMany).mockResolvedValueOnce([] as any)
      await getARAging()
      const call = vi.mocked(db.invoice.findMany).mock.calls[0]?.[0] as any
      expect(call.where.userId).toBe(USER_A)
      expect(call.where.status.notIn).toContain("PAID")
      expect(call.where.status.notIn).toContain("CANCELLED")
    })
  })

  describe("getWalletSummary", () => {
    it("filters through the Client relation to the caller", async () => {
      vi.mocked(db.wallet.aggregate).mockResolvedValueOnce({
        _sum: { balance: 5_000 },
      } as any)
      vi.mocked(db.wallet.count).mockResolvedValueOnce(3 as any)
      vi.mocked(db.wallet.findMany).mockResolvedValueOnce([] as any)
      const res = await getWalletSummary()
      expect(res.success).toBe(true)
      if (res.success && res.data) {
        expect(res.data.totalHeld).toBe(5_000)
        expect(res.data.walletCount).toBe(3)
      }
      const aggCall = vi.mocked(db.wallet.aggregate).mock.calls[0]?.[0] as any
      expect(aggCall.where).toEqual({ client: { userId: USER_A } })
    })

    it("returns top clients with balances", async () => {
      vi.mocked(db.wallet.aggregate).mockResolvedValueOnce({
        _sum: { balance: 0 },
      } as any)
      vi.mocked(db.wallet.count).mockResolvedValueOnce(0 as any)
      vi.mocked(db.wallet.findMany).mockResolvedValueOnce([
        {
          id: "w-1",
          balance: 3_000,
          currency: "SDG",
          client: { id: "c-1", companyName: "Acme Importers" },
        },
      ] as any)
      const res = await getWalletSummary()
      expect(res.success).toBe(true)
      if (res.success && res.data) {
        expect(res.data.topClients).toHaveLength(1)
        expect(res.data.topClients[0]?.clientName).toBe("Acme Importers")
        expect(res.data.topClients[0]?.balance).toBe(3_000)
      }
    })
  })

  describe("getCashFlowThisMonth", () => {
    it("absolute-values negative wallet drawdowns for outflow display", async () => {
      vi.mocked(db.invoice.aggregate).mockResolvedValueOnce({
        _sum: { total: 5_000 },
      } as any)
      vi.mocked(db.expense.aggregate).mockResolvedValueOnce({
        _sum: { amount: 1_000 },
      } as any)
      vi.mocked(db.walletTransaction.aggregate).mockResolvedValueOnce({
        _sum: { amount: 2_000 }, // deposits (positive)
      } as any)
      vi.mocked(db.walletTransaction.aggregate).mockResolvedValueOnce({
        _sum: { amount: -1_500 }, // drawdowns (negative in ledger)
      } as any)
      const res = await getCashFlowThisMonth()
      expect(res.success).toBe(true)
      if (res.success && res.data) {
        expect(res.data.inflows.invoicePayments).toBe(5_000)
        expect(res.data.inflows.walletDeposits).toBe(2_000)
        expect(res.data.inflows.total).toBe(7_000)
        expect(res.data.outflows.expenses).toBe(1_000)
        // Drawdowns displayed as positive magnitude despite negative storage.
        expect(res.data.outflows.walletDrawdowns).toBe(1_500)
        expect(res.data.outflows.total).toBe(2_500)
        expect(res.data.net).toBe(4_500)
      }
    })

    it("scopes each aggregate to the caller", async () => {
      vi.mocked(db.invoice.aggregate).mockResolvedValueOnce({
        _sum: { total: 0 },
      } as any)
      vi.mocked(db.expense.aggregate).mockResolvedValueOnce({
        _sum: { amount: 0 },
      } as any)
      vi.mocked(db.walletTransaction.aggregate).mockResolvedValueOnce({
        _sum: { amount: 0 },
      } as any)
      vi.mocked(db.walletTransaction.aggregate).mockResolvedValueOnce({
        _sum: { amount: 0 },
      } as any)
      await getCashFlowThisMonth()
      const invCall = vi.mocked(db.invoice.aggregate).mock.calls[0]?.[0] as any
      const expCall = vi.mocked(db.expense.aggregate).mock.calls[0]?.[0] as any
      const depCall = vi.mocked(db.walletTransaction.aggregate).mock.calls[0]?.[0] as any
      const drwCall = vi.mocked(db.walletTransaction.aggregate).mock.calls[1]?.[0] as any
      expect(invCall.where.userId).toBe(USER_A)
      expect(expCall.where.userId).toBe(USER_A)
      expect(depCall.where.wallet).toEqual({ client: { userId: USER_A } })
      expect(drwCall.where.wallet).toEqual({ client: { userId: USER_A } })
    })
  })
})
