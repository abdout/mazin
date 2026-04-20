import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

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
  toPublicTrackingData: vi.fn((shipment: any) => ({
    trackingNumber: shipment.trackingNumber,
    status: shipment.status,
    stages: shipment.trackingStages,
  })),
}))

import { db } from "@/lib/db"
import { getPublicTracking, getPublicTrackingLink } from "@/actions/tracking"
import { makeShipment, makeTrackingStage } from "@/__tests__/helpers/factories"

describe("getPublicTracking", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("finds shipment by trackingNumber", async () => {
    const shipment = {
      ...makeShipment({ trackingNumber: "TRK-ABC123" }),
      trackingStages: [
        makeTrackingStage({ stageType: "PRE_ARRIVAL_DOCS", status: "COMPLETED" }),
      ],
    }
    vi.mocked(db.shipment.findUnique).mockResolvedValue(shipment as any)

    const result = await getPublicTracking("TRK-ABC123")

    expect(db.shipment.findUnique).toHaveBeenCalledWith({
      where: { trackingNumber: "TRK-ABC123" },
      include: {
        trackingStages: { orderBy: { createdAt: "asc" } },
      },
    })
    expect(result).toBeTruthy()
    expect(result!.trackingNumber).toBe("TRK-ABC123")
  })

  it("falls back to trackingSlug when trackingNumber not found", async () => {
    const shipment = {
      ...makeShipment({ trackingSlug: "my-slug" }),
      trackingStages: [
        makeTrackingStage({ stageType: "PRE_ARRIVAL_DOCS", status: "PENDING" }),
      ],
    }
    vi.mocked(db.shipment.findUnique).mockResolvedValue(null)
    vi.mocked(db.shipment.findFirst).mockResolvedValue(shipment as any)

    const result = await getPublicTracking("my-slug")

    expect(db.shipment.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { trackingNumber: "my-slug" } })
    )
    expect(db.shipment.findFirst).toHaveBeenCalledWith({
      where: { trackingSlug: "my-slug" },
      include: {
        trackingStages: { orderBy: { createdAt: "asc" } },
      },
    })
    expect(result).toBeTruthy()
  })

  it("returns null when identifier matches neither trackingNumber nor trackingSlug", async () => {
    vi.mocked(db.shipment.findUnique).mockResolvedValue(null)
    vi.mocked(db.shipment.findFirst).mockResolvedValue(null)

    const result = await getPublicTracking("NONEXISTENT")

    expect(result).toBeNull()
  })

  it("does not query by slug if trackingNumber lookup succeeds", async () => {
    const shipment = {
      ...makeShipment({ trackingNumber: "TRK-FOUND" }),
      trackingStages: [],
    }
    vi.mocked(db.shipment.findUnique).mockResolvedValue(shipment as any)

    await getPublicTracking("TRK-FOUND")

    expect(db.shipment.findFirst).not.toHaveBeenCalled()
  })
})

describe("getPublicTrackingLink", () => {
  const originalEnv = process.env.NEXT_PUBLIC_APP_URL

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_APP_URL = "https://mazin.sd"
  })

  afterEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = originalEnv
  })

  it("generates link with default locale (ar)", async () => {
    const link = await getPublicTrackingLink("TRK-123456")

    expect(link).toBe("https://mazin.sd/ar/track/TRK-123456")
  })

  it("generates link with specified locale", async () => {
    const link = await getPublicTrackingLink("TRK-123456", "en")

    expect(link).toBe("https://mazin.sd/en/track/TRK-123456")
  })

  it("falls back to default URL when env is not set", async () => {
    delete process.env.NEXT_PUBLIC_APP_URL

    const link = await getPublicTrackingLink("TRK-FALLBACK")

    expect(link).toBe("https://mazin.sd/ar/track/TRK-FALLBACK")
  })
})
