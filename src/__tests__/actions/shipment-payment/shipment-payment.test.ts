import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import { auth } from "@/auth"
import { db } from "@/lib/db"
import {
  createShipmentPayment,
  getShipmentPayments,
  getPaymentSummary,
  updateShipmentPayment,
  markPaymentConfirmed,
  deleteShipmentPayment,
} from "@/actions/shipment-payment"
import { makeSession, makeShipment } from "@/__tests__/helpers/factories"

const shipmentId = "ship-pay-1"

describe("shipment-payment actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(makeSession() as any)
    vi.mocked(db.shipment.findFirst).mockResolvedValue(makeShipment({ id: shipmentId }) as any)
  })

  describe("createShipmentPayment", () => {
    it("rejects without auth", async () => {
      vi.mocked(auth).mockResolvedValue(null as any)
      await expect(
        createShipmentPayment({ shipmentId, payee: "CUSTOMS", amount: 1000 } as any)
      ).rejects.toThrow("Unauthorized")
    })

    it("defaults status to PENDING when no paidDate", async () => {
      vi.mocked((db.shipmentPayment as any).create).mockResolvedValue({ id: "p-1" } as any)
      await createShipmentPayment({
        shipmentId,
        payee: "CUSTOMS",
        amount: 1000,
      } as any)
      const arg = vi.mocked((db.shipmentPayment as any).create).mock.calls[0]![0] as any
      expect(arg.data.status).toBe("PENDING")
    })

    it("sets status to PAID when paidDate provided", async () => {
      vi.mocked((db.shipmentPayment as any).create).mockResolvedValue({ id: "p-1" } as any)
      await createShipmentPayment({
        shipmentId,
        payee: "CUSTOMS",
        amount: 1000,
        paidDate: "2026-04-20",
      } as any)
      const arg = vi.mocked((db.shipmentPayment as any).create).mock.calls[0]![0] as any
      expect(arg.data.status).toBe("PAID")
      expect(arg.data.paidDate).toBeInstanceOf(Date)
    })

    it("rejects unknown payee", async () => {
      await expect(
        createShipmentPayment({
          shipmentId,
          payee: "UNKNOWN",
          amount: 1000,
        } as any)
      ).rejects.toThrow()
    })

    it("rejects non-positive amounts", async () => {
      await expect(
        createShipmentPayment({ shipmentId, payee: "CUSTOMS", amount: 0 } as any)
      ).rejects.toThrow()
    })
  })

  describe("getShipmentPayments", () => {
    it("coerces amount to number", async () => {
      vi.mocked((db.shipmentPayment as any).findMany).mockResolvedValue([
        { id: "p-1", amount: "5000.25" },
      ] as any)
      const result = await getShipmentPayments(shipmentId)
      expect(result[0]!.amount).toBe(5000.25)
    })
  })

  describe("getPaymentSummary", () => {
    it("groups payments by payee and totals paid vs pending", async () => {
      vi.mocked((db.shipmentPayment as any).findMany).mockResolvedValue([
        { payee: "CUSTOMS", amount: "1000", status: "PAID" },
        { payee: "CUSTOMS", amount: "500", status: "PENDING" },
        { payee: "SEA_PORTS", amount: "200", status: "CONFIRMED" },
      ] as any)
      const result = await getPaymentSummary(shipmentId)
      expect(result.totalAmount).toBe(1700)
      expect(result.totalPaid).toBe(1200) // CUSTOMS 1000 + SEA_PORTS 200
      expect(result.totalPending).toBe(500)
      expect(result.paymentCount).toBe(3)
      expect(result.byPayee.CUSTOMS?.total).toBe(1500)
      expect(result.byPayee.CUSTOMS?.paid).toBe(1000)
      expect(result.byPayee.CUSTOMS?.pending).toBe(500)
      expect(result.byPayee.CUSTOMS?.count).toBe(2)
    })

    it("returns zero totals when no payments", async () => {
      vi.mocked((db.shipmentPayment as any).findMany).mockResolvedValue([] as any)
      const result = await getPaymentSummary(shipmentId)
      expect(result).toEqual({
        totalAmount: 0,
        totalPaid: 0,
        totalPending: 0,
        paymentCount: 0,
        byPayee: {},
      })
    })
  })

  describe("updateShipmentPayment", () => {
    it("auto-transitions PENDING to PAID when paidDate added", async () => {
      vi.mocked((db.shipmentPayment as any).findFirst).mockResolvedValue({
        id: "p-1",
        status: "PENDING",
      } as any)
      vi.mocked((db.shipmentPayment as any).update).mockResolvedValue({ id: "p-1" } as any)
      await updateShipmentPayment("p-1", { paidDate: "2026-04-20" } as any)
      const arg = vi.mocked((db.shipmentPayment as any).update).mock.calls[0]![0] as any
      expect(arg.data.status).toBe("PAID")
    })

    it("rejects when payment missing", async () => {
      vi.mocked((db.shipmentPayment as any).findFirst).mockResolvedValue(null)
      await expect(updateShipmentPayment("p-x", { amount: 1 } as any)).rejects.toThrow(
        "Payment not found"
      )
    })
  })

  describe("markPaymentConfirmed", () => {
    it("sets status=CONFIRMED and preserves existing receipt when no override", async () => {
      vi.mocked((db.shipmentPayment as any).findFirst).mockResolvedValue({
        id: "p-1",
        receiptNo: "R-ORIG",
        paidDate: new Date("2026-04-01"),
      } as any)
      vi.mocked((db.shipmentPayment as any).update).mockResolvedValue({ id: "p-1" } as any)
      await markPaymentConfirmed("p-1")
      const arg = vi.mocked((db.shipmentPayment as any).update).mock.calls[0]![0] as any
      expect(arg.data.status).toBe("CONFIRMED")
      expect(arg.data.receiptNo).toBe("R-ORIG")
      expect(arg.data.paidDate).toEqual(new Date("2026-04-01"))
    })

    it("uses new receiptNo when provided and now() when no paidDate existed", async () => {
      vi.mocked((db.shipmentPayment as any).findFirst).mockResolvedValue({
        id: "p-1",
        receiptNo: null,
        paidDate: null,
      } as any)
      vi.mocked((db.shipmentPayment as any).update).mockResolvedValue({ id: "p-1" } as any)
      await markPaymentConfirmed("p-1", "R-NEW")
      const arg = vi.mocked((db.shipmentPayment as any).update).mock.calls[0]![0] as any
      expect(arg.data.receiptNo).toBe("R-NEW")
      expect(arg.data.paidDate).toBeInstanceOf(Date)
    })
  })

  describe("deleteShipmentPayment", () => {
    it("rejects when payment missing", async () => {
      vi.mocked((db.shipmentPayment as any).findFirst).mockResolvedValue(null)
      await expect(deleteShipmentPayment("p-x")).rejects.toThrow("Payment not found")
    })

    it("deletes when authorized", async () => {
      vi.mocked((db.shipmentPayment as any).findFirst).mockResolvedValue({ id: "p-1" } as any)
      vi.mocked((db.shipmentPayment as any).delete).mockResolvedValue({ id: "p-1" } as any)
      await deleteShipmentPayment("p-1")
      expect((db.shipmentPayment as any).delete).toHaveBeenCalledWith({ where: { id: "p-1" } })
    })
  })
})
