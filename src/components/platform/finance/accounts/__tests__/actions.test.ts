import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import { auth } from "@/auth"
import { db } from "@/lib/db"
import {
  createBankAccount,
  deleteBankAccount,
  getBankAccountStats,
  listBankAccounts,
  setDefaultBankAccount,
  updateBankAccount,
} from "../actions"
import { makeSession } from "@/__tests__/helpers/factories"

const USER_A = "user-a"
const ACCOUNT_ID = "cm7baxxxxxxxxxxxxxxxxxxxx"

function validInput(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    accountName: "Operating — Bank of Khartoum",
    accountNumber: "123456789",
    bankName: "Bank of Khartoum",
    currency: "SDG",
    accountType: "CURRENT",
    status: "ACTIVE",
    openingBalance: 10000,
    isDefault: false,
    isActive: true,
    displayOrder: 0,
    ...overrides,
  }
}

describe("bank accounts actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(
      makeSession({ user: { id: USER_A, role: "ADMIN", name: "A", email: "a@t" } }) as any
    )
    vi.mocked(db.$transaction).mockImplementation(((cb: any) => cb(db)) as any)
  })

  describe("listBankAccounts", () => {
    it("scopes findMany to session.user.id", async () => {
      vi.mocked(db.bankAccount.findMany).mockResolvedValueOnce([] as any)
      await listBankAccounts()
      const call = vi.mocked(db.bankAccount.findMany).mock.calls[0]?.[0] as any
      expect(call.where.userId).toBe(USER_A)
    })
  })

  describe("getBankAccountStats", () => {
    it("scopes aggregate + count to userId and returns summed balance", async () => {
      vi.mocked(db.bankAccount.aggregate).mockResolvedValueOnce({
        _sum: { currentBalance: 12500 },
      } as any)
      vi.mocked(db.bankAccount.count).mockResolvedValueOnce(3 as any)
      const res = await getBankAccountStats()
      expect(res.success).toBe(true)
      if (res.success && res.data) {
        expect(res.data.totalBalance).toBe(12500)
        expect(res.data.activeAccounts).toBe(3)
      }
      const aggCall = vi.mocked(db.bankAccount.aggregate).mock.calls[0]?.[0] as any
      expect(aggCall.where.userId).toBe(USER_A)
    })
  })

  describe("createBankAccount", () => {
    it("rejects missing required fields (accountName)", async () => {
      const res = await createBankAccount(validInput({ accountName: "" }))
      expect(res.success).toBe(false)
      expect(db.bankAccount.create).not.toHaveBeenCalled()
    })

    it("sets userId, opening balance → currentBalance, and availableBalance", async () => {
      vi.mocked(db.bankAccount.create).mockResolvedValueOnce({ id: "ba-1" } as any)
      await createBankAccount(validInput({ openingBalance: 25000 }))
      const call = vi.mocked(db.bankAccount.create).mock.calls[0]?.[0] as any
      expect(call.data.userId).toBe(USER_A)
      expect(call.data.currentBalance).toBe(25000)
      expect(call.data.availableBalance).toBe(25000)
    })

    it("flips existing defaults to false when creating a new default account", async () => {
      vi.mocked(db.bankAccount.updateMany).mockResolvedValueOnce({ count: 1 } as any)
      vi.mocked(db.bankAccount.create).mockResolvedValueOnce({ id: "ba-2" } as any)
      await createBankAccount(validInput({ isDefault: true }))
      expect(db.bankAccount.updateMany).toHaveBeenCalled()
      const updCall = vi.mocked(db.bankAccount.updateMany).mock.calls[0]?.[0] as any
      expect(updCall.where).toEqual({ userId: USER_A, isDefault: true })
      expect(updCall.data).toEqual({ isDefault: false })
    })
  })

  describe("updateBankAccount", () => {
    it("refuses when the account isn't owned by the caller", async () => {
      vi.mocked(db.bankAccount.findFirst).mockResolvedValueOnce(null as any)
      const res = await updateBankAccount(ACCOUNT_ID, { accountName: "x" })
      expect(res.success).toBe(false)
      expect(db.bankAccount.update).not.toHaveBeenCalled()
    })

    it("omits rebinding fields like openingBalance from the update payload", async () => {
      vi.mocked(db.bankAccount.findFirst).mockResolvedValueOnce({ id: ACCOUNT_ID } as any)
      vi.mocked(db.bankAccount.update).mockResolvedValueOnce({ id: ACCOUNT_ID } as any)
      await updateBankAccount(ACCOUNT_ID, {
        accountName: "Renamed",
        // openingBalance is accepted by the partial schema but not applied
        openingBalance: 999_999,
      })
      const call = vi.mocked(db.bankAccount.update).mock.calls[0]?.[0] as any
      expect(call.data.accountName).toBe("Renamed")
      expect(call.data.currentBalance).toBeUndefined()
      expect(call.data.availableBalance).toBeUndefined()
    })
  })

  describe("setDefaultBankAccount", () => {
    it("flips other accounts' default flag off before marking this one default", async () => {
      vi.mocked(db.bankAccount.findFirst).mockResolvedValueOnce({ id: ACCOUNT_ID } as any)
      vi.mocked(db.bankAccount.updateMany).mockResolvedValueOnce({ count: 1 } as any)
      vi.mocked(db.bankAccount.update).mockResolvedValueOnce({ id: ACCOUNT_ID } as any)
      await setDefaultBankAccount(ACCOUNT_ID)
      const updManyCall = vi.mocked(db.bankAccount.updateMany).mock.calls[0]?.[0] as any
      expect(updManyCall.where.NOT).toEqual({ id: ACCOUNT_ID })
      const updCall = vi.mocked(db.bankAccount.update).mock.calls[0]?.[0] as any
      expect(updCall.data.isDefault).toBe(true)
    })
  })

  describe("deleteBankAccount", () => {
    it("refuses to delete accounts with transactions (safety)", async () => {
      vi.mocked(db.bankAccount.findFirst).mockResolvedValueOnce({ id: ACCOUNT_ID } as any)
      vi.mocked(db.bankTransaction.count).mockResolvedValueOnce(5 as any)
      const res = await deleteBankAccount(ACCOUNT_ID)
      expect(res.success).toBe(false)
      expect(db.bankAccount.delete).not.toHaveBeenCalled()
    })

    it("deletes when the account is empty and owned by caller", async () => {
      vi.mocked(db.bankAccount.findFirst).mockResolvedValueOnce({ id: ACCOUNT_ID } as any)
      vi.mocked(db.bankTransaction.count).mockResolvedValueOnce(0 as any)
      vi.mocked(db.bankAccount.delete).mockResolvedValueOnce({ id: ACCOUNT_ID } as any)
      const res = await deleteBankAccount(ACCOUNT_ID)
      expect(res.success).toBe(true)
    })
  })
})
