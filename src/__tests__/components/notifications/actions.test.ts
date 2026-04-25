import { describe, it, expect, vi, beforeEach } from "vitest"

const authMocks = vi.hoisted(() => ({
  requireAuthedUser: vi.fn(),
  assertCanCreateNotification: vi.fn(),
  assertCanEditOwnPreferences: vi.fn(),
}))

vi.mock("@/components/platform/notifications/authorization", () => authMocks)
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import { db } from "@/lib/db"
import {
  listNotifications,
  getBellNotifications,
  fetchPreferences,
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  updateNotificationPreferences,
} from "@/components/platform/notifications/actions"
import { makeNotification } from "@/__tests__/helpers/factories"
import { NOTIFICATION_TYPES } from "@/components/platform/notifications/config"

function fullMatrix(channels: string[] = ["IN_APP"]) {
  const out: Record<string, string[]> = {}
  for (const type of NOTIFICATION_TYPES) out[type] = channels
  return out
}

describe("notifications actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMocks.requireAuthedUser.mockResolvedValue({ id: "u1", role: "ADMIN" })
    authMocks.assertCanCreateNotification.mockResolvedValue({ id: "u1", role: "ADMIN" })
    authMocks.assertCanEditOwnPreferences.mockResolvedValue({ id: "u1", role: "ADMIN" })
  })

  describe("listNotifications", () => {
    it("returns INVALID_INPUT when limit is out of range", async () => {
      const res = await listNotifications({ limit: -1 })
      expect(res.ok).toBe(false)
      if (!res.ok) expect(res.error).toBe("INVALID_INPUT")
    })

    it("returns items/unreadCount on success", async () => {
      vi.mocked(db.notification.findMany).mockResolvedValue([makeNotification()] as any)
      vi.mocked(db.notification.count).mockResolvedValue(2)

      const res = await listNotifications({ limit: 10 })
      expect(res.ok).toBe(true)
      if (res.ok) {
        expect(res.data.items).toHaveLength(1)
        expect(res.data.unreadCount).toBe(2)
      }
    })

    it("wraps thrown auth errors as failure", async () => {
      authMocks.requireAuthedUser.mockRejectedValueOnce(new Error("UNAUTHENTICATED"))
      const res = await listNotifications({})
      expect(res.ok).toBe(false)
      if (!res.ok) expect(res.error).toBe("UNAUTHENTICATED")
    })
  })

  describe("getBellNotifications", () => {
    it("returns items + unreadCount", async () => {
      vi.mocked(db.notification.findMany).mockResolvedValue([makeNotification()] as any)
      vi.mocked(db.notification.count).mockResolvedValue(1)
      const res = await getBellNotifications()
      expect(res.ok).toBe(true)
      if (res.ok) {
        expect(res.data.items).toHaveLength(1)
        expect(res.data.unreadCount).toBe(1)
      }
    })
  })

  describe("fetchPreferences", () => {
    it("returns the synthetic DTO when no stored prefs", async () => {
      vi.mocked(db.notificationPreference.findUnique).mockResolvedValue(null)
      const res = await fetchPreferences()
      expect(res.ok).toBe(true)
    })
  })

  describe("createNotification", () => {
    it("fails on invalid input", async () => {
      const res = await createNotification({ type: "BOGUS" })
      expect(res.ok).toBe(false)
      if (!res.ok) expect(res.error).toBe("INVALID_INPUT")
    })

    it("calls payment-related gate for PAYMENT_* types", async () => {
      vi.mocked(db.notification.create).mockResolvedValue({ id: "n1" } as any)
      const res = await createNotification({
        userId: "u1",
        type: "PAYMENT_OVERDUE",
        title: "late",
        message: "please pay",
      })
      expect(authMocks.assertCanCreateNotification).toHaveBeenCalledWith({
        paymentRelated: true,
      })
      expect(res.ok).toBe(true)
    })

    it("calls non-payment gate for non-PAYMENT types", async () => {
      vi.mocked(db.notification.create).mockResolvedValue({ id: "n1" } as any)
      await createNotification({
        userId: "u1",
        type: "TASK_ASSIGNED",
        title: "t",
        message: "b",
      })
      expect(authMocks.assertCanCreateNotification).toHaveBeenCalledWith({
        paymentRelated: false,
      })
    })

    it("fails when authorization throws", async () => {
      authMocks.assertCanCreateNotification.mockRejectedValueOnce(new Error("FORBIDDEN"))
      const res = await createNotification({
        userId: "u1",
        type: "TASK_ASSIGNED",
        title: "t",
        message: "b",
      })
      expect(res.ok).toBe(false)
    })
  })

  describe("markNotificationAsRead", () => {
    it("rejects invalid id", async () => {
      const res = await markNotificationAsRead({ notificationId: "" })
      expect(res.ok).toBe(false)
    })

    it("returns NOT_FOUND when no such notification", async () => {
      vi.mocked(db.notification.findUnique).mockResolvedValue(null)
      const res = await markNotificationAsRead({ notificationId: "nx" })
      expect(res.ok).toBe(false)
      if (!res.ok) expect(res.error).toBe("NOT_FOUND")
    })

    it("returns FORBIDDEN when owner differs", async () => {
      vi.mocked(db.notification.findUnique).mockResolvedValue({ id: "n1", userId: "u2" } as any)
      const res = await markNotificationAsRead({ notificationId: "n1" })
      expect(res.ok).toBe(false)
      if (!res.ok) expect(res.error).toBe("FORBIDDEN")
    })

    it("marks as read when owner matches", async () => {
      vi.mocked(db.notification.findUnique).mockResolvedValue({ id: "n1", userId: "u1" } as any)
      vi.mocked(db.notification.update).mockResolvedValue({} as any)
      const res = await markNotificationAsRead({ notificationId: "n1" })
      expect(res.ok).toBe(true)
    })
  })

  describe("markAllNotificationsAsRead", () => {
    it("returns update count", async () => {
      vi.mocked(db.notification.updateMany).mockResolvedValue({ count: 4 } as any)
      const res = await markAllNotificationsAsRead()
      expect(res.ok).toBe(true)
      if (res.ok) expect(res.data.count).toBe(4)
    })
  })

  describe("deleteNotification", () => {
    it("returns FORBIDDEN when owner mismatch", async () => {
      vi.mocked(db.notification.findUnique).mockResolvedValue({ id: "n1", userId: "u2" } as any)
      const res = await deleteNotification({ notificationId: "n1" })
      expect(res.ok).toBe(false)
      if (!res.ok) expect(res.error).toBe("FORBIDDEN")
    })

    it("deletes when authorized", async () => {
      vi.mocked(db.notification.findUnique).mockResolvedValue({ id: "n1", userId: "u1" } as any)
      vi.mocked(db.notification.delete).mockResolvedValue({} as any)
      const res = await deleteNotification({ notificationId: "n1" })
      expect(res.ok).toBe(true)
      expect(db.notification.delete).toHaveBeenCalled()
    })
  })

  describe("updateNotificationPreferences", () => {
    it("upserts with provided data", async () => {
      vi.mocked(db.notificationPreference.upsert).mockResolvedValue({
        id: "p1",
        userId: "u1",
        clientId: null,
        whatsappNumber: "+1234",
        whatsappVerified: false,
        quietHoursStart: 22,
        quietHoursEnd: 8,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)

      const res = await updateNotificationPreferences({
        preferences: fullMatrix(["IN_APP"]),
        quietHoursStart: 22,
        quietHoursEnd: 8,
        whatsappNumber: "+1234",
      })
      expect(res.ok).toBe(true)
      if (res.ok) {
        expect(res.data.whatsappNumber).toBe("+1234")
        expect(res.data.quietHoursStart).toBe(22)
      }
    })

    it("fails on invalid preferences matrix", async () => {
      const res = await updateNotificationPreferences({
        preferences: { WRONG_TYPE: ["IN_APP"] },
      })
      expect(res.ok).toBe(false)
    })
  })
})
