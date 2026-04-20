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
  generateTrackingNumber: vi.fn().mockReturnValue("TRK-NEW123"),
  calculateInitialETAs: vi.fn().mockReturnValue(new Map()),
  recalculateRemainingETAs: vi.fn().mockReturnValue(new Map()),
  toPublicTrackingData: vi.fn(),
}))

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { initializeTrackingStages } from "@/actions/tracking"
import { generateTrackingNumber, calculateInitialETAs } from "@/lib/tracking"
import { makeSession, makeShipment } from "@/__tests__/helpers/factories"

describe("initializeTrackingStages", () => {
  const session = makeSession()
  const shipmentId = "shipment-init-1"

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(session as any)
  })

  it("throws Unauthorized when no session", async () => {
    vi.mocked(auth).mockResolvedValue(null as any)

    await expect(initializeTrackingStages(shipmentId)).rejects.toThrow("Unauthorized")
  })

  it("throws when shipment not found", async () => {
    vi.mocked(db.shipment.findFirst).mockResolvedValue(null)

    await expect(initializeTrackingStages(shipmentId)).rejects.toThrow("Shipment not found")
  })

  it("creates all 11 tracking stages via createMany", async () => {
    const shipment = makeShipment({ id: shipmentId, trackingNumber: null, arrivalDate: null })
    vi.mocked(db.shipment.findFirst).mockResolvedValue(shipment as any)
    vi.mocked(db.shipment.update).mockResolvedValue(shipment as any)
    vi.mocked(db.trackingStage.createMany).mockResolvedValue({ count: 11 })

    const result = await initializeTrackingStages(shipmentId)

    expect(db.trackingStage.createMany).toHaveBeenCalledTimes(1)

    const createCall = vi.mocked(db.trackingStage.createMany).mock.calls[0]![0] as {
      data: Array<Record<string, unknown>>
    }
    expect(createCall.data).toHaveLength(11)
    expect(result.stagesCreated).toBe(11)
  })

  it("sets first stage (PRE_ARRIVAL_DOCS) as IN_PROGRESS with startedAt", async () => {
    const shipment = makeShipment({ id: shipmentId, trackingNumber: "TRK-EXIST", arrivalDate: null })
    vi.mocked(db.shipment.findFirst).mockResolvedValue(shipment as any)
    vi.mocked(db.trackingStage.createMany).mockResolvedValue({ count: 11 })

    await initializeTrackingStages(shipmentId)

    const createCall = vi.mocked(db.trackingStage.createMany).mock.calls[0]![0] as {
      data: Array<Record<string, unknown>>
    }
    const firstStage = createCall.data[0]!
    expect(firstStage!.stageType).toBe("PRE_ARRIVAL_DOCS")
    expect(firstStage!.status).toBe("IN_PROGRESS")
    expect(firstStage!.startedAt).toBeInstanceOf(Date)
  })

  it("sets remaining stages as PENDING with null startedAt", async () => {
    const shipment = makeShipment({ id: shipmentId, trackingNumber: "TRK-EXIST", arrivalDate: null })
    vi.mocked(db.shipment.findFirst).mockResolvedValue(shipment as any)
    vi.mocked(db.trackingStage.createMany).mockResolvedValue({ count: 11 })

    await initializeTrackingStages(shipmentId)

    const createCall = vi.mocked(db.trackingStage.createMany).mock.calls[0]![0] as {
      data: Array<Record<string, unknown>>
    }
    for (let i = 1; i < createCall.data.length; i++) {
      expect(createCall.data[i]!.status).toBe("PENDING")
      expect(createCall.data[i]!.startedAt).toBeNull()
    }
  })

  it("generates tracking number when shipment has none", async () => {
    const shipment = makeShipment({ id: shipmentId, trackingNumber: null, arrivalDate: null })
    vi.mocked(db.shipment.findFirst).mockResolvedValue(shipment as any)
    vi.mocked(db.shipment.update).mockResolvedValue(shipment as any)
    vi.mocked(db.trackingStage.createMany).mockResolvedValue({ count: 11 })

    const result = await initializeTrackingStages(shipmentId)

    expect(generateTrackingNumber).toHaveBeenCalled()
    expect(db.shipment.update).toHaveBeenCalledWith({
      where: { id: shipmentId },
      data: { trackingNumber: "TRK-NEW123" },
    })
    expect(result.trackingNumber).toBe("TRK-NEW123")
  })

  it("does not generate tracking number when shipment already has one", async () => {
    const existingTrackingNumber = "TRK-ALREADYHAS"
    const shipment = makeShipment({ id: shipmentId, trackingNumber: existingTrackingNumber, arrivalDate: null })
    vi.mocked(db.shipment.findFirst).mockResolvedValue(shipment as any)
    vi.mocked(db.trackingStage.createMany).mockResolvedValue({ count: 11 })

    const result = await initializeTrackingStages(shipmentId)

    expect(db.shipment.update).not.toHaveBeenCalled()
    expect(result.trackingNumber).toBe(existingTrackingNumber)
  })

  it("calculates initial ETAs when arrivalDate is set", async () => {
    const arrivalDate = new Date("2026-06-01")
    const shipment = makeShipment({ id: shipmentId, trackingNumber: "TRK-ETA", arrivalDate })
    vi.mocked(db.shipment.findFirst).mockResolvedValue(shipment as any)
    vi.mocked(db.trackingStage.createMany).mockResolvedValue({ count: 11 })

    await initializeTrackingStages(shipmentId)

    expect(calculateInitialETAs).toHaveBeenCalledWith(arrivalDate)
  })

  it("revalidates correct paths", async () => {
    const trackingNumber = "TRK-REVAL"
    const shipment = makeShipment({ id: shipmentId, trackingNumber, arrivalDate: null })
    vi.mocked(db.shipment.findFirst).mockResolvedValue(shipment as any)
    vi.mocked(db.trackingStage.createMany).mockResolvedValue({ count: 11 })

    await initializeTrackingStages(shipmentId)

    expect(revalidatePath).toHaveBeenCalledWith(`/shipments/${shipmentId}`)
    expect(revalidatePath).toHaveBeenCalledWith(`/track/${trackingNumber}`)
  })
})
