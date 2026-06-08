import { describe, it, expect, vi, beforeEach } from "vitest"

import { db } from "@/lib/db"
import {
  recordShipmentEvent,
  listShipmentEvents,
  listOrgActivity,
} from "@/lib/services/shipment-events"

describe("recordShipmentEvent", () => {
  beforeEach(() => vi.clearAllMocks())

  it("inserts a row with the supplied fields", async () => {
    vi.mocked(db.shipmentEvent.create).mockResolvedValue({} as never)

    await recordShipmentEvent({
      shipmentId: "ship-1",
      actorId: "user-1",
      kind: "PAYMENT_RECORDED",
      summary: "Payment to CUSTOMS: 100 SDG",
      summaryAr: "دفعة إلى الجمارك: 100 SDG",
      metadata: { amount: 100 },
    })

    expect(db.shipmentEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        shipmentId: "ship-1",
        actorId: "user-1",
        kind: "PAYMENT_RECORDED",
        summary: "Payment to CUSTOMS: 100 SDG",
      }),
    })
  })

  it("swallows DB failures so non-critical feed writes never break callers", async () => {
    vi.mocked(db.shipmentEvent.create).mockRejectedValue(new Error("DB down"))

    // Must not throw — caller (a stage advance, payment record…) should keep going.
    await expect(
      recordShipmentEvent({
        shipmentId: "ship-2",
        kind: "STAGE_ADVANCED",
        summary: "x",
      })
    ).resolves.toBeUndefined()
  })
})

describe("listShipmentEvents", () => {
  beforeEach(() => vi.clearAllMocks())

  it("queries by shipmentId, newest first, default take 50", async () => {
    vi.mocked(db.shipmentEvent.findMany).mockResolvedValue([])
    await listShipmentEvents("ship-1")

    expect(db.shipmentEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { shipmentId: "ship-1" },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
    )
  })

  it("uses cursor pagination when provided", async () => {
    vi.mocked(db.shipmentEvent.findMany).mockResolvedValue([])
    await listShipmentEvents("ship-1", { cursor: "evt-99", take: 10 })

    expect(db.shipmentEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        cursor: { id: "evt-99" },
        skip: 1,
        take: 10,
      })
    )
  })
})

describe("listOrgActivity", () => {
  beforeEach(() => vi.clearAllMocks())

  it("filters by actor + kinds + since when supplied", async () => {
    vi.mocked(db.shipmentEvent.findMany).mockResolvedValue([])
    const since = new Date("2026-01-01")

    await listOrgActivity({ actorId: "u-1", kinds: ["STAGE_ADVANCED"], since })

    expect(db.shipmentEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          actorId: "u-1",
          kind: { in: ["STAGE_ADVANCED"] },
          createdAt: { gte: since },
        },
      })
    )
  })
})
