/**
 * Unit coverage of shipment actions — mocks Prisma so the state-machine and
 * authz wiring are testable without a live database.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({
    user: { id: "staff-1", email: "admin@abdout.sd", type: "STAFF", role: "ADMIN" },
  })),
}))

vi.mock("@/lib/audit", () => ({ logAudit: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

const trackingStageFindMany = vi.fn()
const trackingStageUpsert = vi.fn()
const shipmentUpdate = vi.fn()

vi.mock("@/lib/db", () => ({
  db: {
    shipment: { update: (args: unknown) => shipmentUpdate(args) },
    trackingStage: {
      findMany: (args: unknown) => trackingStageFindMany(args),
      upsert: (args: unknown) => trackingStageUpsert(args),
    },
  },
}))

import { transitionStage } from "@/components/platform/shipments/actions"

describe("transitionStage state machine", () => {
  beforeEach(() => {
    trackingStageFindMany.mockReset()
    trackingStageUpsert.mockReset()
    shipmentUpdate.mockReset()
    trackingStageUpsert.mockResolvedValue({ id: "cm123stagecm123stagecm12", stageType: "CUSTOMS_DECLARATION" })
  })

  it("allows completing PRE_ARRIVAL_DOCS (no prerequisites)", async () => {
    await transitionStage({
      shipmentId: "cm123shipcm123shipcm123sh",
      stageType: "PRE_ARRIVAL_DOCS",
      status: "COMPLETED",
    })
    expect(trackingStageFindMany).not.toHaveBeenCalled()
    expect(trackingStageUpsert).toHaveBeenCalledOnce()
  })

  it("rejects COMPLETED on CUSTOMS_PAYMENT when prerequisites unresolved", async () => {
    trackingStageFindMany.mockResolvedValue([{ stageType: "VESSEL_ARRIVAL" }])
    await expect(
      transitionStage({
        shipmentId: "cm123shipcm123shipcm123sh",
        stageType: "CUSTOMS_PAYMENT",
        status: "COMPLETED",
      })
    ).rejects.toThrow(/prerequisite stages pending/)
    expect(trackingStageUpsert).not.toHaveBeenCalled()
  })

  it("allows COMPLETED when all prerequisites are COMPLETED/SKIPPED", async () => {
    trackingStageFindMany.mockResolvedValue([])
    await transitionStage({
      shipmentId: "cm123shipcm123shipcm123sh",
      stageType: "CUSTOMS_PAYMENT",
      status: "COMPLETED",
    })
    expect(trackingStageUpsert).toHaveBeenCalledOnce()
  })

  it("rolls up shipment status to DELIVERED on final stage completion", async () => {
    trackingStageFindMany.mockResolvedValue([])
    await transitionStage({
      shipmentId: "cm123shipcm123shipcm123sh",
      stageType: "DELIVERED",
      status: "COMPLETED",
    })
    expect(shipmentUpdate).toHaveBeenCalledWith({
      where: { id: "cm123shipcm123shipcm123sh" },
      data: { status: "DELIVERED" },
    })
  })

  it("does not roll up shipment status for non-final stages", async () => {
    trackingStageFindMany.mockResolvedValue([])
    await transitionStage({
      shipmentId: "cm123shipcm123shipcm123sh",
      stageType: "PORT_FEES",
      status: "COMPLETED",
    })
    expect(shipmentUpdate).not.toHaveBeenCalled()
  })

  it("skipping does not trigger prerequisite check", async () => {
    await transitionStage({
      shipmentId: "cm123shipcm123shipcm123sh",
      stageType: "CUSTOMS_PAYMENT",
      status: "SKIPPED",
    })
    expect(trackingStageFindMany).not.toHaveBeenCalled()
  })
})
