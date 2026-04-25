import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import { auth } from "@/auth"
import { db } from "@/lib/db"
import {
  createIMForm,
  getIMForms,
  getIMForm,
  updateIMForm,
  deleteIMForm,
  checkIMFormExpiry,
} from "@/actions/im-form"
import { makeSession, makeShipment } from "@/__tests__/helpers/factories"

const shipmentId = "ship-im-1"

const validInput = {
  shipmentId,
  imNumber: "IM-2026-00001",
  bankName: "Bank of Khartoum",
  approvedAmount: 50000,
  proformaInvoiceValue: 50000,
  issueDate: "2026-01-01",
  expiryDate: "2026-06-30",
}

describe("im-form actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(makeSession() as any)
    vi.mocked(db.shipment.findFirst).mockResolvedValue(makeShipment({ id: shipmentId }) as any)
  })

  describe("createIMForm", () => {
    it("rejects when unauthenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null as any)
      await expect(createIMForm(validInput as any)).rejects.toThrow("Unauthorized")
    })

    it("rejects when shipment missing", async () => {
      vi.mocked(db.shipment.findFirst).mockResolvedValue(null)
      await expect(createIMForm(validInput as any)).rejects.toThrow("Shipment not found")
    })

    it("creates IM form with parsed dates", async () => {
      vi.mocked((db.iMForm as any).create).mockResolvedValue({ id: "imf-1" } as any)
      await createIMForm(validInput as any)
      const arg = vi.mocked((db.iMForm as any).create).mock.calls[0]![0] as any
      expect(arg.data.issueDate).toBeInstanceOf(Date)
      expect(arg.data.expiryDate).toBeInstanceOf(Date)
      expect(arg.data.createdById).toBe("test-user-id")
    })

    it("rejects invalid input (missing required fields)", async () => {
      await expect(createIMForm({ shipmentId } as any)).rejects.toThrow()
    })
  })

  describe("getIMForms", () => {
    it("coerces numeric-string fields to numbers", async () => {
      vi.mocked((db.iMForm as any).findMany).mockResolvedValue([
        {
          id: "imf-1",
          approvedAmount: "50000",
          exchangeRate: "2500",
          proformaInvoiceValue: "50000",
          commercialInvoiceValue: null,
        },
      ] as any)
      const result = await getIMForms(shipmentId)
      expect(result[0]!.approvedAmount).toBe(50000)
      expect(result[0]!.exchangeRate).toBe(2500)
      expect(result[0]!.commercialInvoiceValue).toBe(0)
    })
  })

  describe("getIMForm", () => {
    it("throws when form missing", async () => {
      vi.mocked((db.iMForm as any).findFirst).mockResolvedValue(null)
      await expect(getIMForm("imf-x")).rejects.toThrow("IM Form not found")
    })

    it("returns with coerced numeric fields", async () => {
      vi.mocked((db.iMForm as any).findFirst).mockResolvedValue({
        id: "imf-1",
        approvedAmount: "50000",
        exchangeRate: "2500",
        proformaInvoiceValue: "50000",
        commercialInvoiceValue: "52500",
        shipment: { shipmentNumber: "SHP-1", consignee: "X" },
      } as any)
      const result = await getIMForm("imf-1")
      expect(result.approvedAmount).toBe(50000)
      expect(result.commercialInvoiceValue).toBe(52500)
    })
  })

  describe("updateIMForm", () => {
    it("flags VALUE_MISMATCH when commercial/proforma variance > 5%", async () => {
      vi.mocked((db.iMForm as any).findFirst).mockResolvedValue({
        id: "imf-1",
        proformaInvoiceValue: 100000,
        commercialInvoiceValue: 100000,
        expiryDate: new Date("2099-01-01"),
      } as any)
      vi.mocked((db.iMForm as any).update).mockResolvedValue({ id: "imf-1" } as any)

      await updateIMForm("imf-1", {
        proformaInvoiceValue: 100000,
        commercialInvoiceValue: 120000,
      } as any)

      const arg = vi.mocked((db.iMForm as any).update).mock.calls[0]![0] as any
      expect(arg.data.status).toBe("VALUE_MISMATCH")
    })

    it("flags EXPIRED when expiryDate is in the past", async () => {
      vi.mocked((db.iMForm as any).findFirst).mockResolvedValue({
        id: "imf-1",
        proformaInvoiceValue: 0,
        commercialInvoiceValue: 0,
        expiryDate: new Date("2020-01-01"),
      } as any)
      vi.mocked((db.iMForm as any).update).mockResolvedValue({ id: "imf-1" } as any)

      await updateIMForm("imf-1", { notes: "ping" } as any)

      const arg = vi.mocked((db.iMForm as any).update).mock.calls[0]![0] as any
      expect(arg.data.status).toBe("EXPIRED")
    })

    it("does not flag VALUE_MISMATCH when variance <= 5%", async () => {
      vi.mocked((db.iMForm as any).findFirst).mockResolvedValue({
        id: "imf-1",
        proformaInvoiceValue: 100000,
        commercialInvoiceValue: 100000,
        expiryDate: new Date("2099-01-01"),
      } as any)
      vi.mocked((db.iMForm as any).update).mockResolvedValue({ id: "imf-1" } as any)

      await updateIMForm("imf-1", {
        proformaInvoiceValue: 100000,
        commercialInvoiceValue: 104000,
      } as any)

      const arg = vi.mocked((db.iMForm as any).update).mock.calls[0]![0] as any
      expect(arg.data.status).toBeUndefined()
    })
  })

  describe("deleteIMForm", () => {
    it("rejects when form missing", async () => {
      vi.mocked((db.iMForm as any).findFirst).mockResolvedValue(null)
      await expect(deleteIMForm("imf-x")).rejects.toThrow("IM Form not found")
    })

    it("deletes when authorized", async () => {
      vi.mocked((db.iMForm as any).findFirst).mockResolvedValue({ id: "imf-1" } as any)
      vi.mocked((db.iMForm as any).delete).mockResolvedValue({ id: "imf-1" } as any)
      await deleteIMForm("imf-1")
      expect((db.iMForm as any).delete).toHaveBeenCalledWith({ where: { id: "imf-1" } })
    })
  })

  describe("checkIMFormExpiry", () => {
    it("marks ACTIVE forms past their expiry as EXPIRED", async () => {
      vi.mocked((db.iMForm as any).updateMany).mockResolvedValue({ count: 3 } as any)
      const result = await checkIMFormExpiry()
      expect(result.expiredCount).toBe(3)
      const arg = vi.mocked((db.iMForm as any).updateMany).mock.calls[0]![0] as any
      expect(arg.data.status).toBe("EXPIRED")
    })
  })
})
