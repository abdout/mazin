import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { calculateDemurrage, getDemurrageAlerts, setDemurrageParams } from "@/actions/demurrage"
import { makeSession, makeShipment } from "@/__tests__/helpers/factories"

describe("Demurrage Actions", () => {
  const session = makeSession()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(session as any)
  })

  // ============================================
  // calculateDemurrage
  // ============================================
  describe("calculateDemurrage", () => {
    it("throws Unauthorized when no session", async () => {
      vi.mocked(auth).mockResolvedValue(null as any)

      await expect(calculateDemurrage("ship-1")).rejects.toThrow("Unauthorized")
    })

    it("throws when shipment not found", async () => {
      vi.mocked(db.shipment.findFirst).mockResolvedValue(null)

      await expect(calculateDemurrage("ship-nonexistent")).rejects.toThrow("Shipment not found")
    })

    it("throws when demurrageStartDate is not set", async () => {
      vi.mocked(db.shipment.findFirst).mockResolvedValue({
        id: "ship-1",
        shipmentNumber: "SHP-001",
        freeDays: 14,
        demurrageDailyRate: 500,
        demurrageStartDate: null,
      } as any)

      await expect(calculateDemurrage("ship-1")).rejects.toThrow(
        "Demurrage start date is not set for this shipment"
      )
    })

    it("returns 0 demurrage when within free days", async () => {
      // Start date 5 days ago, 14 free days => 9 free days remaining, no charges
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      vi.mocked(db.shipment.findFirst).mockResolvedValue({
        id: "ship-1",
        shipmentNumber: "SHP-001",
        freeDays: 14,
        demurrageDailyRate: 500,
        demurrageStartDate: fiveDaysAgo,
      } as any)

      const result = await calculateDemurrage("ship-1")

      expect(result.isOverdue).toBe(false)
      expect(result.demurrageAmount).toBe(0)
      expect(result.freeDaysRemaining).toBeGreaterThan(0)
      expect(result.daysOverdue).toBe(0)
      expect(result.currency).toBe("SDG")
    })

    it("calculates correct demurrage when overdue", async () => {
      // Start date 20 days ago, 14 free days => 6 days overdue at 500/day = 3000
      const twentyDaysAgo = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
      vi.mocked(db.shipment.findFirst).mockResolvedValue({
        id: "ship-1",
        shipmentNumber: "SHP-001",
        freeDays: 14,
        demurrageDailyRate: 500,
        demurrageStartDate: twentyDaysAgo,
      } as any)

      const result = await calculateDemurrage("ship-1")

      expect(result.isOverdue).toBe(true)
      expect(result.daysElapsed).toBe(20)
      expect(result.freeDays).toBe(14)
      expect(result.daysOverdue).toBe(6)
      expect(result.dailyRate).toBe(500)
      expect(result.demurrageAmount).toBe(3000)
      expect(result.freeDaysRemaining).toBe(0)
      expect(result.shipmentId).toBe("ship-1")
      expect(result.shipmentNumber).toBe("SHP-001")
    })

    it("defaults to 14 free days when freeDays is null", async () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      vi.mocked(db.shipment.findFirst).mockResolvedValue({
        id: "ship-1",
        shipmentNumber: "SHP-001",
        freeDays: null,
        demurrageDailyRate: 100,
        demurrageStartDate: tenDaysAgo,
      } as any)

      const result = await calculateDemurrage("ship-1")

      expect(result.freeDays).toBe(14)
      expect(result.isOverdue).toBe(false)
    })
  })

  // ============================================
  // getDemurrageAlerts
  // ============================================
  describe("getDemurrageAlerts", () => {
    it("throws Unauthorized when no session", async () => {
      vi.mocked(auth).mockResolvedValue(null as any)

      await expect(getDemurrageAlerts()).rejects.toThrow("Unauthorized")
    })

    it("returns shipments nearing free day limit", async () => {
      // Shipment with 1 free day remaining (13 days elapsed, 14 free days)
      const thirteenDaysAgo = new Date(Date.now() - 13 * 24 * 60 * 60 * 1000)
      vi.mocked(db.shipment.findMany).mockResolvedValue([
        {
          id: "ship-alert",
          shipmentNumber: "SHP-ALERT",
          trackingNumber: "TRK-ALERT",
          freeDays: 14,
          demurrageDailyRate: 500,
          demurrageStartDate: thirteenDaysAgo,
          client: { companyName: "Test Co", contactName: "John" },
        },
      ] as any)

      const result = await getDemurrageAlerts()

      expect(result).toHaveLength(1)
      expect(result[0]!.shipmentId).toBe("ship-alert")
      expect(result[0]!.urgency).toBe("warning")
      expect(result[0]!.freeDaysRemaining).toBeLessThanOrEqual(1)
      expect(result[0]!.clientName).toBe("Test Co")
    })

    it("returns critical alert for already-overdue shipments", async () => {
      const twentyDaysAgo = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
      vi.mocked(db.shipment.findMany).mockResolvedValue([
        {
          id: "ship-overdue",
          shipmentNumber: "SHP-OVERDUE",
          trackingNumber: "TRK-OVERDUE",
          freeDays: 14,
          demurrageDailyRate: 500,
          demurrageStartDate: twentyDaysAgo,
          client: { companyName: "Overdue Corp", contactName: null },
        },
      ] as any)

      const result = await getDemurrageAlerts()

      expect(result).toHaveLength(1)
      expect(result[0]!.urgency).toBe("critical")
      expect(result[0]!.freeDaysRemaining).toBe(0)
    })

    it("returns empty array when no shipments are near limit", async () => {
      // Shipment started 2 days ago, 14 free days => 12 remaining, not alertable
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      vi.mocked(db.shipment.findMany).mockResolvedValue([
        {
          id: "ship-fine",
          shipmentNumber: "SHP-FINE",
          trackingNumber: null,
          freeDays: 14,
          demurrageDailyRate: 100,
          demurrageStartDate: twoDaysAgo,
          client: null,
        },
      ] as any)

      const result = await getDemurrageAlerts()

      expect(result).toHaveLength(0)
    })

    it("sorts by urgency: critical first, then warning, then approaching", async () => {
      const now = Date.now()
      vi.mocked(db.shipment.findMany).mockResolvedValue([
        {
          id: "approaching",
          shipmentNumber: "SHP-A",
          trackingNumber: null,
          freeDays: 14,
          demurrageDailyRate: 100,
          demurrageStartDate: new Date(now - 12 * 24 * 60 * 60 * 1000), // 2 days remaining
          client: null,
        },
        {
          id: "critical",
          shipmentNumber: "SHP-C",
          trackingNumber: null,
          freeDays: 14,
          demurrageDailyRate: 100,
          demurrageStartDate: new Date(now - 20 * 24 * 60 * 60 * 1000), // overdue
          client: null,
        },
        {
          id: "warning",
          shipmentNumber: "SHP-W",
          trackingNumber: null,
          freeDays: 14,
          demurrageDailyRate: 100,
          demurrageStartDate: new Date(now - 13 * 24 * 60 * 60 * 1000), // 1 day remaining
          client: null,
        },
      ] as any)

      const result = await getDemurrageAlerts()

      expect(result[0]!.urgency).toBe("critical")
      expect(result[1]!.urgency).toBe("warning")
      expect(result[2]!.urgency).toBe("approaching")
    })
  })

  // ============================================
  // setDemurrageParams
  // ============================================
  describe("setDemurrageParams", () => {
    it("throws Unauthorized when no session", async () => {
      vi.mocked(auth).mockResolvedValue(null as any)

      await expect(setDemurrageParams("ship-1", { freeDays: 10 })).rejects.toThrow("Unauthorized")
    })

    it("throws when shipment not found", async () => {
      vi.mocked(db.shipment.findFirst).mockResolvedValue(null)

      await expect(setDemurrageParams("ship-nonexistent", { freeDays: 10 })).rejects.toThrow(
        "Shipment not found or access denied"
      )
    })

    it("updates shipment demurrage params", async () => {
      vi.mocked(db.shipment.findFirst).mockResolvedValue(makeShipment({ id: "ship-1" }) as any)
      vi.mocked(db.shipment.update).mockResolvedValue(
        makeShipment({ id: "ship-1", freeDays: 21, demurrageDailyRate: 750 }) as any
      )

      await setDemurrageParams("ship-1", {
        freeDays: 21,
        demurrageDailyRate: 750,
      })

      expect(db.shipment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "ship-1" },
          data: expect.objectContaining({
            freeDays: 21,
            demurrageDailyRate: 750,
          }),
        })
      )
    })

    it("updates demurrageStartDate when provided", async () => {
      vi.mocked(db.shipment.findFirst).mockResolvedValue(makeShipment({ id: "ship-1" }) as any)
      vi.mocked(db.shipment.update).mockResolvedValue(makeShipment({ id: "ship-1" }) as any)

      await setDemurrageParams("ship-1", {
        demurrageStartDate: "2026-06-01",
      })

      const updateCall = vi.mocked(db.shipment.update).mock.calls[0]![0] as {
        data: Record<string, unknown>
      }
      expect(updateCall.data.demurrageStartDate).toBeInstanceOf(Date)
    })

    it("revalidates shipments, specific shipment, and dashboard paths", async () => {
      vi.mocked(db.shipment.findFirst).mockResolvedValue(makeShipment({ id: "ship-1" }) as any)
      vi.mocked(db.shipment.update).mockResolvedValue(makeShipment({ id: "ship-1" }) as any)

      await setDemurrageParams("ship-1", { freeDays: 10 })

      expect(revalidatePath).toHaveBeenCalledWith("/shipments")
      expect(revalidatePath).toHaveBeenCalledWith("/shipments/ship-1")
      expect(revalidatePath).toHaveBeenCalledWith("/dashboard")
    })
  })
})
