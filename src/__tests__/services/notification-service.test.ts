import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/services/notification/whatsapp", () => ({
  sendWhatsAppMessage: vi.fn(),
}))

import { db } from "@/lib/db"
import {
  createNotification,
  markNotificationRead,
  markAllNotificationsRead,
  getUserNotifications,
} from "@/lib/services/notification"
import { makeNotification } from "@/__tests__/helpers/factories"

describe("Notification Service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================
  // createNotification
  // ============================================
  describe("createNotification", () => {
    it("creates an IN_APP notification record in the database", async () => {
      const mockNotification = { id: "notif-1", type: "TASK_ASSIGNED" }
      vi.mocked(db.notification.create).mockResolvedValue(mockNotification as never)
      vi.mocked(db.notification.update).mockResolvedValue(mockNotification as never)

      const result = await createNotification({
        type: "TASK_ASSIGNED",
        title: "New Task",
        message: "You have a new task",
        userId: "user-1",
      })

      expect(db.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: "TASK_ASSIGNED",
          title: "New Task",
          message: "You have a new task",
          channel: "IN_APP",
          status: "PENDING",
          userId: "user-1",
        }),
      })
      expect(result.id).toBe("notif-1")
      expect(result.channels).toEqual(
        expect.arrayContaining([{ channel: "IN_APP", status: "sent" }])
      )
    })

    it("defaults to IN_APP channel when no channels specified", async () => {
      const mockNotification = { id: "notif-2" }
      vi.mocked(db.notification.create).mockResolvedValue(mockNotification as never)
      vi.mocked(db.notification.update).mockResolvedValue(mockNotification as never)

      await createNotification({
        type: "SYSTEM_ALERT",
        title: "Alert",
        message: "System alert",
      })

      const createCall = vi.mocked(db.notification.create).mock.calls[0]![0] as {
        data: Record<string, unknown>
      }
      expect(createCall.data.channel).toBe("IN_APP")
    })

    it("updates notification status to SENT after successful delivery", async () => {
      const mockNotification = { id: "notif-3" }
      vi.mocked(db.notification.create).mockResolvedValue(mockNotification as never)
      vi.mocked(db.notification.update).mockResolvedValue(mockNotification as never)

      await createNotification({
        type: "TASK_ASSIGNED",
        title: "Task",
        message: "Assigned",
        channels: ["IN_APP"],
      })

      expect(db.notification.update).toHaveBeenCalledWith({
        where: { id: "notif-3" },
        data: expect.objectContaining({
          status: "SENT",
          sentAt: expect.any(Date),
        }),
      })
    })

    it("stores metadata as JSON when provided", async () => {
      const mockNotification = { id: "notif-4" }
      vi.mocked(db.notification.create).mockResolvedValue(mockNotification as never)
      vi.mocked(db.notification.update).mockResolvedValue(mockNotification as never)

      await createNotification({
        type: "PAYMENT_REQUEST",
        title: "Payment Due",
        message: "Please pay",
        metadata: { invoiceNumber: "1044/25", amount: 5000 },
      })

      const createCall = vi.mocked(db.notification.create).mock.calls[0]![0] as {
        data: Record<string, unknown>
      }
      expect(createCall.data.metadata).toEqual({ invoiceNumber: "1044/25", amount: 5000 })
    })

    it("passes optional relation IDs (projectId, taskId, shipmentId, invoiceId)", async () => {
      const mockNotification = { id: "notif-5" }
      vi.mocked(db.notification.create).mockResolvedValue(mockNotification as never)
      vi.mocked(db.notification.update).mockResolvedValue(mockNotification as never)

      await createNotification({
        type: "TASK_ASSIGNED",
        title: "Task",
        message: "Assigned",
        userId: "user-1",
        projectId: "proj-1",
        taskId: "task-1",
        shipmentId: "ship-1",
        invoiceId: "inv-1",
      })

      const createCall = vi.mocked(db.notification.create).mock.calls[0]![0] as {
        data: Record<string, unknown>
      }
      expect(createCall.data.projectId).toBe("proj-1")
      expect(createCall.data.taskId).toBe("task-1")
      expect(createCall.data.shipmentId).toBe("ship-1")
      expect(createCall.data.invoiceId).toBe("inv-1")
    })
  })

  // ============================================
  // markNotificationRead
  // ============================================
  describe("markNotificationRead", () => {
    it("sets readAt to a Date for the given notification", async () => {
      vi.mocked(db.notification.update).mockResolvedValue(
        makeNotification({ readAt: new Date() }) as any
       )

      await markNotificationRead("notif-1")

      expect(db.notification.update).toHaveBeenCalledWith({
        where: { id: "notif-1" },
        data: { readAt: expect.any(Date) },
      })
    })
  })

  // ============================================
  // markAllNotificationsRead
  // ============================================
  describe("markAllNotificationsRead", () => {
    it("updates all unread notifications for the user", async () => {
      vi.mocked(db.notification.updateMany).mockResolvedValue({ count: 5 })

      await markAllNotificationsRead("user-1")

      expect(db.notification.updateMany).toHaveBeenCalledWith({
        where: {
          userId: "user-1",
          readAt: null,
        },
        data: { readAt: expect.any(Date) },
      })
    })

    it("does not affect notifications with existing readAt", async () => {
      vi.mocked(db.notification.updateMany).mockResolvedValue({ count: 0 })

      await markAllNotificationsRead("user-1")

      const updateCall = vi.mocked(db.notification.updateMany).mock.calls[0]![0] as {
        where: Record<string, unknown>
      }
      expect(updateCall.where.readAt).toBeNull()
    })
  })

  // ============================================
  // getUserNotifications
  // ============================================
  describe("getUserNotifications", () => {
    it("returns notifications ordered by createdAt desc", async () => {
      const notifications = [makeNotification(), makeNotification()]
      vi.mocked(db.notification.findMany).mockResolvedValue(notifications as any)

      const result = await getUserNotifications("user-1")

      expect(db.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: "user-1" }),
          orderBy: { createdAt: "desc" },
        })
      )
      expect(result).toHaveLength(2)
    })

    it("respects the limit parameter", async () => {
      vi.mocked(db.notification.findMany).mockResolvedValue([makeNotification()] as any)

      await getUserNotifications("user-1", 10)

      expect(db.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        })
      )
    })

    it("defaults to limit of 50", async () => {
      vi.mocked(db.notification.findMany).mockResolvedValue([])

      await getUserNotifications("user-1")

      expect(db.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        })
      )
    })

    it("excludes FAILED notifications", async () => {
      vi.mocked(db.notification.findMany).mockResolvedValue([])

      await getUserNotifications("user-1")

      const findCall = vi.mocked(db.notification.findMany).mock.calls[0]![0] as {
        where: Record<string, unknown>
      }
      expect(findCall.where.status).toEqual({ not: "FAILED" })
    })

    it("includes read notifications by default (includeRead=true)", async () => {
      vi.mocked(db.notification.findMany).mockResolvedValue([])

      await getUserNotifications("user-1", 50, true)

      const findCall = vi.mocked(db.notification.findMany).mock.calls[0]![0] as {
        where: Record<string, unknown>
      }
      // Should NOT have readAt filter when includeRead=true
      expect(findCall.where).not.toHaveProperty("readAt")
    })

    it("filters to unread only when includeRead=false", async () => {
      vi.mocked(db.notification.findMany).mockResolvedValue([])

      await getUserNotifications("user-1", 50, false)

      const findCall = vi.mocked(db.notification.findMany).mock.calls[0]![0] as {
        where: Record<string, unknown>
      }
      expect(findCall.where.readAt).toBeNull()
    })
  })
})
