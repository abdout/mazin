import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/auth", () => ({ auth: vi.fn() }))

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { getShipmentProfit, getClientProfit } from "@/actions/profit"

describe("getShipmentProfit", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never)
  })

  it("computes revenue, cost, margin, and percent", async () => {
    vi.mocked(db.shipment.findFirst).mockResolvedValue({ id: "ship-1" } as never)
    // Two agent fee lines totaling 1,500,000 (SDG).
    vi.mocked(db.invoiceItem.findMany).mockResolvedValue([
      { total: 1_000_000, invoice: { currency: "SDG" } },
      { total: 500_000, invoice: { currency: "SDG" } },
    ] as never)
    // Pass-through payments to other payees totaling 800,000.
    vi.mocked(db.shipmentPayment.findMany).mockResolvedValue([
      { amount: 300_000, currency: "SDG" },
      { amount: 500_000, currency: "SDG" },
    ] as never)
    // Customs payments totaling 200,000.
    vi.mocked(db.customsPayment.findMany).mockResolvedValue([
      { amount: 200_000 },
    ] as never)

    const result = await getShipmentProfit("ship-1")

    expect(result.revenue).toBe(1_500_000)
    expect(result.cost).toBe(1_000_000) // 800k pass-through + 200k customs
    expect(result.margin).toBe(500_000)
    expect(result.marginPercent).toBeCloseTo((500_000 / 1_500_000) * 100, 5)
    expect(result.breakdown.agentFees).toBe(1_500_000)
    expect(result.breakdown.passThroughPayments).toBe(800_000)
    expect(result.breakdown.customsPayments).toBe(200_000)
  })

  it("returns 0% margin when revenue is zero (avoids divide-by-zero)", async () => {
    vi.mocked(db.shipment.findFirst).mockResolvedValue({ id: "ship-1" } as never)
    vi.mocked(db.invoiceItem.findMany).mockResolvedValue([] as never)
    vi.mocked(db.shipmentPayment.findMany).mockResolvedValue([] as never)
    vi.mocked(db.customsPayment.findMany).mockResolvedValue([] as never)

    const result = await getShipmentProfit("ship-1")
    expect(result.revenue).toBe(0)
    expect(result.marginPercent).toBe(0)
  })

  it("rejects when session is missing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never)
    await expect(getShipmentProfit("ship-1")).rejects.toThrow("Unauthorized")
  })

  it("rejects when shipment is not found", async () => {
    vi.mocked(db.shipment.findFirst).mockResolvedValue(null)
    await expect(getShipmentProfit("missing")).rejects.toThrow("Shipment not found")
  })
})

describe("getClientProfit", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never)
  })

  it("aggregates per-shipment profit and computes totals", async () => {
    vi.mocked(db.shipment.findMany).mockResolvedValue([
      { id: "s1", shipmentNumber: "SH-1", createdAt: new Date() },
      { id: "s2", shipmentNumber: "SH-2", createdAt: new Date() },
    ] as never)
    vi.mocked(db.shipment.findFirst).mockImplementation(
      ({ where }: any) => Promise.resolve({ id: where.id }) as never
    )
    // Each shipment: revenue=1000, cost=600 → margin=400.
    vi.mocked(db.invoiceItem.findMany).mockResolvedValue([
      { total: 1000, invoice: { currency: "SDG" } },
    ] as never)
    vi.mocked(db.shipmentPayment.findMany).mockResolvedValue([
      { amount: 600, currency: "SDG" },
    ] as never)
    vi.mocked(db.customsPayment.findMany).mockResolvedValue([] as never)

    const result = await getClientProfit("client-1")

    expect(result.shipmentCount).toBe(2)
    expect(result.totalRevenue).toBe(2000)
    expect(result.totalCost).toBe(1200)
    expect(result.totalMargin).toBe(800)
    expect(result.avgMarginPercent).toBeCloseTo(40, 5)
    expect(result.perShipment).toHaveLength(2)
  })
})
