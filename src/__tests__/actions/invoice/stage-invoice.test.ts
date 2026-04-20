import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { createStageInvoice } from "@/actions/invoice"
import {
  makeSession,
  makeShipment,
  makeTrackingStage,
  makeInvoice,
} from "@/__tests__/helpers/factories"

describe("createStageInvoice", () => {
  const session = makeSession()
  const shipment = makeShipment({ client: { id: "c1", companyName: "Acme" }, project: null })
  const stage = makeTrackingStage({ id: "stage-1", shipmentId: shipment.id })

  const validInput = {
    shipmentId: shipment.id,
    stageId: stage.id,
    stageType: "INSPECTION" as const,
    currency: "SDG" as const,
    locale: "ar" as const,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(session as any)
    vi.mocked(db.shipment.findFirst).mockResolvedValue(shipment as any)
    vi.mocked(db.trackingStage.findFirst).mockResolvedValue(stage as any)
    vi.mocked(db.invoice.count).mockResolvedValue(5)
    // $transaction passes through to the callback with db
    vi.mocked(db.invoice.create).mockResolvedValue(makeInvoice() as any)
    vi.mocked(db.stageInvoice.create).mockResolvedValue({} as any)
    vi.mocked(db.trackingStage.update).mockResolvedValue({} as any)
  })

  // ============================================
  // Authorization
  // ============================================
  it("throws Unauthorized when no session", async () => {
    vi.mocked(auth).mockResolvedValue(null as any)

    await expect(createStageInvoice(validInput)).rejects.toThrow("Unauthorized")
  })

  it("throws Unauthorized when session has no user id", async () => {
    vi.mocked(auth).mockResolvedValue({ user: {}, expires: "" } as never)

    await expect(createStageInvoice(validInput)).rejects.toThrow("Unauthorized")
  })

  // ============================================
  // Shipment & Stage validation
  // ============================================
  it("throws when shipment not found", async () => {
    vi.mocked(db.shipment.findFirst).mockResolvedValue(null as any)

    await expect(createStageInvoice(validInput)).rejects.toThrow("Shipment not found")
  })

  it("throws when stage not found", async () => {
    vi.mocked(db.trackingStage.findFirst).mockResolvedValue(null as any)

    await expect(createStageInvoice(validInput)).rejects.toThrow("Stage not found")
  })

  it("queries shipment scoped to userId", async () => {
    await createStageInvoice(validInput)

    expect(db.shipment.findFirst).toHaveBeenCalledWith({
      where: { id: shipment.id, userId: session.user.id },
      include: { client: true, project: true },
    })
  })

  it("queries stage scoped to shipmentId", async () => {
    await createStageInvoice(validInput)

    expect(db.trackingStage.findFirst).toHaveBeenCalledWith({
      where: { id: stage.id, shipmentId: shipment.id },
    })
  })

  // ============================================
  // Fee template application
  // ============================================
  it("uses STAGE_FEE_TEMPLATES when no items provided (Arabic locale)", async () => {
    await createStageInvoice(validInput)

    // INSPECTION templates have 2 items: Examination + Customs Laboratory
    const createCall = vi.mocked(db.invoice.create).mock.calls[0]![0] as {
      data: Record<string, unknown>
    }
    const items = (createCall.data.items as { create: Array<Record<string, unknown>> }).create
    expect(items).toHaveLength(2)
    // Arabic locale → uses descriptionAr from templates
    expect(items[0]!.description).toBe("الكشف عن الطرد")
    expect(items[1]!.description).toBe("معمل الجمارك")
  })

  it("uses English descriptions when locale is en", async () => {
    await createStageInvoice({ ...validInput, locale: "en" })

    const createCall = vi.mocked(db.invoice.create).mock.calls[0]![0] as {
      data: Record<string, unknown>
    }
    const items = (createCall.data.items as { create: Array<Record<string, unknown>> }).create
    expect(items[0]!.description).toBe("Examination")
    expect(items[1]!.description).toBe("Customs Laboratory")
  })

  it("uses provided items instead of templates", async () => {
    const customItems = [
      { description: "Custom Fee", quantity: 3, unitPrice: 200 },
    ]

    await createStageInvoice({ ...validInput, items: customItems })

    const createCall = vi.mocked(db.invoice.create).mock.calls[0]![0] as {
      data: Record<string, unknown>
    }
    const items = (createCall.data.items as { create: Array<Record<string, unknown>> }).create
    expect(items).toHaveLength(1)
    expect(items[0]!.description).toBe("Custom Fee")
    expect(items[0]!.quantity).toBe(3)
    expect(items[0]!.unitPrice).toBe(200)
    expect(items[0]!.total).toBe(600)
  })

  it("throws when stage has no templates and no items provided", async () => {
    // VESSEL_ARRIVAL has empty templates
    await expect(
      createStageInvoice({ ...validInput, stageType: "VESSEL_ARRIVAL" })
    ).rejects.toThrow("No items provided and no templates available for this stage")
  })

  // ============================================
  // Totals calculation
  // ============================================
  it("calculates subtotal, tax (17%), and total correctly", async () => {
    // INSPECTION: Examination=700000, Lab=100000 → subtotal=800000
    await createStageInvoice(validInput)

    const createCall = vi.mocked(db.invoice.create).mock.calls[0]![0] as {
      data: Record<string, unknown>
    }
    expect(createCall.data.subtotal).toBe(800000)
    expect(createCall.data.tax).toBeCloseTo(800000 * 0.17)
    expect(createCall.data.total).toBeCloseTo(800000 + 800000 * 0.17)
  })

  // ============================================
  // Transaction handling
  // ============================================
  it("uses $transaction for atomicity", async () => {
    await createStageInvoice(validInput)

    expect(db.$transaction).toHaveBeenCalledTimes(1)
    expect(db.$transaction).toHaveBeenCalledWith(expect.any(Function))
  })

  it("creates stageInvoice link within transaction", async () => {
    await createStageInvoice(validInput)

    expect(db.stageInvoice.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        shipmentId: shipment.id,
        stage: "INSPECTION",
        feeType: "INSPECTION",
      }),
    })
  })

  it("marks stage paymentRequested within transaction", async () => {
    await createStageInvoice(validInput)

    expect(db.trackingStage.update).toHaveBeenCalledWith({
      where: { id: stage.id },
      data: { paymentRequested: true },
    })
  })

  // ============================================
  // Invoice number generation
  // ============================================
  it("generates invoice number from count + 1", async () => {
    vi.mocked(db.invoice.count).mockResolvedValue(9)

    await createStageInvoice(validInput)

    const createCall = vi.mocked(db.invoice.create).mock.calls[0]![0] as {
      data: Record<string, unknown>
    }
    const year = new Date().getFullYear().toString().slice(-2)
    expect(createCall.data.invoiceNumber).toBe(`10/${year}`)
  })

  // ============================================
  // Revalidation
  // ============================================
  it("revalidates invoice, shipment, and project paths", async () => {
    await createStageInvoice(validInput)

    expect(revalidatePath).toHaveBeenCalledWith("/invoice")
    expect(revalidatePath).toHaveBeenCalledWith("/shipment")
    expect(revalidatePath).toHaveBeenCalledWith("/project")
  })

  // ============================================
  // Notes
  // ============================================
  it("sets notes with stage type label", async () => {
    await createStageInvoice(validInput)

    const createCall = vi.mocked(db.invoice.create).mock.calls[0]![0] as {
      data: Record<string, unknown>
    }
    expect(createCall.data.notes).toBe("Invoice for INSPECTION stage")
  })

  // ============================================
  // Client from shipment
  // ============================================
  it("sets clientId from shipment", async () => {
    await createStageInvoice(validInput)

    const createCall = vi.mocked(db.invoice.create).mock.calls[0]![0] as {
      data: Record<string, unknown>
    }
    expect(createCall.data.clientId).toBe(shipment.clientId)
  })
})
