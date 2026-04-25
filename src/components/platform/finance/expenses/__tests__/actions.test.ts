import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import { auth } from "@/auth"
import { db } from "@/lib/db"
import {
  approveExpense,
  createExpense,
  createExpenseCategory,
  deleteExpense,
  getExpense,
  getExpenseCategories,
  getExpenses,
  getExpensesByShipment,
  markExpenseAsPaid,
  rejectExpense,
  updateExpense,
} from "../actions"
import { makeSession } from "@/__tests__/helpers/factories"

const USER_A = "user-a"
const EXPENSE_ID = "cm7expxxxxxxxxxxxxxxxxxxx"
const SHIPMENT_ID = "cm7shipxxxxxxxxxxxxxxxxx"

describe("expenses actions — tenant isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(
      makeSession({ user: { id: USER_A, role: "ADMIN", name: "A", email: "a@t" } }) as any
    )
    // $transaction fake
    vi.mocked(db.$transaction).mockImplementation(((cb: any) => cb(db)) as any)
  })

  describe("getExpenseCategories", () => {
    it("returns global + caller-owned categories (userId null OR self)", async () => {
      vi.mocked(db.expenseCategory.findMany).mockResolvedValueOnce([] as any)
      await getExpenseCategories()
      const call = vi.mocked(db.expenseCategory.findMany).mock.calls[0]?.[0] as any
      expect(call.where.OR).toEqual(
        expect.arrayContaining([{ userId: null }, { userId: USER_A }])
      )
      expect(call.where.isActive).toBe(true)
    })
  })

  describe("createExpenseCategory", () => {
    it("sets userId on new categories (caller-owned, not global)", async () => {
      vi.mocked(db.expenseCategory.create).mockResolvedValueOnce({ id: "cat-1" } as any)
      await createExpenseCategory({
        name: "Port fees",
        code: "PORT_FEES",
      })
      const call = vi.mocked(db.expenseCategory.create).mock.calls[0]?.[0] as any
      expect(call.data.userId).toBe(USER_A)
    })
  })

  describe("getExpenses", () => {
    it("scopes findMany + count to userId", async () => {
      vi.mocked(db.expense.findMany).mockResolvedValueOnce([] as any)
      vi.mocked(db.expense.count).mockResolvedValueOnce(0 as any)
      await getExpenses()
      const findCall = vi.mocked(db.expense.findMany).mock.calls[0]?.[0] as any
      const countCall = vi.mocked(db.expense.count).mock.calls[0]?.[0] as any
      expect(findCall.where.userId).toBe(USER_A)
      expect(countCall.where.userId).toBe(USER_A)
    })

    it("rejects unauthenticated callers", async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as any)
      const res = await getExpenses()
      expect(res.success).toBe(false)
      expect(db.expense.findMany).not.toHaveBeenCalled()
    })
  })

  describe("getExpense", () => {
    it("uses findFirst with { id, userId }", async () => {
      vi.mocked(db.expense.findFirst).mockResolvedValueOnce({
        id: EXPENSE_ID,
        amount: 100,
      } as any)
      await getExpense(EXPENSE_ID)
      const call = vi.mocked(db.expense.findFirst).mock.calls[0]?.[0] as any
      expect(call.where).toEqual({ id: EXPENSE_ID, userId: USER_A })
    })

    it("returns not-found for cross-tenant access", async () => {
      vi.mocked(db.expense.findFirst).mockResolvedValueOnce(null as any)
      const res = await getExpense(EXPENSE_ID)
      expect(res.success).toBe(false)
      expect(res.error).toBe("Expense not found")
    })
  })

  describe("createExpense", () => {
    it("rejects creation linked to a shipment the caller doesn't own", async () => {
      vi.mocked(db.shipment.findFirst).mockResolvedValueOnce(null as any)
      const res = await createExpense({
        amount: 100,
        description: "Courier",
        shipmentId: SHIPMENT_ID,
      } as any)
      expect(res.success).toBe(false)
      expect(res.error).toBe("Shipment not found")
      expect(db.expense.create).not.toHaveBeenCalled()
    })

    it("sets userId + submittedById to the caller's id on create", async () => {
      vi.mocked(db.shipment.findFirst).mockResolvedValueOnce({ id: SHIPMENT_ID } as any)
      vi.mocked(db.expense.create).mockResolvedValueOnce({ id: "exp-1" } as any)
      await createExpense({
        amount: 250,
        description: "Tea money — port gate",
        shipmentId: SHIPMENT_ID,
      } as any)
      const call = vi.mocked(db.expense.create).mock.calls[0]?.[0] as any
      expect(call.data.userId).toBe(USER_A)
      expect(call.data.submittedById).toBe(USER_A)
      expect(call.data.status).toBe("PENDING")
      expect(call.data.amount).toBe(250)
      expect(call.data.totalAmount).toBe(250)
    })

    it("rejects non-positive amounts", async () => {
      const res = await createExpense({ amount: 0, description: "x" } as any)
      expect(res.success).toBe(false)
    })
  })

  describe("updateExpense", () => {
    it("refuses to edit a non-pending/non-draft expense", async () => {
      vi.mocked(db.expense.findFirst).mockResolvedValueOnce({
        id: EXPENSE_ID,
        status: "APPROVED",
      } as any)
      const res = await updateExpense(EXPENSE_ID, { amount: 999 })
      expect(res.success).toBe(false)
      expect(db.expense.update).not.toHaveBeenCalled()
    })

    it("strips rebinding fields (userId, status) from the update payload", async () => {
      vi.mocked(db.expense.findFirst).mockResolvedValueOnce({
        id: EXPENSE_ID,
        status: "PENDING",
      } as any)
      vi.mocked(db.expense.update).mockResolvedValueOnce({ id: EXPENSE_ID } as any)
      await updateExpense(EXPENSE_ID, {
        amount: 150,
        description: "Updated",
        // These are not keys of CreateExpenseInput, so Partial<> would reject
        // them without the cast. The action's whitelist still strips them.
        userId: "attacker",
        status: "PAID",
        submittedById: "attacker",
      } as any)
      const call = vi.mocked(db.expense.update).mock.calls[0]?.[0] as any
      expect(call.data.userId).toBeUndefined()
      expect(call.data.status).toBeUndefined()
      expect(call.data.submittedById).toBeUndefined()
      expect(call.data.amount).toBe(150)
      expect(call.data.totalAmount).toBe(150)
    })
  })

  describe("deleteExpense", () => {
    it("refuses to delete PAID expenses", async () => {
      vi.mocked(db.expense.findFirst).mockResolvedValueOnce({
        id: EXPENSE_ID,
        status: "PAID",
      } as any)
      const res = await deleteExpense(EXPENSE_ID)
      expect(res.success).toBe(false)
      expect(db.expense.delete).not.toHaveBeenCalled()
    })

    it("deletes a pending expense owned by the caller", async () => {
      vi.mocked(db.expense.findFirst).mockResolvedValueOnce({
        id: EXPENSE_ID,
        status: "PENDING",
      } as any)
      vi.mocked(db.expense.delete).mockResolvedValueOnce({ id: EXPENSE_ID } as any)
      const res = await deleteExpense(EXPENSE_ID)
      expect(res.success).toBe(true)
    })
  })

  describe("approveExpense / rejectExpense", () => {
    it("approveExpense moves PENDING → APPROVED and records approver", async () => {
      vi.mocked(db.expense.findFirst).mockResolvedValueOnce({
        id: EXPENSE_ID,
        status: "PENDING",
      } as any)
      vi.mocked(db.expense.update).mockResolvedValueOnce({ id: EXPENSE_ID } as any)
      await approveExpense(EXPENSE_ID)
      const call = vi.mocked(db.expense.update).mock.calls[0]?.[0] as any
      expect(call.data.status).toBe("APPROVED")
      expect(call.data.approvedById).toBe(USER_A)
      expect(call.data.approvedAt).toBeInstanceOf(Date)
    })

    it("rejectExpense records the reason and moves to REJECTED", async () => {
      vi.mocked(db.expense.findFirst).mockResolvedValueOnce({
        id: EXPENSE_ID,
        status: "PENDING",
      } as any)
      vi.mocked(db.expense.update).mockResolvedValueOnce({ id: EXPENSE_ID } as any)
      await rejectExpense(EXPENSE_ID, "duplicate")
      const call = vi.mocked(db.expense.update).mock.calls[0]?.[0] as any
      expect(call.data.status).toBe("REJECTED")
      expect(call.data.rejectedReason).toBe("duplicate")
    })

    it("approve refuses when the expense is not PENDING", async () => {
      vi.mocked(db.expense.findFirst).mockResolvedValueOnce({
        id: EXPENSE_ID,
        status: "APPROVED",
      } as any)
      const res = await approveExpense(EXPENSE_ID)
      expect(res.success).toBe(false)
      expect(db.expense.update).not.toHaveBeenCalled()
    })
  })

  describe("markExpenseAsPaid", () => {
    it("runs bankTransaction + expense update + bankAccount update in a transaction", async () => {
      vi.mocked(db.expense.findFirst).mockResolvedValueOnce({
        id: EXPENSE_ID,
        status: "APPROVED",
        amount: 1000,
        description: "x",
        expenseNumber: "EXP-001",
      } as any)
      vi.mocked(db.bankAccount.findFirst).mockResolvedValueOnce({
        id: "ba-1",
        currentBalance: 5000,
      } as any)
      vi.mocked(db.bankTransaction.create).mockResolvedValueOnce({ id: "bt-1" } as any)
      vi.mocked(db.expense.update).mockResolvedValueOnce({ id: EXPENSE_ID } as any)
      vi.mocked(db.bankAccount.update).mockResolvedValueOnce({ id: "ba-1" } as any)

      const res = await markExpenseAsPaid(EXPENSE_ID, "ba-1")
      expect(res.success).toBe(true)
      expect(db.$transaction).toHaveBeenCalled()
      const btCall = vi.mocked(db.bankTransaction.create).mock.calls[0]?.[0] as any
      expect(btCall.data.amount).toBe(1000)
      expect(btCall.data.balanceAfter).toBe(4000)
    })

    it("refuses when the bank account isn't owned by the caller", async () => {
      vi.mocked(db.expense.findFirst).mockResolvedValueOnce({
        id: EXPENSE_ID,
        status: "APPROVED",
        amount: 1000,
        description: "x",
        expenseNumber: "EXP-001",
      } as any)
      vi.mocked(db.bankAccount.findFirst).mockResolvedValueOnce(null as any)
      const res = await markExpenseAsPaid(EXPENSE_ID, "ba-other")
      expect(res.success).toBe(false)
      expect(db.bankTransaction.create).not.toHaveBeenCalled()
    })
  })

  describe("getExpensesByShipment", () => {
    it("scopes shipment expense list to the caller", async () => {
      vi.mocked(db.expense.findMany).mockResolvedValueOnce([] as any)
      await getExpensesByShipment(SHIPMENT_ID)
      const call = vi.mocked(db.expense.findMany).mock.calls[0]?.[0] as any
      expect(call.where).toEqual(
        expect.objectContaining({ shipmentId: SHIPMENT_ID, userId: USER_A })
      )
    })
  })
})
