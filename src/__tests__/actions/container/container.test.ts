import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import { auth } from "@/auth"
import { db } from "@/lib/db"
import {
  createContainer,
  getContainers,
  updateContainer,
  markContainerReleased,
  deleteContainer,
  refreshDemurrageStatuses,
} from "@/actions/container"
import { makeSession, makeShipment } from "@/__tests__/helpers/factories"

const shipmentId = "ship-1"

describe("container actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(makeSession() as any)
    vi.mocked(db.shipment.findFirst).mockResolvedValue(makeShipment({ id: shipmentId }) as any)
  })

  describe("createContainer", () => {
    it("rejects when unauthenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null as any)
      await expect(
        createContainer({ shipmentId, containerNumber: "ABCD1234567", size: "TWENTY_FT" } as any)
      ).rejects.toThrow("Unauthorized")
    })

    it("rejects when shipment missing", async () => {
      vi.mocked(db.shipment.findFirst).mockResolvedValue(null)
      await expect(
        createContainer({ shipmentId, containerNumber: "ABCD1234567" } as any)
      ).rejects.toThrow("Shipment not found")
    })

    it("sets PENDING_ARRIVAL when arrivalDate is missing", async () => {
      const created = { id: "c-1", containerNumber: "ABCD1234567", status: "PENDING_ARRIVAL" }
      vi.mocked((db.container as any).create).mockResolvedValue(created as any)
      const result = await createContainer({
        shipmentId,
        containerNumber: "ABCD1234567",
      } as any)
      const callArg = vi.mocked((db.container as any).create).mock.calls[0]![0] as any
      expect(callArg.data.status).toBe("PENDING_ARRIVAL")
      expect(callArg.data.freeTimeExpiry).toBeNull()
      expect(result).toBe(created)
    })

    it("calculates DEMURRAGE status when free time expired", async () => {
      vi.mocked((db.container as any).create).mockResolvedValue({ id: "c-2" } as any)
      const arrival = new Date()
      arrival.setDate(arrival.getDate() - 30) // 30 days ago
      await createContainer({
        shipmentId,
        containerNumber: "ABCD1234567",
        arrivalDate: arrival.toISOString(),
        freeTimeDays: 14,
      } as any)
      const arg = vi.mocked((db.container as any).create).mock.calls[0]![0] as any
      expect(arg.data.status).toBe("DEMURRAGE")
      expect(arg.data.freeTimeExpiry).toBeInstanceOf(Date)
    })

    it("calculates WARNING status when nearing free time end", async () => {
      vi.mocked((db.container as any).create).mockResolvedValue({ id: "c-3" } as any)
      const arrival = new Date()
      arrival.setDate(arrival.getDate() - 12) // 12 days ago, 14 free days → 2 remaining
      await createContainer({
        shipmentId,
        containerNumber: "ABCD1234567",
        arrivalDate: arrival.toISOString(),
        freeTimeDays: 14,
      } as any)
      const arg = vi.mocked((db.container as any).create).mock.calls[0]![0] as any
      expect(arg.data.status).toBe("WARNING")
    })

    it("calculates FREE status with plenty of time left", async () => {
      vi.mocked((db.container as any).create).mockResolvedValue({ id: "c-4" } as any)
      const arrival = new Date()
      arrival.setDate(arrival.getDate() - 2)
      await createContainer({
        shipmentId,
        containerNumber: "ABCD1234567",
        arrivalDate: arrival.toISOString(),
        freeTimeDays: 14,
      } as any)
      const arg = vi.mocked((db.container as any).create).mock.calls[0]![0] as any
      expect(arg.data.status).toBe("FREE")
    })
  })

  describe("getContainers", () => {
    it("returns containers with numeric demurrage fields", async () => {
      vi.mocked((db.container as any).findMany).mockResolvedValue([
        { id: "c-1", demurrageRate: "150.50", currentDemurrage: "300" },
      ] as any)
      const result = await getContainers(shipmentId)
      expect(result[0]!.demurrageRate).toBe(150.5)
      expect(result[0]!.currentDemurrage).toBe(300)
    })
  })

  describe("updateContainer", () => {
    it("rejects when shipment owner mismatch", async () => {
      vi.mocked((db.container as any).findFirst).mockResolvedValue({
        id: "c-1",
        shipment: { userId: "someone-else" },
        arrivalDate: null,
        freeTimeDays: 14,
      } as any)
      await expect(
        updateContainer("c-1", { notes: "hi" } as any)
      ).rejects.toThrow("Container not found")
    })

    it("only sets fields that are provided", async () => {
      vi.mocked((db.container as any).findFirst).mockResolvedValue({
        id: "c-1",
        shipment: { userId: "test-user-id" },
        arrivalDate: null,
        freeTimeDays: 14,
      } as any)
      vi.mocked((db.container as any).update).mockResolvedValue({ id: "c-1" } as any)
      await updateContainer("c-1", { notes: "updated" } as any)
      const arg = vi.mocked((db.container as any).update).mock.calls[0]![0] as any
      expect(arg.data.notes).toBe("updated")
      expect(arg.data.containerNumber).toBeUndefined()
    })
  })

  describe("markContainerReleased", () => {
    it("sets status to RELEASED with releasedAt", async () => {
      vi.mocked((db.container as any).findFirst).mockResolvedValue({
        id: "c-1",
        shipment: { userId: "test-user-id" },
      } as any)
      vi.mocked((db.container as any).update).mockResolvedValue({ id: "c-1" } as any)
      await markContainerReleased("c-1", "released to carrier")
      const arg = vi.mocked((db.container as any).update).mock.calls[0]![0] as any
      expect(arg.data.status).toBe("RELEASED")
      expect(arg.data.releasedAt).toBeInstanceOf(Date)
      expect(arg.data.releaseNotes).toBe("released to carrier")
    })
  })

  describe("deleteContainer", () => {
    it("rejects when owner mismatch", async () => {
      vi.mocked((db.container as any).findFirst).mockResolvedValue({
        id: "c-1",
        shipment: { userId: "other" },
      } as any)
      await expect(deleteContainer("c-1")).rejects.toThrow("Container not found")
    })

    it("deletes when authorized", async () => {
      vi.mocked((db.container as any).findFirst).mockResolvedValue({
        id: "c-1",
        shipment: { userId: "test-user-id" },
      } as any)
      vi.mocked((db.container as any).delete).mockResolvedValue({ id: "c-1" } as any)
      await deleteContainer("c-1")
      expect((db.container as any).delete).toHaveBeenCalledWith({ where: { id: "c-1" } })
    })
  })

  describe("refreshDemurrageStatuses", () => {
    it("only updates containers whose status changed", async () => {
      const now = new Date()
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 3600 * 1000)
      const twentyDaysAgo = new Date(now.getTime() - 20 * 24 * 3600 * 1000)

      vi.mocked((db.container as any).findMany).mockResolvedValue([
        { id: "c-free", arrivalDate: twoDaysAgo, freeTimeDays: 14, status: "FREE" },
        { id: "c-bad", arrivalDate: twentyDaysAgo, freeTimeDays: 14, status: "FREE" },
      ] as any)
      vi.mocked((db.container as any).update).mockResolvedValue({} as any)

      const result = await refreshDemurrageStatuses()
      expect(result.checked).toBe(2)
      expect(result.updated).toBe(1)
      expect((db.container as any).update).toHaveBeenCalledTimes(1)
    })

    it("skips containers without arrivalDate", async () => {
      vi.mocked((db.container as any).findMany).mockResolvedValue([
        { id: "c-1", arrivalDate: null, freeTimeDays: 14, status: "FREE" },
      ] as any)
      const result = await refreshDemurrageStatuses()
      expect(result.checked).toBe(1)
      expect(result.updated).toBe(0)
    })
  })
})
