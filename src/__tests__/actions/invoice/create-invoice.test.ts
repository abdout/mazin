import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/utils/arabic-numbers", () => ({
  numberToArabicWords: vi.fn().mockReturnValue("mock-arabic-words"),
}))

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { createInvoice } from "@/actions/invoice"
import { makeSession, makeInvoice } from "@/__tests__/helpers/factories"

describe("createInvoice", () => {
  const session = makeSession()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(session as any)
  })

  it("throws Unauthorized when auth returns null", async () => {
    vi.mocked(auth).mockResolvedValue(null as any)

    await expect(
      createInvoice({
        currency: "SDG",
        items: [{ description: "Test", quantity: 1, unitPrice: 1000 }],
      })
    ).rejects.toThrow("Unauthorized")
  })

  it("creates invoice with correct calculated totals", async () => {
    const mockResult = makeInvoice()
    vi.mocked(db.invoice.count).mockResolvedValue(5)
    vi.mocked(db.invoice.create).mockResolvedValue(mockResult as any)

    await createInvoice({
      currency: "SDG",
      items: [
        { description: "Fee A", quantity: 2, unitPrice: 500 },
        { description: "Fee B", quantity: 1, unitPrice: 1000 },
      ],
    })

    // subtotal = 2*500 + 1*1000 = 2000
    // tax = 2000 * 0.17 = 340
    // total = 2000 + 340 = 2340
    const createCall = vi.mocked(db.invoice.create).mock.calls[0]![0] as {
      data: Record<string, unknown>
    }
    expect(createCall.data.subtotal).toBe(2000)
    expect(createCall.data.tax).toBe(340)
    expect(createCall.data.total).toBe(2340)
    expect(createCall.data.taxRate).toBe(17)
  })

  it("generates invoice number via formatInvoiceNumber", async () => {
    vi.mocked(db.invoice.count).mockResolvedValue(9)
    vi.mocked(db.invoice.create).mockResolvedValue(makeInvoice() as any)

    await createInvoice({
      currency: "SDG",
      items: [{ description: "Test", quantity: 1, unitPrice: 100 }],
    })

    const createCall = vi.mocked(db.invoice.create).mock.calls[0]![0] as {
      data: Record<string, unknown>
    }
    const year = new Date().getFullYear().toString().slice(-2)
    // count=9 → sequence = 10
    expect(createCall.data.invoiceNumber).toBe(`10/${year}`)
  })

  it("creates with all provided fields and items", async () => {
    vi.mocked(db.invoice.count).mockResolvedValue(0)
    vi.mocked(db.invoice.create).mockResolvedValue(makeInvoice() as any)

    await createInvoice({
      currency: "USD",
      invoiceType: "PROFORMA",
      shipmentId: "ship-1",
      clientId: "client-1",
      dueDate: "2026-06-01",
      notes: "Urgent shipment",
      blNumber: "BL-123",
      containerNumbers: ["CONT-1", "CONT-2"],
      deliveryOrderNo: "DO-456",
      declarationNo: "DEC-789",
      vesselName: "MV Test",
      voyageNumber: "V001",
      commodityType: "Electronics",
      supplierName: "Acme Corp",
      items: [
        {
          description: "Customs Declaration",
          descriptionAr: "شهادة جمركية",
          quantity: 1,
          unitPrice: 500000,
          feeCategory: "CUSTOMS_DECLARATION",
          tariffCode: "H9/1",
          receiptNumber: "R-001",
          sortOrder: 0,
        },
      ],
    })

    const createCall = vi.mocked(db.invoice.create).mock.calls[0]![0] as {
      data: Record<string, unknown>
    }
    expect(createCall.data.userId).toBe("test-user-id")
    expect(createCall.data.shipmentId).toBe("ship-1")
    expect(createCall.data.clientId).toBe("client-1")
    expect(createCall.data.currency).toBe("USD")
    expect(createCall.data.invoiceType).toBe("PROFORMA")
    expect(createCall.data.notes).toBe("Urgent shipment")
    expect(createCall.data.blNumber).toBe("BL-123")
    expect(createCall.data.containerNumbers).toEqual(["CONT-1", "CONT-2"])
    expect(createCall.data.deliveryOrderNo).toBe("DO-456")
    expect(createCall.data.declarationNo).toBe("DEC-789")
    expect(createCall.data.vesselName).toBe("MV Test")
    expect(createCall.data.voyageNumber).toBe("V001")
    expect(createCall.data.commodityType).toBe("Electronics")
    expect(createCall.data.supplierName).toBe("Acme Corp")

    const items = (createCall.data.items as { create: Array<Record<string, unknown>> }).create
    expect(items).toHaveLength(1)
    expect(items[0]!.description).toBe("Customs Declaration")
    expect(items[0]!.descriptionAr).toBe("شهادة جمركية")
    expect(items[0]!.quantity).toBe(1)
    expect(items[0]!.unitPrice).toBe(500000)
    expect(items[0]!.total).toBe(500000)
    expect(items[0]!.feeCategory).toBe("CUSTOMS_DECLARATION")
    expect(items[0]!.tariffCode).toBe("H9/1")
    expect(items[0]!.receiptNumber).toBe("R-001")
    expect(items[0]!.sortOrder).toBe(0)
  })

  it('calls revalidatePath("/invoice")', async () => {
    vi.mocked(db.invoice.count).mockResolvedValue(0)
    vi.mocked(db.invoice.create).mockResolvedValue(makeInvoice() as any)

    await createInvoice({
      currency: "SDG",
      items: [{ description: "Test", quantity: 1, unitPrice: 100 }],
    })

    expect(revalidatePath).toHaveBeenCalledWith("/invoice")
  })
})
