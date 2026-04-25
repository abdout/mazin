/**
 * Covers the VAT arithmetic and stage→fee mapping in createStageInvoice.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({
    user: { id: "staff-1", email: "admin@abdout.sd", type: "STAFF", role: "ADMIN" },
  })),
}))
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

const shipmentFindUnique = vi.fn()
const invoiceCreate = vi.fn()
const trackingStageUpdateMany = vi.fn()

vi.mock("@/lib/db", () => ({
  db: {
    shipment: { findUnique: (args: unknown) => shipmentFindUnique(args) },
    invoice: { create: (args: unknown) => invoiceCreate(args) },
    trackingStage: { updateMany: (args: unknown) => trackingStageUpdateMany(args) },
  },
}))

import { createStageInvoice } from "@/components/platform/invoice/stage-invoice"

describe("createStageInvoice", () => {
  beforeEach(() => {
    shipmentFindUnique.mockReset()
    invoiceCreate.mockReset()
    trackingStageUpdateMany.mockReset()
    shipmentFindUnique.mockResolvedValue({
      id: "ship-1",
      clientId: "client-1",
      consignee: "Hafiz Emad",
    })
    invoiceCreate.mockResolvedValue({
      id: "inv-1",
      invoiceNumber: "1234/25",
      items: [],
      stageInvoices: [],
    })
  })

  it("computes 17% VAT on a 1,000,000 SDG port-fee invoice", async () => {
    await createStageInvoice({
      shipmentId: "ship-1",
      stage: "PORT_FEES",
      amount: 1_000_000,
    })
    const callArg = invoiceCreate.mock.calls[0]?.[0] as {
      data: Record<string, unknown> & { items: { create: Record<string, unknown> }, stageInvoices: { create: Record<string, unknown> } }
    }
    expect(callArg.data.subtotal).toBe(1_000_000)
    expect(callArg.data.tax).toBe(170_000)
    expect(callArg.data.total).toBe(1_170_000)
    expect(callArg.data.taxRate).toBe(17)
  })

  it("rejects non-billable stages", async () => {
    await expect(
      createStageInvoice({ shipmentId: "ship-1", stage: "PRE_ARRIVAL_DOCS", amount: 100 })
    ).rejects.toThrow(/does not support stage invoicing/)
  })

  it("rejects non-positive amount", async () => {
    await expect(
      createStageInvoice({ shipmentId: "ship-1", stage: "PORT_FEES", amount: 0 })
    ).rejects.toThrow(/must be positive/)
  })

  it("flags the tracking stage as payment-requested", async () => {
    await createStageInvoice({
      shipmentId: "ship-1",
      stage: "CUSTOMS_PAYMENT",
      amount: 50000,
    })
    expect(trackingStageUpdateMany).toHaveBeenCalledWith({
      where: { shipmentId: "ship-1", stageType: "CUSTOMS_PAYMENT" },
      data: { paymentRequested: true },
    })
  })

  it("maps stage to the correct fee type", async () => {
    await createStageInvoice({
      shipmentId: "ship-1",
      stage: "QUALITY_STANDARDS",
      amount: 200000,
    })
    const callArg = invoiceCreate.mock.calls[0]?.[0] as {
      data: Record<string, unknown> & { items: { create: Record<string, unknown> }, stageInvoices: { create: Record<string, unknown> } }
    }
    expect(callArg.data.items.create.feeType).toBe("SSMO")
    expect(callArg.data.stageInvoices.create.feeType).toBe("SSMO")
  })
})
