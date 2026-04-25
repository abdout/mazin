import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

const ocrMocks = vi.hoisted(() => ({
  extractCommercialInvoice: vi.fn(),
  extractBillOfLading: vi.fn(),
  extractPackingList: vi.fn(),
  extractReceipt: vi.fn(),
}))

vi.mock("@/lib/services/ocr", () => ocrMocks)

import { auth } from "@/auth"
import { db } from "@/lib/db"
import {
  extractDocumentData,
  extractAndPopulateInvoice,
  extractAndPopulateBL,
} from "@/actions/document-extraction"
import { makeSession, makeShipment } from "@/__tests__/helpers/factories"

const shipmentId = "ship-extract-1"

describe("document-extraction actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(makeSession() as any)
    vi.mocked(db.shipment.findFirst).mockResolvedValue(makeShipment({ id: shipmentId }) as any)
  })

  describe("extractDocumentData", () => {
    it("rejects without auth", async () => {
      vi.mocked(auth).mockResolvedValue(null as any)
      await expect(
        extractDocumentData(shipmentId, "file.pdf", "COMMERCIAL_INVOICE")
      ).rejects.toThrow("Unauthorized")
    })

    it("rejects when shipment missing", async () => {
      vi.mocked(db.shipment.findFirst).mockResolvedValue(null)
      await expect(
        extractDocumentData(shipmentId, "file.pdf", "COMMERCIAL_INVOICE")
      ).rejects.toThrow("Shipment not found")
    })

    it("dispatches to extractCommercialInvoice for COMMERCIAL_INVOICE", async () => {
      ocrMocks.extractCommercialInvoice.mockResolvedValue({ success: true, data: {} })
      await extractDocumentData(shipmentId, "f.pdf", "COMMERCIAL_INVOICE")
      expect(ocrMocks.extractCommercialInvoice).toHaveBeenCalledWith("f.pdf")
    })

    it("dispatches to extractBillOfLading for BILL_OF_LADING", async () => {
      ocrMocks.extractBillOfLading.mockResolvedValue({ success: true, data: {} })
      await extractDocumentData(shipmentId, "f.pdf", "BILL_OF_LADING")
      expect(ocrMocks.extractBillOfLading).toHaveBeenCalledWith("f.pdf")
    })

    it("dispatches to extractPackingList for PACKING_LIST", async () => {
      ocrMocks.extractPackingList.mockResolvedValue({ success: true, data: {} })
      await extractDocumentData(shipmentId, "f.pdf", "PACKING_LIST")
      expect(ocrMocks.extractPackingList).toHaveBeenCalled()
    })

    it("dispatches to extractReceipt for RECEIPT", async () => {
      ocrMocks.extractReceipt.mockResolvedValue({ success: true, data: {} })
      await extractDocumentData(shipmentId, "f.pdf", "RECEIPT")
      expect(ocrMocks.extractReceipt).toHaveBeenCalled()
    })
  })

  describe("extractAndPopulateInvoice", () => {
    it("returns error result when OCR fails", async () => {
      ocrMocks.extractCommercialInvoice.mockResolvedValue({
        success: false,
        error: "bad image",
      })
      const result = await extractAndPopulateInvoice(shipmentId, "f.pdf")
      expect(result.success).toBe(false)
      expect(db.shipmentDocument.upsert).not.toHaveBeenCalled()
    })

    it("upserts document with extracted data on success", async () => {
      ocrMocks.extractCommercialInvoice.mockResolvedValue({
        success: true,
        data: {
          invoiceNumber: "INV-123",
          invoiceDate: "2026-01-01",
          confidence: 0.92,
        },
      })
      vi.mocked(db.shipmentDocument.upsert).mockResolvedValue({} as any)

      const result = await extractAndPopulateInvoice(shipmentId, "file.pdf")
      expect(result.success).toBe(true)
      expect(db.shipmentDocument.upsert).toHaveBeenCalled()
      const arg = vi.mocked(db.shipmentDocument.upsert).mock.calls[0]![0] as any
      expect(arg.update.documentNo).toBe("INV-123")
      expect(arg.update.notes).toContain("92%") // rounded confidence
    })
  })

  describe("extractAndPopulateBL", () => {
    it("auto-creates containers from B/L data", async () => {
      ocrMocks.extractBillOfLading.mockResolvedValue({
        success: true,
        data: {
          blNumber: "BL-999",
          dateOfIssue: "2026-02-01",
          confidence: 0.88,
          containers: [
            { containerNumber: "MSKU1234567", size: "40HC" },
            { containerNumber: "TCLU7654321", size: "20" },
          ],
        },
      })
      vi.mocked(db.shipmentDocument.upsert).mockResolvedValue({} as any)
      vi.mocked(db.container.findFirst).mockResolvedValue(null)
      vi.mocked(db.container.create).mockResolvedValue({} as any)

      const result = await extractAndPopulateBL(shipmentId, "bl.pdf")
      expect(result.success).toBe(true)
      expect(db.container.create).toHaveBeenCalledTimes(2)

      // Check size mapping
      const firstCall = vi.mocked(db.container.create).mock.calls[0]![0] as any
      expect(firstCall.data.size).toBe("FORTY_FT_HC")
      const secondCall = vi.mocked(db.container.create).mock.calls[1]![0] as any
      expect(secondCall.data.size).toBe("TWENTY_FT")
    })

    it("skips existing containers", async () => {
      ocrMocks.extractBillOfLading.mockResolvedValue({
        success: true,
        data: {
          blNumber: "BL-1",
          confidence: 0.95,
          containers: [{ containerNumber: "MSKU1234567", size: "40" }],
        },
      })
      vi.mocked(db.shipmentDocument.upsert).mockResolvedValue({} as any)
      vi.mocked(db.container.findFirst).mockResolvedValue({ id: "existing" } as any)

      const result = await extractAndPopulateBL(shipmentId, "bl.pdf")
      expect(result.success).toBe(true)
      expect(db.container.create).not.toHaveBeenCalled()
    })

    it("returns OCR error without touching DB when failing", async () => {
      ocrMocks.extractBillOfLading.mockResolvedValue({ success: false, error: "boom" })
      const result = await extractAndPopulateBL(shipmentId, "bl.pdf")
      expect(result.success).toBe(false)
      expect(db.shipmentDocument.upsert).not.toHaveBeenCalled()
    })
  })
})
