import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import { auth } from "@/auth"
import { db } from "@/lib/db"
import {
  initializeDocumentChecklist,
  upsertShipmentDocument,
  verifyDocument,
  getDocumentChecklist,
  deleteShipmentDocument,
} from "@/actions/shipment-document"
import { makeSession, makeShipment } from "@/__tests__/helpers/factories"

const shipmentId = "ship-doc-1"

describe("shipment-document actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(makeSession() as any)
    vi.mocked(db.shipment.findFirst).mockResolvedValue(makeShipment({ id: shipmentId }) as any)
  })

  describe("initializeDocumentChecklist", () => {
    it("creates only missing mandatory docs", async () => {
      vi.mocked((db.shipmentDocument as any).findMany).mockResolvedValue([
        { docType: "BILL_OF_LADING" },
        { docType: "COMMERCIAL_INVOICE" },
      ] as any)
      vi.mocked((db.shipmentDocument as any).createMany).mockResolvedValue({ count: 3 } as any)

      const result = await initializeDocumentChecklist(shipmentId)
      expect(result.initialized).toBe(3) // 5 mandatory - 2 existing = 3 to create
      const arg = vi.mocked((db.shipmentDocument as any).createMany).mock.calls[0]![0] as any
      const types = arg.data.map((d: any) => d.docType)
      expect(types).toContain("PACKING_LIST")
      expect(types).toContain("CERTIFICATE_OF_ORIGIN")
      expect(types).toContain("IM_FORM")
      expect(types).not.toContain("BILL_OF_LADING")
    })

    it("does nothing when all mandatory docs exist", async () => {
      const all = [
        "BILL_OF_LADING",
        "COMMERCIAL_INVOICE",
        "PACKING_LIST",
        "CERTIFICATE_OF_ORIGIN",
        "IM_FORM",
      ]
      vi.mocked((db.shipmentDocument as any).findMany).mockResolvedValue(
        all.map((docType) => ({ docType })) as any
      )
      const result = await initializeDocumentChecklist(shipmentId)
      expect(result.initialized).toBe(0)
      expect((db.shipmentDocument as any).createMany).not.toHaveBeenCalled()
    })
  })

  describe("upsertShipmentDocument", () => {
    it("passes ISO date strings to Date", async () => {
      vi.mocked((db.shipmentDocument as any).upsert).mockResolvedValue({ id: "d-1" } as any)
      await upsertShipmentDocument({
        shipmentId,
        docType: "BILL_OF_LADING",
        issueDate: "2026-01-01",
        expiryDate: "2026-12-31",
      } as any)
      const arg = vi.mocked((db.shipmentDocument as any).upsert).mock.calls[0]![0] as any
      expect(arg.create.issueDate).toBeInstanceOf(Date)
      expect(arg.create.expiryDate).toBeInstanceOf(Date)
    })

    it("rejects unknown docType", async () => {
      await expect(
        upsertShipmentDocument({ shipmentId, docType: "UNKNOWN" } as any)
      ).rejects.toThrow()
    })
  })

  describe("verifyDocument", () => {
    it("rejects when doc not found", async () => {
      vi.mocked((db.shipmentDocument as any).findFirst).mockResolvedValue(null)
      await expect(verifyDocument("d-x")).rejects.toThrow("Document not found")
    })

    it("sets status=VERIFIED, verifiedAt, verifiedBy", async () => {
      vi.mocked((db.shipmentDocument as any).findFirst).mockResolvedValue({ id: "d-1" } as any)
      vi.mocked((db.shipmentDocument as any).update).mockResolvedValue({ id: "d-1" } as any)
      await verifyDocument("d-1")
      const arg = vi.mocked((db.shipmentDocument as any).update).mock.calls[0]![0] as any
      expect(arg.data.status).toBe("VERIFIED")
      expect(arg.data.verifiedAt).toBeInstanceOf(Date)
      expect(arg.data.verifiedBy).toBe("test-user-id")
    })
  })

  describe("getDocumentChecklist", () => {
    it("summarizes ready/missing counts and mandatory completion", async () => {
      vi.mocked((db.shipmentDocument as any).findMany).mockResolvedValue([
        { docType: "BILL_OF_LADING", status: "VERIFIED", documentNo: "BL-1" },
        { docType: "COMMERCIAL_INVOICE", status: "UPLOADED", documentNo: "CI-1" },
        { docType: "PACKING_LIST", status: "MISSING", documentNo: null },
        { docType: "CERTIFICATE_OF_ORIGIN", status: "MISSING", documentNo: null },
        { docType: "IM_FORM", status: "MISSING", documentNo: null },
        { docType: "INSURANCE_CERTIFICATE", status: "UPLOADED", documentNo: "INS-1" }, // non-mandatory
      ] as any)
      const result = await getDocumentChecklist(shipmentId)
      expect(result.summary.mandatoryTotal).toBe(5)
      expect(result.summary.mandatoryReady).toBe(2)
      expect(result.summary.canProceedToDeclaration).toBe(false)
      // Non-mandatory doc should be flagged ready
      const insurance = result.documents.find((d) => d.docType === "INSURANCE_CERTIFICATE")
      expect(insurance?.isReady).toBe(true)
      expect(insurance?.isMandatory).toBe(false)
    })

    it("reports canProceedToDeclaration=true when all mandatory are ready", async () => {
      const ready = [
        { docType: "BILL_OF_LADING", status: "VERIFIED", documentNo: null },
        { docType: "COMMERCIAL_INVOICE", status: "VERIFIED", documentNo: null },
        { docType: "PACKING_LIST", status: "VERIFIED", documentNo: null },
        { docType: "CERTIFICATE_OF_ORIGIN", status: "UPLOADED", documentNo: null },
        { docType: "IM_FORM", status: "UPLOADED", documentNo: null },
      ]
      vi.mocked((db.shipmentDocument as any).findMany).mockResolvedValue(ready as any)
      const result = await getDocumentChecklist(shipmentId)
      expect(result.summary.canProceedToDeclaration).toBe(true)
      expect(result.summary.mandatoryReady).toBe(5)
    })
  })

  describe("deleteShipmentDocument", () => {
    it("rejects when missing", async () => {
      vi.mocked((db.shipmentDocument as any).findFirst).mockResolvedValue(null)
      await expect(deleteShipmentDocument("d-x")).rejects.toThrow("Document not found")
    })

    it("deletes when authorized", async () => {
      vi.mocked((db.shipmentDocument as any).findFirst).mockResolvedValue({ id: "d-1" } as any)
      vi.mocked((db.shipmentDocument as any).delete).mockResolvedValue({ id: "d-1" } as any)
      await deleteShipmentDocument("d-1")
      expect((db.shipmentDocument as any).delete).toHaveBeenCalled()
    })
  })
})
