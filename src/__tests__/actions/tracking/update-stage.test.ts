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
import { updateTrackingStage } from "@/actions/tracking"
import { makeSession, makeShipment, makeTrackingStage } from "@/__tests__/helpers/factories"

describe("updateTrackingStage", () => {
  const session = makeSession()
  const shipmentId = "shipment-update-1"

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(session as any)
  })

  it("throws Unauthorized when no session", async () => {
    vi.mocked(auth).mockResolvedValue(null as any)

    await expect(
      updateTrackingStage({
        shipmentId,
        stageType: "VESSEL_ARRIVAL",
        status: "IN_PROGRESS",
      })
    ).rejects.toThrow("Unauthorized")
  })

  it("throws when shipment not found", async () => {
    vi.mocked(db.shipment.findFirst).mockResolvedValue(null)

    await expect(
      updateTrackingStage({
        shipmentId,
        stageType: "VESSEL_ARRIVAL",
        status: "IN_PROGRESS",
      })
    ).rejects.toThrow("Shipment not found")
  })

  it("updates stage status and notes", async () => {
    const shipment = {
      ...makeShipment({ id: shipmentId, trackingNumber: "TRK-UPD1", clientId: null }),
      trackingStages: [
        makeTrackingStage({ shipmentId, stageType: "VESSEL_ARRIVAL", status: "PENDING" }),
      ],
    }
    vi.mocked(db.shipment.findFirst).mockResolvedValue(shipment as any)
    vi.mocked(db.trackingStage.update).mockResolvedValue(
      makeTrackingStage({ shipmentId, stageType: "VESSEL_ARRIVAL", status: "IN_PROGRESS" }) as any
     )

    await updateTrackingStage({
      shipmentId,
      stageType: "VESSEL_ARRIVAL",
      status: "IN_PROGRESS",
      notes: "Vessel docked at pier 3",
    })

    expect(db.trackingStage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          shipmentId_stageType: { shipmentId, stageType: "VESSEL_ARRIVAL" },
        },
        data: expect.objectContaining({
          status: "IN_PROGRESS",
          notes: "Vessel docked at pier 3",
          updatedById: session.user.id,
        }),
      })
    )
  })

  it("sets startedAt when status is IN_PROGRESS", async () => {
    const shipment = {
      ...makeShipment({ id: shipmentId, trackingNumber: "TRK-INPROG", clientId: null }),
      trackingStages: [
        makeTrackingStage({ shipmentId, stageType: "CUSTOMS_DECLARATION", status: "PENDING" }),
      ],
    }
    vi.mocked(db.shipment.findFirst).mockResolvedValue(shipment as any)
    vi.mocked(db.trackingStage.update).mockResolvedValue(
      makeTrackingStage({ status: "IN_PROGRESS" }) as any
     )

    await updateTrackingStage({
      shipmentId,
      stageType: "CUSTOMS_DECLARATION",
      status: "IN_PROGRESS",
    })

    const updateCall = vi.mocked(db.trackingStage.update).mock.calls[0]![0] as {
      data: Record<string, unknown>
    }
    expect(updateCall.data.startedAt).toBeInstanceOf(Date)
    expect(updateCall.data.completedAt).toBeUndefined()
  })

  it("sets completedAt when status is COMPLETED", async () => {
    const shipment = {
      ...makeShipment({ id: shipmentId, trackingNumber: "TRK-COMP", clientId: null }),
      trackingStages: [
        makeTrackingStage({ shipmentId, stageType: "INSPECTION", status: "IN_PROGRESS" }),
      ],
    }
    vi.mocked(db.shipment.findFirst).mockResolvedValue(shipment as any)
    vi.mocked(db.trackingStage.update).mockResolvedValue(
      makeTrackingStage({ status: "COMPLETED" }) as any
     )

    await updateTrackingStage({
      shipmentId,
      stageType: "INSPECTION",
      status: "COMPLETED",
    })

    const updateCall = vi.mocked(db.trackingStage.update).mock.calls[0]![0] as {
      data: Record<string, unknown>
    }
    expect(updateCall.data.completedAt).toBeInstanceOf(Date)
    expect(updateCall.data.startedAt).toBeUndefined()
  })

  it("sets estimatedAt when provided", async () => {
    const estimatedAt = new Date("2026-07-01")
    const shipment = {
      ...makeShipment({ id: shipmentId, trackingNumber: "TRK-EST", clientId: null }),
      trackingStages: [
        makeTrackingStage({ shipmentId, stageType: "PORT_FEES", status: "PENDING" }),
      ],
    }
    vi.mocked(db.shipment.findFirst).mockResolvedValue(shipment as any)
    vi.mocked(db.trackingStage.update).mockResolvedValue(
      makeTrackingStage({ status: "PENDING" }) as any
     )

    await updateTrackingStage({
      shipmentId,
      stageType: "PORT_FEES",
      status: "PENDING",
      estimatedAt,
    })

    const updateCall = vi.mocked(db.trackingStage.update).mock.calls[0]![0] as {
      data: Record<string, unknown>
    }
    expect(updateCall.data.estimatedAt).toEqual(estimatedAt)
  })

  it("revalidates both shipment and tracking paths", async () => {
    const trackingNumber = "TRK-REVAL2"
    const shipment = {
      ...makeShipment({ id: shipmentId, trackingNumber, clientId: null }),
      trackingStages: [
        makeTrackingStage({ shipmentId, stageType: "RELEASE", status: "PENDING" }),
      ],
    }
    vi.mocked(db.shipment.findFirst).mockResolvedValue(shipment as any)
    vi.mocked(db.trackingStage.update).mockResolvedValue(
      makeTrackingStage({ status: "IN_PROGRESS" }) as any
     )

    await updateTrackingStage({
      shipmentId,
      stageType: "RELEASE",
      status: "IN_PROGRESS",
    })

    expect(revalidatePath).toHaveBeenCalledWith(`/shipments/${shipmentId}`)
    expect(revalidatePath).toHaveBeenCalledWith(`/track/${trackingNumber}`)
  })

  it("recalculates remaining ETAs when stage is completed", async () => {
    const { recalculateRemainingETAs } = await import("@/lib/tracking")
    const stages = [
      makeTrackingStage({ shipmentId, stageType: "CUSTOMS_PAYMENT", status: "IN_PROGRESS" }),
      makeTrackingStage({ shipmentId, stageType: "INSPECTION", status: "PENDING" }),
    ]
    const shipment = {
      ...makeShipment({ id: shipmentId, trackingNumber: "TRK-RECALC", clientId: null }),
      trackingStages: stages,
    }
    vi.mocked(db.shipment.findFirst).mockResolvedValue(shipment as any)
    vi.mocked(db.trackingStage.update).mockResolvedValue(
      makeTrackingStage({ status: "COMPLETED" }) as any
     )

    await updateTrackingStage({
      shipmentId,
      stageType: "CUSTOMS_PAYMENT",
      status: "COMPLETED",
    })

    expect(recalculateRemainingETAs).toHaveBeenCalledWith(stages, "CUSTOMS_PAYMENT")
  })
})
