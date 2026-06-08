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
import { advanceToNextStage } from "@/actions/tracking"
import { makeSession, makeShipment, makeTrackingStage } from "@/__tests__/helpers/factories"

describe("advanceToNextStage", () => {
  const session = makeSession()
  const shipmentId = "shipment-1"

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(session as any)
    // Document checklist gate is now enforced — by default, no docs returned
    // means the gate has nothing to gate against (only CUSTOMS_DECLARATION,
    // RELEASE require docs, and these tests advance through VESSEL_ARRIVAL etc).
    vi.mocked(db.shipmentDocument.findMany).mockResolvedValue([] as never)
    vi.mocked(db.container.updateMany).mockResolvedValue({ count: 0 } as never)
    vi.mocked(db.shipmentEvent.create).mockResolvedValue({} as never)
  })

  it("throws Unauthorized when no session", async () => {
    vi.mocked(auth).mockResolvedValue(null as any)

    await expect(advanceToNextStage(shipmentId)).rejects.toThrow("Unauthorized")
  })

  it("throws Shipment not found when shipment does not exist", async () => {
    vi.mocked(db.shipment.findFirst).mockResolvedValue(null)

    await expect(advanceToNextStage(shipmentId)).rejects.toThrow("Shipment not found")
  })

  it("throws when no stage is IN_PROGRESS", async () => {
    vi.mocked(db.shipment.findFirst).mockResolvedValue({
      ...makeShipment({ id: shipmentId } as any),
      trackingStages: [
        makeTrackingStage({ shipmentId, stageType: "PRE_ARRIVAL_DOCS", status: "COMPLETED" }),
        makeTrackingStage({ shipmentId, stageType: "VESSEL_ARRIVAL", status: "PENDING" }),
      ],
    } as any)

    await expect(advanceToNextStage(shipmentId)).rejects.toThrow("No stage in progress")
  })

  it("completes current IN_PROGRESS stage and starts next stage", async () => {
    vi.mocked(db.shipment.findFirst).mockResolvedValue({
      ...makeShipment({ id: shipmentId, trackingNumber: "TRK-XYZ999", clientId: "client-1" } as any),
      trackingStages: [
        makeTrackingStage({ shipmentId, stageType: "PRE_ARRIVAL_DOCS", status: "COMPLETED" }),
        makeTrackingStage({ shipmentId, stageType: "VESSEL_ARRIVAL", status: "IN_PROGRESS" }),
        makeTrackingStage({ shipmentId, stageType: "CUSTOMS_DECLARATION", status: "PENDING" }),
      ],
    } as any)
    vi.mocked(db.trackingStage.update).mockResolvedValue({} as never)
    vi.mocked(db.shipment.update).mockResolvedValue({} as never)
    // CUSTOMS_DECLARATION is gated on a verified document checklist; seed all
    // mandatory docs as VERIFIED so the gate passes for this advance test.
    vi.mocked(db.shipmentDocument.findMany).mockResolvedValue([
      { docType: "BILL_OF_LADING", status: "VERIFIED" },
      { docType: "COMMERCIAL_INVOICE", status: "VERIFIED" },
      { docType: "PACKING_LIST", status: "VERIFIED" },
      { docType: "IM_FORM", status: "VERIFIED" },
      { docType: "ACD_CERTIFICATE", status: "VERIFIED" },
    ] as never)

    const result = await advanceToNextStage(shipmentId)

    expect(result.completedStage).toBe("VESSEL_ARRIVAL")
    expect(result.nextStage).toBe("CUSTOMS_DECLARATION")

    // First update: complete current stage
    expect(db.trackingStage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          shipmentId_stageType: { shipmentId, stageType: "VESSEL_ARRIVAL" },
        },
        data: expect.objectContaining({
          status: "COMPLETED",
          completedAt: expect.any(Date),
          updatedById: session.user.id,
        }),
      })
    )

    // Second update: start next stage
    expect(db.trackingStage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          shipmentId_stageType: { shipmentId, stageType: "CUSTOMS_DECLARATION" },
        },
        data: expect.objectContaining({
          status: "IN_PROGRESS",
          startedAt: expect.any(Date),
          updatedById: session.user.id,
        }),
      })
    )
  })

  it("marks shipment as DELIVERED when last stage (DELIVERED) is completed", async () => {
    vi.mocked(db.shipment.findFirst).mockResolvedValue({
      ...makeShipment({ id: shipmentId, trackingNumber: "TRK-XYZ999", clientId: "client-1" } as any),
      trackingStages: [
        makeTrackingStage({ shipmentId, stageType: "IN_TRANSIT", status: "COMPLETED" }),
        makeTrackingStage({ shipmentId, stageType: "DELIVERED", status: "IN_PROGRESS" }),
      ],
    } as any)
    vi.mocked(db.trackingStage.update).mockResolvedValue({} as never)
    vi.mocked(db.shipment.update).mockResolvedValue({} as never)

    const result = await advanceToNextStage(shipmentId)

    expect(result.completedStage).toBe("DELIVERED")
    expect(result.nextStage).toBeUndefined()

    // Shipment status should be set to DELIVERED
    expect(db.shipment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: shipmentId },
        data: { status: "DELIVERED" },
      })
    )
  })

  it("revalidates shipment and tracking paths", async () => {
    const trackingNumber = "TRK-REVALID"
    vi.mocked(db.shipment.findFirst).mockResolvedValue({
      ...makeShipment({ id: shipmentId, trackingNumber, clientId: null } as any),
      trackingStages: [
        makeTrackingStage({ shipmentId, stageType: "PRE_ARRIVAL_DOCS", status: "IN_PROGRESS" }),
        makeTrackingStage({ shipmentId, stageType: "VESSEL_ARRIVAL", status: "PENDING" }),
      ],
    } as any)
    vi.mocked(db.trackingStage.update).mockResolvedValue({} as never)
    vi.mocked(db.shipment.update).mockResolvedValue({} as never)

    await advanceToNextStage(shipmentId)

    expect(revalidatePath).toHaveBeenCalledWith(`/shipments/${shipmentId}`)
    expect(revalidatePath).toHaveBeenCalledWith(`/track/${trackingNumber}`)
  })
})
