import { describe, it, expect, vi, beforeEach } from "vitest"

const notificationServiceMock = vi.hoisted(() => ({
  createNotification: vi.fn().mockResolvedValue(undefined),
  notifyTaskAssigned: vi.fn(),
}))

vi.mock("@/lib/services/notification", () => notificationServiceMock)

import { db } from "@/lib/db"
import {
  sendTaskDueSoonReminders,
  sendTaskOverdueAlerts,
  sendStageAttentionAlerts,
  sendPaymentOverdueReminders,
  runAllReminderJobs,
} from "@/lib/jobs/task-reminders"

describe("task-reminders jobs", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("sendTaskDueSoonReminders", () => {
    it("returns empty when no tasks due", async () => {
      vi.mocked(db.task.findMany).mockResolvedValue([])
      const result = await sendTaskDueSoonReminders()
      expect(result).toEqual([])
    })

    it("skips tasks already reminded within last 24h", async () => {
      const task = {
        id: "t-1",
        task: "pay customs",
        assignedTo: ["u1"],
        date: new Date(Date.now() + 3 * 3600 * 1000),
        projectId: "p-1",
      }
      vi.mocked(db.task.findMany).mockResolvedValue([task] as any)
      vi.mocked(db.notification.findFirst).mockResolvedValue({ id: "n1" } as any)

      const result = await sendTaskDueSoonReminders()
      expect(result).toEqual([])
      expect(notificationServiceMock.createNotification).not.toHaveBeenCalled()
    })

    it("sends a reminder per assignee when not yet reminded", async () => {
      const task = {
        id: "t-1",
        task: "pay customs",
        assignedTo: ["u1", "u2"],
        date: new Date(Date.now() + 3 * 3600 * 1000),
        projectId: "p-1",
      }
      vi.mocked(db.task.findMany).mockResolvedValue([task] as any)
      vi.mocked(db.notification.findFirst).mockResolvedValue(null)

      const result = await sendTaskDueSoonReminders()
      expect(result).toHaveLength(2)
      expect(result.every((r) => r.notificationSent)).toBe(true)
      expect(notificationServiceMock.createNotification).toHaveBeenCalledTimes(2)
    })

    it("records error when createNotification throws", async () => {
      const task = {
        id: "t-1",
        task: "pay customs",
        assignedTo: ["u1"],
        date: new Date(Date.now() + 3 * 3600 * 1000),
        projectId: "p-1",
      }
      vi.mocked(db.task.findMany).mockResolvedValue([task] as any)
      vi.mocked(db.notification.findFirst).mockResolvedValue(null)
      notificationServiceMock.createNotification.mockRejectedValueOnce(new Error("send fail"))

      const result = await sendTaskDueSoonReminders()
      expect(result[0]!.notificationSent).toBe(false)
      expect(result[0]!.error).toBe("send fail")
    })
  })

  describe("sendTaskOverdueAlerts", () => {
    it("skips if alert already sent today", async () => {
      vi.mocked(db.task.findMany).mockResolvedValue([
        { id: "t-1", task: "x", assignedTo: ["u1"], projectId: null, date: new Date() },
      ] as any)
      vi.mocked(db.notification.findFirst).mockResolvedValue({ id: "n1" } as any)

      const result = await sendTaskOverdueAlerts()
      expect(result).toHaveLength(0)
    })

    it("emits an alert per overdue task assignee", async () => {
      vi.mocked(db.task.findMany).mockResolvedValue([
        { id: "t-1", task: "x", assignedTo: ["u1"], projectId: "p1", date: new Date() },
      ] as any)
      vi.mocked(db.notification.findFirst).mockResolvedValue(null)

      const result = await sendTaskOverdueAlerts()
      expect(result).toHaveLength(1)
      expect(notificationServiceMock.createNotification).toHaveBeenCalledTimes(1)
    })
  })

  describe("sendStageAttentionAlerts", () => {
    it("returns 0 when nothing needs attention", async () => {
      vi.mocked(db.trackingStage.findMany).mockResolvedValue([])
      const count = await sendStageAttentionAlerts()
      expect(count).toBe(0)
    })

    it("skips stages whose shipment/project/user chain is missing", async () => {
      vi.mocked(db.trackingStage.findMany).mockResolvedValue([
        { stageType: "INSPECTION", shipmentId: "s1", shipment: null },
      ] as any)
      const count = await sendStageAttentionAlerts()
      expect(count).toBe(0)
    })

    it("emits alert when stage has been in progress too long", async () => {
      vi.mocked(db.trackingStage.findMany).mockResolvedValue([
        {
          stageType: "INSPECTION",
          shipmentId: "s1",
          shipment: {
            project: { id: "p1", userId: "u1", user: { id: "u1" } },
          },
        },
      ] as any)
      vi.mocked(db.notification.findFirst).mockResolvedValue(null)

      const count = await sendStageAttentionAlerts()
      expect(count).toBe(1)
      expect(notificationServiceMock.createNotification).toHaveBeenCalled()
    })
  })

  describe("sendPaymentOverdueReminders", () => {
    it("skips invoices without clientId", async () => {
      vi.mocked(db.invoice.findMany).mockResolvedValue([
        { id: "inv-1", invoiceNumber: "1", clientId: null, total: 100, currency: "USD" },
      ] as any)
      const count = await sendPaymentOverdueReminders()
      expect(count).toBe(0)
    })

    it("emits reminder for overdue invoice when none sent today", async () => {
      vi.mocked(db.invoice.findMany).mockResolvedValue([
        {
          id: "inv-1",
          invoiceNumber: "1",
          clientId: "c1",
          total: 100,
          currency: "USD",
          shipmentId: "s1",
        },
      ] as any)
      vi.mocked(db.notification.findFirst).mockResolvedValue(null)

      const count = await sendPaymentOverdueReminders()
      expect(count).toBe(1)
    })

    it("skips if reminder already sent today", async () => {
      vi.mocked(db.invoice.findMany).mockResolvedValue([
        { id: "inv-1", invoiceNumber: "1", clientId: "c1", total: 100, currency: "USD" },
      ] as any)
      vi.mocked(db.notification.findFirst).mockResolvedValue({ id: "n" } as any)

      const count = await sendPaymentOverdueReminders()
      expect(count).toBe(0)
    })
  })

  describe("runAllReminderJobs", () => {
    it("runs all jobs and returns a summary", async () => {
      vi.mocked(db.task.findMany).mockResolvedValue([])
      vi.mocked(db.trackingStage.findMany).mockResolvedValue([])
      vi.mocked(db.invoice.findMany).mockResolvedValue([])

      const result = await runAllReminderJobs()
      expect(result).toHaveProperty("dueSoonReminders")
      expect(result).toHaveProperty("overdueAlerts")
      expect(result).toHaveProperty("stageAlerts")
      expect(result).toHaveProperty("paymentReminders")
      expect(result).toHaveProperty("timestamp")
    })
  })
})
