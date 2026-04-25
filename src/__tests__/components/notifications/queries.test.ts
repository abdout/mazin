import { describe, it, expect, vi, beforeEach } from "vitest"

import { db } from "@/lib/db"
import {
  toNotificationDTO,
  getNotificationsList,
  getUnreadCount,
  getRecentNotifications,
  getPreferencesForUser,
  getPreferencesForClient,
  mergeWithRoleDefaults,
  mergeWithClientDefaults,
} from "@/components/platform/notifications/queries"
import { makeNotification } from "@/__tests__/helpers/factories"

describe("notifications/queries", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("toNotificationDTO", () => {
    it("serializes dates to ISO strings", () => {
      const row = makeNotification({
        createdAt: new Date("2026-04-20T10:00:00Z"),
        updatedAt: new Date("2026-04-20T11:00:00Z"),
        sentAt: new Date("2026-04-20T10:05:00Z"),
        readAt: null,
      })
      const dto = toNotificationDTO(row as any)
      expect(dto.createdAt).toBe("2026-04-20T10:00:00.000Z")
      expect(dto.updatedAt).toBe("2026-04-20T11:00:00.000Z")
      expect(dto.sentAt).toBe("2026-04-20T10:05:00.000Z")
      expect(dto.readAt).toBeNull()
    })

    it("normalizes metadata — object stays, array/null/primitives become null", () => {
      const base = makeNotification()
      expect(
        toNotificationDTO({ ...base, metadata: { foo: "bar" } } as any).metadata
      ).toEqual({ foo: "bar" })
      expect(
        toNotificationDTO({ ...base, metadata: [1, 2, 3] } as any).metadata
      ).toBeNull()
      expect(
        toNotificationDTO({ ...base, metadata: null } as any).metadata
      ).toBeNull()
    })
  })

  describe("getNotificationsList", () => {
    it("caps limit at 100 and returns unreadCount", async () => {
      vi.mocked(db.notification.findMany).mockResolvedValue(
        Array.from({ length: 5 }, () => makeNotification()) as any
      )
      vi.mocked(db.notification.count).mockResolvedValue(3)

      const result = await getNotificationsList("u1", { limit: 200 })
      expect(result.unreadCount).toBe(3)
      expect(result.items).toHaveLength(5)
      expect(result.nextCursor).toBeNull()

      const findArg = vi.mocked(db.notification.findMany).mock.calls[0]![0] as any
      expect(findArg.take).toBe(101) // capped to 100 + 1
    })

    it("emits nextCursor when more rows available", async () => {
      const rows = Array.from({ length: 21 }, (_, i) =>
        makeNotification({ id: `n-${i}` })
      )
      vi.mocked(db.notification.findMany).mockResolvedValue(rows as any)
      vi.mocked(db.notification.count).mockResolvedValue(0)

      const result = await getNotificationsList("u1", { limit: 20 })
      expect(result.items).toHaveLength(20)
      expect(result.nextCursor).toBe("n-19")
    })

    it("applies filter=unread by restricting to readAt=null", async () => {
      vi.mocked(db.notification.findMany).mockResolvedValue([])
      vi.mocked(db.notification.count).mockResolvedValue(0)

      await getNotificationsList("u1", { filter: "unread" })
      const where = (vi.mocked(db.notification.findMany).mock.calls[0]![0] as any).where
      expect(where.readAt).toBeNull()
    })

    it("filters by type when provided", async () => {
      vi.mocked(db.notification.findMany).mockResolvedValue([])
      vi.mocked(db.notification.count).mockResolvedValue(0)

      await getNotificationsList("u1", { type: "PAYMENT_OVERDUE" })
      const where = (vi.mocked(db.notification.findMany).mock.calls[0]![0] as any).where
      expect(where.type).toBe("PAYMENT_OVERDUE")
    })

    it("uses cursor with skip=1", async () => {
      vi.mocked(db.notification.findMany).mockResolvedValue([])
      vi.mocked(db.notification.count).mockResolvedValue(0)

      await getNotificationsList("u1", { cursor: "c-1" })
      const arg = vi.mocked(db.notification.findMany).mock.calls[0]![0] as any
      expect(arg.skip).toBe(1)
      expect(arg.cursor).toEqual({ id: "c-1" })
    })
  })

  describe("getUnreadCount", () => {
    it("counts only unread, non-failed notifications", async () => {
      vi.mocked(db.notification.count).mockResolvedValue(12)
      const n = await getUnreadCount("u1")
      expect(n).toBe(12)
      const arg = vi.mocked(db.notification.count).mock.calls[0]![0] as any
      expect(arg.where.readAt).toBeNull()
      expect(arg.where.status).toEqual({ not: "FAILED" })
    })
  })

  describe("getRecentNotifications", () => {
    it("orders by createdAt desc and takes N", async () => {
      vi.mocked(db.notification.findMany).mockResolvedValue([makeNotification()] as any)
      await getRecentNotifications("u1", 10)
      const arg = vi.mocked(db.notification.findMany).mock.calls[0]![0] as any
      expect(arg.take).toBe(10)
      expect(arg.orderBy).toEqual({ createdAt: "desc" })
    })
  })

  describe("getPreferencesForUser", () => {
    it("returns a synthetic DTO using ADMIN defaults when no row", async () => {
      vi.mocked(db.notificationPreference.findUnique).mockResolvedValue(null)
      const result = await getPreferencesForUser("u1", "ADMIN")
      expect(result?.id).toBe("")
      expect(result?.preferences.TASK_ASSIGNED).toContain("IN_APP")
      expect(result?.preferences.TASK_ASSIGNED).toContain("EMAIL")
    })

    it("falls back to USER when unknown role", async () => {
      vi.mocked(db.notificationPreference.findUnique).mockResolvedValue(null)
      const result = await getPreferencesForUser("u1", "WEIRD_ROLE")
      // USER defaults to IN_APP only
      expect(result?.preferences.TASK_ASSIGNED).toEqual(["IN_APP"])
    })

    it("serializes a real row when present", async () => {
      const row = {
        id: "p1",
        userId: "u1",
        clientId: null,
        preferences: { TASK_ASSIGNED: ["IN_APP", "EMAIL"] },
        whatsappNumber: "+1234",
        whatsappVerified: true,
        quietHoursStart: 22,
        quietHoursEnd: 8,
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-02-01"),
      }
      vi.mocked(db.notificationPreference.findUnique).mockResolvedValue(row as any)
      const result = await getPreferencesForUser("u1")
      expect(result?.preferences.TASK_ASSIGNED).toEqual(["IN_APP", "EMAIL"])
      expect(result?.whatsappNumber).toBe("+1234")
    })
  })

  describe("getPreferencesForClient", () => {
    it("returns client defaults when no row", async () => {
      vi.mocked(db.notificationPreference.findUnique).mockResolvedValue(null)
      const result = await getPreferencesForClient("c1")
      expect(result?.preferences.SHIPMENT_ARRIVAL).toContain("WHATSAPP")
    })
  })

  describe("mergeWithRoleDefaults", () => {
    it("fills missing entries from role defaults", () => {
      const merged = mergeWithRoleDefaults({ TASK_ASSIGNED: ["EMAIL"] }, "ADMIN")
      expect(merged.TASK_ASSIGNED).toEqual(["EMAIL"])
      // STAGE_COMPLETED was missing from user matrix — filled from admin defaults
      expect(merged.STAGE_COMPLETED).toContain("IN_APP")
    })
  })

  describe("mergeWithClientDefaults", () => {
    it("fills missing entries from client defaults", () => {
      const merged = mergeWithClientDefaults({})
      expect(merged.SHIPMENT_ARRIVAL).toContain("WHATSAPP")
    })
  })
})
