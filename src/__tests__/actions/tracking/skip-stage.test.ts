import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/services/notification", () => ({
  notifyShipmentMilestone: vi.fn().mockResolvedValue(undefined),
}))
vi.mock("@/lib/tracking", () => ({
  STAGE_ORDER: [
    "PRE_ARRIVAL_DOCS",
    "VESSEL_ARRIVAL",
    "CUSTOMS_DECLARATION",
    "CUSTOMS_PAYMENT",
    "INSPECTION",
    "PORT_FEES",
    "QUALITY_STANDARDS",
    "RELEASE",
    "LOADING",
    "IN_TRANSIT",
    "DELIVERED",
  ],
  generateTrackingNumber: vi.fn().mockReturnValue("TRK-ABC123"),
  calculateInitialETAs: vi.fn().mockReturnValue(new Map()),
  recalculateRemainingETAs: vi.fn().mockReturnValue(new Map()),
  toPublicTrackingData: vi.fn(),
}))

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { skipStage } from "@/actions/tracking"
import { makeSession, makeShipment } from "@/__tests__/helpers/factories"

describe("skipStage", () => {
  const session = makeSession()
  const shipmentId = "shipment-1"

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(session as any)
  })

  it("throws Unauthorized when no session", async () => {
    vi.mocked(auth).mockResolvedValue(null as any)

    await expect(skipStage(shipmentId, "INSPECTION" as any)).rejects.toThrow("Unauthorized")
  })

  it("throws Shipment not found when shipment does not exist", async () => {
    vi.mocked(db.shipment.findFirst).mockResolvedValue(null)

    await expect(skipStage(shipmentId, "INSPECTION" as any)).rejects.toThrow("Shipment not found")
  })

  it("marks the stage as SKIPPED with updatedById", async () => {
    const shipment = makeShipment({ id: shipmentId, trackingNumber: "TRK-SKIP01" })
    vi.mocked(db.shipment.findFirst).mockResolvedValue(shipment as any)
    vi.mocked(db.trackingStage.update).mockResolvedValue({} as never)

    await skipStage(shipmentId, "INSPECTION" as any)

    expect(db.trackingStage.update).toHaveBeenCalledWith({
      where: {
        shipmentId_stageType: {
          shipmentId,
          stageType: "INSPECTION",
        },
      },
      data: {
        status: "SKIPPED",
        updatedById: session.user.id,
      },
    })
  })

  it("revalidates shipment and tracking paths", async () => {
    const trackingNumber = "TRK-SKIP02"
    const shipment = makeShipment({ id: shipmentId, trackingNumber })
    vi.mocked(db.shipment.findFirst).mockResolvedValue(shipment as any)
    vi.mocked(db.trackingStage.update).mockResolvedValue({} as never)

    await skipStage(shipmentId, "PORT_FEES" as any)

    expect(revalidatePath).toHaveBeenCalledWith(`/shipments/${shipmentId}`)
    expect(revalidatePath).toHaveBeenCalledWith(`/track/${trackingNumber}`)
  })

  it("does not revalidate tracking path when trackingNumber is null", async () => {
    const shipment = makeShipment({ id: shipmentId, trackingNumber: null })
    vi.mocked(db.shipment.findFirst).mockResolvedValue(shipment as any)
    vi.mocked(db.trackingStage.update).mockResolvedValue({} as never)

    await skipStage(shipmentId, "CUSTOMS_PAYMENT" as any)

    expect(revalidatePath).toHaveBeenCalledWith(`/shipments/${shipmentId}`)
    expect(revalidatePath).toHaveBeenCalledTimes(1)
  })

  it("verifies ownership via userId in findFirst query", async () => {
    const shipment = makeShipment({ id: shipmentId })
    vi.mocked(db.shipment.findFirst).mockResolvedValue(shipment as any)
    vi.mocked(db.trackingStage.update).mockResolvedValue({} as never)

    await skipStage(shipmentId, "RELEASE" as any)

    expect(db.shipment.findFirst).toHaveBeenCalledWith({
      where: { id: shipmentId, userId: session.user.id },
    })
  })
})
