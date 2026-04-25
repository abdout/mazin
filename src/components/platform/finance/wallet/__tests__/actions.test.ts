import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import { auth } from "@/auth"
import { db } from "@/lib/db"
import {
  depositToWallet,
  drawdownFromWallet,
  getOrCreateWallet,
} from "../actions"
import { makeSession } from "@/__tests__/helpers/factories"

const USER_A = "user-a"
const CLIENT_ID = "cm7clientxxxxxxxxxxxxxxxx"
const WALLET_ID = "cm7walletxxxxxxxxxxxxxxxx"

describe("wallet actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(
      makeSession({ user: { id: USER_A, role: "ADMIN", name: "A", email: "a@t" } }) as any
    )
    // $transaction fake: run the callback with tx = db
    vi.mocked(db.$transaction).mockImplementation(((cb: any) => cb(db)) as any)
  })

  describe("getOrCreateWallet", () => {
    it("rejects unauthenticated callers", async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as any)
      const res = await getOrCreateWallet({ clientId: CLIENT_ID, currency: "SDG" })
      expect(res.ok).toBe(false)
      expect(db.wallet.upsert).not.toHaveBeenCalled()
    })

    it("refuses when the client isn't owned by the caller", async () => {
      vi.mocked(db.client.findFirst).mockResolvedValueOnce(null as any)
      const res = await getOrCreateWallet({ clientId: CLIENT_ID, currency: "SDG" })
      expect(res.ok).toBe(false)
      if (!res.ok) expect(res.error).toBe("CLIENT_NOT_FOUND")
      expect(db.wallet.upsert).not.toHaveBeenCalled()
    })

    it("upserts and returns the wallet when the client check passes", async () => {
      vi.mocked(db.client.findFirst).mockResolvedValueOnce({ id: CLIENT_ID } as any)
      vi.mocked(db.wallet.upsert).mockResolvedValueOnce({
        id: WALLET_ID,
        balance: 0,
        currency: "SDG",
      } as any)
      const res = await getOrCreateWallet({ clientId: CLIENT_ID, currency: "SDG" })
      expect(res.ok).toBe(true)
      const call = vi.mocked(db.wallet.upsert).mock.calls[0]?.[0] as any
      expect(call.where).toEqual({ clientId: CLIENT_ID })
    })
  })

  describe("depositToWallet", () => {
    it("rejects a deposit when the wallet isn't owned by the caller", async () => {
      vi.mocked(db.wallet.findFirst).mockResolvedValueOnce(null as any)
      const res = await depositToWallet({ walletId: WALLET_ID, amount: 100 })
      expect(res.ok).toBe(false)
      if (!res.ok) expect(res.error).toBe("WALLET_NOT_FOUND")
      expect(db.wallet.update).not.toHaveBeenCalled()
      expect(db.walletTransaction.create).not.toHaveBeenCalled()
    })

    it("rejects negative / zero amounts with INVALID_INPUT", async () => {
      const res = await depositToWallet({ walletId: WALLET_ID, amount: 0 })
      expect(res.ok).toBe(false)
      if (!res.ok) {
        expect(res.error).toBe("INVALID_INPUT")
        expect(res.issues?.amount).toBeDefined()
      }
    })

    it("increments balance and writes a DEPOSIT ledger entry (atomic)", async () => {
      vi.mocked(db.wallet.findFirst).mockResolvedValueOnce({
        id: WALLET_ID,
        balance: 1000,
        status: "ACTIVE",
      } as any)
      vi.mocked(db.wallet.update).mockResolvedValueOnce({
        id: WALLET_ID,
        balance: 1250,
      } as any)
      vi.mocked(db.walletTransaction.create).mockResolvedValueOnce({
        id: "tx-1",
      } as any)

      const res = await depositToWallet({
        walletId: WALLET_ID,
        amount: 250,
        reference: "Bank ref 42",
      })
      expect(res.ok).toBe(true)
      if (res.ok) expect(res.data.balance).toBe(1250)

      const updateCall = vi.mocked(db.wallet.update).mock.calls[0]?.[0] as any
      expect(updateCall.data.balance).toBe(1250)
      const txCall = vi.mocked(db.walletTransaction.create).mock.calls[0]?.[0] as any
      expect(txCall.data.type).toBe("DEPOSIT")
      expect(txCall.data.amount).toBe(250)
      expect(txCall.data.balanceAfter).toBe(1250)
      expect(txCall.data.reference).toBe("Bank ref 42")
      expect(db.$transaction).toHaveBeenCalled()
    })

    it("refuses to deposit to a frozen wallet", async () => {
      vi.mocked(db.wallet.findFirst).mockResolvedValueOnce({
        id: WALLET_ID,
        balance: 1000,
        status: "FROZEN",
      } as any)
      const res = await depositToWallet({ walletId: WALLET_ID, amount: 100 })
      expect(res.ok).toBe(false)
      if (!res.ok) expect(res.error).toBe("WALLET_NOT_ACTIVE")
    })
  })

  describe("drawdownFromWallet", () => {
    it("refuses when going below -creditLimit", async () => {
      vi.mocked(db.wallet.findFirst).mockResolvedValueOnce({
        id: WALLET_ID,
        balance: 100,
        creditLimit: 50,
        status: "ACTIVE",
      } as any)
      const res = await drawdownFromWallet({
        walletId: WALLET_ID,
        amount: 200, // 100 - 200 = -100, exceeds -50 credit limit
      })
      expect(res.ok).toBe(false)
      if (!res.ok) expect(res.error).toBe("INSUFFICIENT_BALANCE")
      expect(db.wallet.update).not.toHaveBeenCalled()
    })

    it("allows drawdown within credit limit (goes negative)", async () => {
      vi.mocked(db.wallet.findFirst).mockResolvedValueOnce({
        id: WALLET_ID,
        balance: 100,
        creditLimit: 200,
        status: "ACTIVE",
      } as any)
      vi.mocked(db.wallet.update).mockResolvedValueOnce({
        id: WALLET_ID,
        balance: -50,
      } as any)
      vi.mocked(db.walletTransaction.create).mockResolvedValueOnce({
        id: "tx-2",
      } as any)

      const res = await drawdownFromWallet({
        walletId: WALLET_ID,
        amount: 150,
        type: "INVOICE_PAYMENT",
      })
      expect(res.ok).toBe(true)
      const txCall = vi.mocked(db.walletTransaction.create).mock.calls[0]?.[0] as any
      expect(txCall.data.type).toBe("INVOICE_PAYMENT")
      expect(txCall.data.amount).toBe(-150) // signed negative
      expect(txCall.data.balanceAfter).toBe(-50)
    })

    it("ties the ledger entry to the invoice when invoiceId is provided", async () => {
      vi.mocked(db.wallet.findFirst).mockResolvedValueOnce({
        id: WALLET_ID,
        balance: 500,
        creditLimit: 0,
        status: "ACTIVE",
      } as any)
      vi.mocked(db.wallet.update).mockResolvedValueOnce({
        id: WALLET_ID,
        balance: 100,
      } as any)
      vi.mocked(db.walletTransaction.create).mockResolvedValueOnce({
        id: "tx-3",
      } as any)

      const invoiceId = "cm7invoicexxxxxxxxxxxxxxx"
      await drawdownFromWallet({
        walletId: WALLET_ID,
        amount: 400,
        invoiceId,
        type: "INVOICE_PAYMENT",
      })
      const txCall = vi.mocked(db.walletTransaction.create).mock.calls[0]?.[0] as any
      expect(txCall.data.invoiceId).toBe(invoiceId)
    })
  })
})
