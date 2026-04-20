import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/services/notification", () => ({
  markNotificationRead: vi.fn(),
  markAllNotificationsRead: vi.fn(),
  getUserNotifications: vi.fn(),
}))

import { auth } from "@/auth"
import {
  markNotificationRead,
  markAllNotificationsRead,
  getUserNotifications,
} from "@/lib/services/notification"
import { markRead, markAllRead, getNotifications } from "@/actions/notifications"
import { makeSession, makeNotification } from "@/__tests__/helpers/factories"

describe("Notification Actions", () => {
  const session = makeSession()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(session as any)
  })

  // ============================================
  // markRead
  // ============================================
  describe("markRead", () => {
    it("throws Unauthorized when no session", async () => {
      vi.mocked(auth).mockResolvedValue(null as any)

      await expect(markRead("notif-1")).rejects.toThrow("Unauthorized")
    })

    it("calls markNotificationRead with the notification ID", async () => {
      vi.mocked(markNotificationRead).mockResolvedValue({} as never)

      const result = await markRead("notif-1")

      expect(markNotificationRead).toHaveBeenCalledWith("notif-1")
      expect(result).toEqual({ success: true })
    })
  })

  // ============================================
  // markAllRead
  // ============================================
  describe("markAllRead", () => {
    it("throws Unauthorized when no session", async () => {
      vi.mocked(auth).mockResolvedValue(null as any)

      await expect(markAllRead()).rejects.toThrow("Unauthorized")
    })

    it("calls markAllNotificationsRead with user ID", async () => {
      vi.mocked(markAllNotificationsRead).mockResolvedValue({} as never)

      const result = await markAllRead()

      expect(markAllNotificationsRead).toHaveBeenCalledWith(session.user.id)
      expect(result).toEqual({ success: true })
    })
  })

  // ============================================
  // getNotifications
  // ============================================
  describe("getNotifications", () => {
    it("throws Unauthorized when no session", async () => {
      vi.mocked(auth).mockResolvedValue(null as any)

      await expect(getNotifications()).rejects.toThrow("Unauthorized")
    })

    it("returns notifications for the user with default limit", async () => {
      const notifications = [makeNotification(), makeNotification()]
      vi.mocked(getUserNotifications).mockResolvedValue(notifications as any)

      const result = await getNotifications()

      expect(getUserNotifications).toHaveBeenCalledWith(session.user.id, 50)
      expect(result).toHaveLength(2)
    })

    it("passes custom limit to getUserNotifications", async () => {
      vi.mocked(getUserNotifications).mockResolvedValue([makeNotification()] as any)

      await getNotifications(10)

      expect(getUserNotifications).toHaveBeenCalledWith(session.user.id, 10)
    })
  })
})
