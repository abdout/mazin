import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import { auth } from "@/auth"
import { db } from "@/lib/db"
import {
  createFeeTemplate,
  deleteFeeTemplate,
  getFeeTemplate,
  listFeeTemplates,
  toggleFeeTemplate,
  updateFeeTemplate,
} from "../actions"
import { makeSession } from "@/__tests__/helpers/factories"

const USER_A = "user-a"
const TEMPLATE_ID = "cm7ftxxxxxxxxxxxxxxxxxxxx"

function validInput(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    code: "PORT_HANDLING",
    name: "Port Sudan Handling",
    feeType: "PORT_CHARGE",
    calculationType: "FIXED",
    amount: 500,
    isGovernmentFee: false,
    isTaxable: false,
    isActive: true,
    ...overrides,
  }
}

describe("fee template actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(
      makeSession({ user: { id: USER_A, role: "ADMIN", name: "A", email: "a@t" } }) as any
    )
  })

  describe("listFeeTemplates", () => {
    it("scopes findMany to session.user.id", async () => {
      vi.mocked(db.feeTemplate.findMany).mockResolvedValueOnce([] as any)
      await listFeeTemplates()
      const call = vi.mocked(db.feeTemplate.findMany).mock.calls[0]?.[0] as any
      expect(call.where.userId).toBe(USER_A)
    })
  })

  describe("getFeeTemplate", () => {
    it("uses findFirst with { id, userId }", async () => {
      vi.mocked(db.feeTemplate.findFirst).mockResolvedValueOnce({
        id: TEMPLATE_ID,
        code: "X",
        name: "X",
        nameAr: null,
        description: null,
        feeType: "OTHER",
        calculationType: "FIXED",
        amount: 0,
        percentage: null,
        minAmount: null,
        maxAmount: null,
        isGovernmentFee: false,
        isTaxable: false,
        taxRate: null,
        isActive: true,
        applicableStages: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)
      await getFeeTemplate(TEMPLATE_ID)
      const call = vi.mocked(db.feeTemplate.findFirst).mock.calls[0]?.[0] as any
      expect(call.where).toEqual({ id: TEMPLATE_ID, userId: USER_A })
    })

    it("returns not-found for cross-tenant access", async () => {
      vi.mocked(db.feeTemplate.findFirst).mockResolvedValueOnce(null as any)
      const res = await getFeeTemplate(TEMPLATE_ID)
      expect(res.success).toBe(false)
      expect(res.error).toBe("Template not found")
    })
  })

  describe("createFeeTemplate", () => {
    it("rejects FIXED templates that omit `amount`", async () => {
      const res = await createFeeTemplate(validInput({ amount: null }))
      expect(res.success).toBe(false)
      expect(db.feeTemplate.create).not.toHaveBeenCalled()
    })

    it("rejects PERCENTAGE_OF_VALUE templates that omit `percentage`", async () => {
      const res = await createFeeTemplate(
        validInput({ calculationType: "PERCENTAGE_OF_VALUE", amount: null })
      )
      expect(res.success).toBe(false)
      expect(db.feeTemplate.create).not.toHaveBeenCalled()
    })

    it("sets userId on new templates", async () => {
      vi.mocked(db.feeTemplate.create).mockResolvedValueOnce({ id: "ft-1" } as any)
      await createFeeTemplate(validInput())
      const call = vi.mocked(db.feeTemplate.create).mock.calls[0]?.[0] as any
      expect(call.data.userId).toBe(USER_A)
      expect(call.data.code).toBe("PORT_HANDLING")
      expect(call.data.amount).toBe(500)
    })

    it("scales percentage input (0-100) to decimal storage (0-1)", async () => {
      vi.mocked(db.feeTemplate.create).mockResolvedValueOnce({ id: "ft-2" } as any)
      await createFeeTemplate(
        validInput({
          calculationType: "PERCENTAGE_OF_VALUE",
          amount: null,
          percentage: 17,
        })
      )
      const call = vi.mocked(db.feeTemplate.create).mock.calls[0]?.[0] as any
      expect(call.data.percentage).toBeCloseTo(0.17)
    })

    it("rejects when maxAmount < minAmount", async () => {
      const res = await createFeeTemplate(
        validInput({ minAmount: 100, maxAmount: 50 })
      )
      expect(res.success).toBe(false)
      expect(db.feeTemplate.create).not.toHaveBeenCalled()
    })
  })

  describe("updateFeeTemplate", () => {
    it("refuses when the template isn't owned by the caller", async () => {
      vi.mocked(db.feeTemplate.findFirst).mockResolvedValueOnce(null as any)
      const res = await updateFeeTemplate(TEMPLATE_ID, validInput())
      expect(res.success).toBe(false)
      expect(db.feeTemplate.update).not.toHaveBeenCalled()
    })

    it("updates when the caller owns the template", async () => {
      vi.mocked(db.feeTemplate.findFirst).mockResolvedValueOnce({
        id: TEMPLATE_ID,
      } as any)
      vi.mocked(db.feeTemplate.update).mockResolvedValueOnce({
        id: TEMPLATE_ID,
      } as any)
      const res = await updateFeeTemplate(TEMPLATE_ID, validInput({ amount: 750 }))
      expect(res.success).toBe(true)
      const call = vi.mocked(db.feeTemplate.update).mock.calls[0]?.[0] as any
      expect(call.data.amount).toBe(750)
    })
  })

  describe("deleteFeeTemplate", () => {
    it("refuses cross-tenant deletion", async () => {
      vi.mocked(db.feeTemplate.findFirst).mockResolvedValueOnce(null as any)
      const res = await deleteFeeTemplate(TEMPLATE_ID)
      expect(res.success).toBe(false)
      expect(db.feeTemplate.delete).not.toHaveBeenCalled()
    })
  })

  describe("toggleFeeTemplate", () => {
    it("refuses cross-tenant toggle", async () => {
      vi.mocked(db.feeTemplate.findFirst).mockResolvedValueOnce(null as any)
      const res = await toggleFeeTemplate(TEMPLATE_ID, false)
      expect(res.success).toBe(false)
      expect(db.feeTemplate.update).not.toHaveBeenCalled()
    })

    it("passes the desired active state through to the update", async () => {
      vi.mocked(db.feeTemplate.findFirst).mockResolvedValueOnce({
        id: TEMPLATE_ID,
      } as any)
      vi.mocked(db.feeTemplate.update).mockResolvedValueOnce({
        id: TEMPLATE_ID,
      } as any)
      await toggleFeeTemplate(TEMPLATE_ID, false)
      const call = vi.mocked(db.feeTemplate.update).mock.calls[0]?.[0] as any
      expect(call.data.isActive).toBe(false)
    })
  })
})
