import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/utils/arabic-numbers", () => ({
  numberToArabicWords: vi.fn().mockReturnValue("mock-arabic-words"),
}))

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { createQuickInvoice } from "@/actions/invoice"
import { makeSession, makeShipment, makeInvoice, makeClient } from "@/__tests__/helpers/factories"
import { FEE_CATEGORIES, QUICK_FEE_PRESETS, VAT_RATE } from "@/components/platform/invoice/config"

describe("createQuickInvoice", () => {
  const session = makeSession()
  const client = makeClient({ id: "c1", companyName: "Acme Shipping" })
  const shipment = makeShipment({
    id: "ship-1",
    clientId: client.id,
    client,
    containerNumber: "MSKU1234567",
    vesselName: "MV Sudan Star",
    description: "Electronics",
  })

  const validInput = {
    shipmentId: shipment.id,
    preset: "BASIC_CLEARANCE" as const,
    currency: "SDG" as const,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(session as any)
    vi.mocked(db.shipment.findFirst).mockResolvedValue(shipment as any)
    vi.mocked(db.invoice.count).mockResolvedValue(5)
    vi.mocked(db.invoice.create).mockResolvedValue(makeInvoice() as any)
  })

  // ============================================
  // Authorization
  // ============================================
  it("throws Unauthorized when no session", async () => {
    vi.mocked(auth).mockResolvedValue(null as any)

    await expect(createQuickInvoice(validInput)).rejects.toThrow("Unauthorized")
  })

  it("throws Unauthorized when session has no user id", async () => {
    vi.mocked(auth).mockResolvedValue({ user: {}, expires: "" } as never)

    await expect(createQuickInvoice(validInput)).rejects.toThrow("Unauthorized")
  })

  // ============================================
  // Shipment validation
  // ============================================
  it("throws when shipment not found", async () => {
    vi.mocked(db.shipment.findFirst).mockResolvedValue(null as any)

    await expect(createQuickInvoice(validInput)).rejects.toThrow("Shipment not found")
  })

  it("queries shipment scoped to userId", async () => {
    await createQuickInvoice(validInput)

    expect(db.shipment.findFirst).toHaveBeenCalledWith({
      where: { id: shipment.id, userId: session.user.id },
      include: { client: true },
    })
  })

  // ============================================
  // Preset selection
  // ============================================
  it("uses BASIC_CLEARANCE preset categories", async () => {
    await createQuickInvoice(validInput)

    const createCall = vi.mocked(db.invoice.create).mock.calls[0]![0] as {
      data: Record<string, unknown>
    }
    const items = (createCall.data.items as { create: Array<Record<string, unknown>> }).create

    // BASIC_CLEARANCE has: CUSTOMS_DECLARATION, CUSTOMS_DUTY_RECEIPT, EXAMINATION,
    // DELIVERY_ORDER, VAT, COMMISSION
    // Zero-price items without customPrices are filtered out
    const basicCategories = QUICK_FEE_PRESETS.BASIC_CLEARANCE as string[]
    const nonZero = basicCategories.filter(
      (cat) => (FEE_CATEGORIES[cat as keyof typeof FEE_CATEGORIES]?.defaultPrice ?? 0) > 0
    )
    expect(items).toHaveLength(nonZero.length)
  })

  it("uses FULL_CLEARANCE preset when specified", async () => {
    await createQuickInvoice({ ...validInput, preset: "FULL_CLEARANCE" })

    const createCall = vi.mocked(db.invoice.create).mock.calls[0]![0] as {
      data: Record<string, unknown>
    }
    const items = (createCall.data.items as { create: Array<Record<string, unknown>> }).create

    const fullCategories = QUICK_FEE_PRESETS.FULL_CLEARANCE as string[]
    const nonZero = fullCategories.filter(
      (cat) => (FEE_CATEGORIES[cat as keyof typeof FEE_CATEGORIES]?.defaultPrice ?? 0) > 0
    )
    expect(items).toHaveLength(nonZero.length)
  })

  it("uses feeCategories when no preset provided", async () => {
    await createQuickInvoice({
      shipmentId: shipment.id,
      feeCategories: ["EXAMINATION", "TRANSPORTATION"],
      currency: "SDG",
    })

    const createCall = vi.mocked(db.invoice.create).mock.calls[0]![0] as {
      data: Record<string, unknown>
    }
    const items = (createCall.data.items as { create: Array<Record<string, unknown>> }).create
    expect(items).toHaveLength(2)
    expect(items[0]!.feeCategory).toBe("EXAMINATION")
    expect(items[1]!.feeCategory).toBe("TRANSPORTATION")
  })

  it("defaults to BASIC_CLEARANCE when neither preset nor categories given", async () => {
    await createQuickInvoice({
      shipmentId: shipment.id,
      currency: "SDG",
    })

    const createCall = vi.mocked(db.invoice.create).mock.calls[0]![0] as {
      data: Record<string, unknown>
    }
    const items = (createCall.data.items as { create: Array<Record<string, unknown>> }).create

    const basicCategories = QUICK_FEE_PRESETS.BASIC_CLEARANCE as string[]
    const nonZero = basicCategories.filter(
      (cat) => (FEE_CATEGORIES[cat as keyof typeof FEE_CATEGORIES]?.defaultPrice ?? 0) > 0
    )
    expect(items).toHaveLength(nonZero.length)
  })

  // ============================================
  // Custom prices
  // ============================================
  it("applies customPrices overriding defaults", async () => {
    await createQuickInvoice({
      shipmentId: shipment.id,
      feeCategories: ["EXAMINATION"],
      currency: "SDG",
      customPrices: { EXAMINATION: 999999 },
    })

    const createCall = vi.mocked(db.invoice.create).mock.calls[0]![0] as {
      data: Record<string, unknown>
    }
    const items = (createCall.data.items as { create: Array<Record<string, unknown>> }).create
    expect(items[0]!.unitPrice).toBe(999999)
    expect(items[0]!.total).toBe(999999)
  })

  it("includes zero-default items when customPrices gives them a truthy value", async () => {
    // CUSTOMS_DUTY_RECEIPT has defaultPrice 0 — normally filtered out
    // The filter checks: unitPrice > 0 || customPrices?.[key] (truthy)
    await createQuickInvoice({
      shipmentId: shipment.id,
      feeCategories: ["CUSTOMS_DUTY_RECEIPT"],
      currency: "SDG",
      customPrices: { CUSTOMS_DUTY_RECEIPT: 50000 },
    })

    const createCall = vi.mocked(db.invoice.create).mock.calls[0]![0] as {
      data: Record<string, unknown>
    }
    const items = (createCall.data.items as { create: Array<Record<string, unknown>> }).create
    expect(items).toHaveLength(1)
    expect(items[0]!.feeCategory).toBe("CUSTOMS_DUTY_RECEIPT")
    expect(items[0]!.unitPrice).toBe(50000)
  })

  // ============================================
  // Zero-price filtering
  // ============================================
  it("filters out zero-price items not in customPrices", async () => {
    // CUSTOMS_DUTY_RECEIPT has defaultPrice 0
    await createQuickInvoice({
      shipmentId: shipment.id,
      feeCategories: ["CUSTOMS_DUTY_RECEIPT", "EXAMINATION"],
      currency: "SDG",
    })

    const createCall = vi.mocked(db.invoice.create).mock.calls[0]![0] as {
      data: Record<string, unknown>
    }
    const items = (createCall.data.items as { create: Array<Record<string, unknown>> }).create
    // Only EXAMINATION should remain (700000 > 0), CUSTOMS_DUTY_RECEIPT is 0
    expect(items).toHaveLength(1)
    expect(items[0]!.feeCategory).toBe("EXAMINATION")
  })

  it("throws when all items have zero price", async () => {
    // VAT and CUSTOMS_DUTY_RECEIPT both have defaultPrice 0
    await expect(
      createQuickInvoice({
        shipmentId: shipment.id,
        feeCategories: ["VAT", "CUSTOMS_DUTY_RECEIPT"],
        currency: "SDG",
      })
    ).rejects.toThrow("No items with prices to invoice")
  })

  // ============================================
  // Totals calculation
  // ============================================
  it("calculates subtotal, tax, and total from non-zero items", async () => {
    await createQuickInvoice({
      shipmentId: shipment.id,
      feeCategories: ["EXAMINATION", "TRANSPORTATION"],
      currency: "SDG",
    })

    const createCall = vi.mocked(db.invoice.create).mock.calls[0]![0] as {
      data: Record<string, unknown>
    }
    // EXAMINATION=700000, TRANSPORTATION=1600000
    const expectedSubtotal = 700000 + 1600000
    const expectedTax = expectedSubtotal * VAT_RATE
    const expectedTotal = expectedSubtotal + expectedTax

    expect(createCall.data.subtotal).toBe(expectedSubtotal)
    expect(createCall.data.tax).toBeCloseTo(expectedTax)
    expect(createCall.data.total).toBeCloseTo(expectedTotal)
    expect(createCall.data.taxRate).toBe(VAT_RATE * 100)
  })

  // ============================================
  // Auto-populated fields from shipment
  // ============================================
  it("populates document references from shipment", async () => {
    await createQuickInvoice(validInput)

    const createCall = vi.mocked(db.invoice.create).mock.calls[0]![0] as {
      data: Record<string, unknown>
    }
    expect(createCall.data.containerNumbers).toEqual([shipment.containerNumber])
    expect(createCall.data.vesselName).toBe(shipment.vesselName)
    expect(createCall.data.commodityType).toBe(shipment.description)
    expect(createCall.data.supplierName).toBe(client.companyName)
  })

  it("uses shipment clientId when no clientId provided", async () => {
    await createQuickInvoice(validInput)

    const createCall = vi.mocked(db.invoice.create).mock.calls[0]![0] as {
      data: Record<string, unknown>
    }
    expect(createCall.data.clientId).toBe(shipment.clientId)
  })

  it("uses provided clientId over shipment clientId", async () => {
    await createQuickInvoice({ ...validInput, clientId: "override-client" })

    const createCall = vi.mocked(db.invoice.create).mock.calls[0]![0] as {
      data: Record<string, unknown>
    }
    expect(createCall.data.clientId).toBe("override-client")
  })

  // ============================================
  // Invoice number
  // ============================================
  it("generates invoice number from count + 1", async () => {
    vi.mocked(db.invoice.count).mockResolvedValue(99)

    await createQuickInvoice(validInput)

    const createCall = vi.mocked(db.invoice.create).mock.calls[0]![0] as {
      data: Record<string, unknown>
    }
    const year = new Date().getFullYear().toString().slice(-2)
    expect(createCall.data.invoiceNumber).toBe(`100/${year}`)
  })

  // ============================================
  // Invoice type
  // ============================================
  it("sets invoiceType to CLEARANCE", async () => {
    await createQuickInvoice(validInput)

    const createCall = vi.mocked(db.invoice.create).mock.calls[0]![0] as {
      data: Record<string, unknown>
    }
    expect(createCall.data.invoiceType).toBe("CLEARANCE")
  })

  // ============================================
  // Revalidation
  // ============================================
  it('revalidates "/invoice" path', async () => {
    await createQuickInvoice(validInput)

    expect(revalidatePath).toHaveBeenCalledWith("/invoice")
  })

  // ============================================
  // Item details
  // ============================================
  it("populates item descriptions in both languages", async () => {
    await createQuickInvoice({
      shipmentId: shipment.id,
      feeCategories: ["EXAMINATION"],
      currency: "SDG",
    })

    const createCall = vi.mocked(db.invoice.create).mock.calls[0]![0] as {
      data: Record<string, unknown>
    }
    const items = (createCall.data.items as { create: Array<Record<string, unknown>> }).create
    expect(items[0]!.description).toBe(FEE_CATEGORIES.EXAMINATION.en)
    expect(items[0]!.descriptionAr).toBe(FEE_CATEGORIES.EXAMINATION.ar)
    expect(items[0]!.tariffCode).toBe(FEE_CATEGORIES.EXAMINATION.tariffCode)
  })
})
