import { describe, it, expect } from "vitest"
import {
  createNotificationSchema,
  updateNotificationPreferencesSchema,
  markNotificationReadSchema,
  deleteNotificationSchema,
  notificationListSchema,
} from "@/components/platform/notifications/validation"
import { NOTIFICATION_TYPES } from "@/components/platform/notifications/config"

/** Zod v4 record(enum, ...) is exhaustive — build a complete matrix. */
function fullMatrix(channels: string[] = ["IN_APP"]) {
  const out: Record<string, string[]> = {}
  for (const type of NOTIFICATION_TYPES) out[type] = channels
  return out
}

describe("notifications/validation", () => {
  describe("createNotificationSchema", () => {
    const base = {
      type: "TASK_ASSIGNED",
      title: "New task",
      message: "Body",
    }

    it("rejects when neither userId nor clientId", () => {
      const r = createNotificationSchema.safeParse(base)
      expect(r.success).toBe(false)
    })

    it("rejects when BOTH userId and clientId", () => {
      const r = createNotificationSchema.safeParse({
        ...base,
        userId: "u1",
        clientId: "c1",
      })
      expect(r.success).toBe(false)
    })

    it("accepts when only userId", () => {
      const r = createNotificationSchema.safeParse({
        ...base,
        userId: "u1",
      })
      expect(r.success).toBe(true)
    })

    it("defaults priority=normal and channel=IN_APP", () => {
      const r = createNotificationSchema.safeParse({
        ...base,
        userId: "u1",
      })
      expect(r.success).toBe(true)
      if (r.success) {
        expect(r.data.priority).toBe("normal")
        expect(r.data.channel).toBe("IN_APP")
      }
    })

    it("rejects unknown type", () => {
      const r = createNotificationSchema.safeParse({
        ...base,
        type: "NOT_A_TYPE",
        userId: "u1",
      })
      expect(r.success).toBe(false)
    })

    it("rejects title > 255 chars", () => {
      const r = createNotificationSchema.safeParse({
        ...base,
        userId: "u1",
        title: "x".repeat(300),
      })
      expect(r.success).toBe(false)
    })
  })

  describe("updateNotificationPreferencesSchema", () => {
    it("accepts valid preferences matrix", () => {
      const r = updateNotificationPreferencesSchema.safeParse({
        preferences: fullMatrix(["IN_APP", "EMAIL"]),
      })
      expect(r.success).toBe(true)
    })

    it("rejects quietHoursStart===quietHoursEnd", () => {
      const r = updateNotificationPreferencesSchema.safeParse({
        preferences: fullMatrix(),
        quietHoursStart: 5,
        quietHoursEnd: 5,
      })
      expect(r.success).toBe(false)
    })

    it("accepts quietHoursStart != quietHoursEnd", () => {
      const r = updateNotificationPreferencesSchema.safeParse({
        preferences: fullMatrix(),
        quietHoursStart: 22,
        quietHoursEnd: 8,
      })
      expect(r.success).toBe(true)
    })

    it("rejects quietHoursStart > 23", () => {
      const r = updateNotificationPreferencesSchema.safeParse({
        preferences: fullMatrix(),
        quietHoursStart: 25,
      })
      expect(r.success).toBe(false)
    })

    it("accepts null quietHours", () => {
      const r = updateNotificationPreferencesSchema.safeParse({
        preferences: fullMatrix(),
        quietHoursStart: null,
        quietHoursEnd: null,
      })
      expect(r.success).toBe(true)
    })
  })

  describe("mark/delete schemas", () => {
    it("markNotificationReadSchema requires non-empty id", () => {
      expect(markNotificationReadSchema.safeParse({ notificationId: "" }).success).toBe(
        false
      )
      expect(markNotificationReadSchema.safeParse({ notificationId: "n1" }).success).toBe(
        true
      )
    })

    it("deleteNotificationSchema requires non-empty id", () => {
      expect(deleteNotificationSchema.safeParse({ notificationId: "" }).success).toBe(
        false
      )
      expect(deleteNotificationSchema.safeParse({ notificationId: "n1" }).success).toBe(
        true
      )
    })
  })

  describe("notificationListSchema", () => {
    it("defaults limit=20 and filter=all", () => {
      const r = notificationListSchema.safeParse({})
      expect(r.success).toBe(true)
      if (r.success) {
        expect(r.data.limit).toBe(20)
        expect(r.data.filter).toBe("all")
      }
    })

    it("caps limit at 100", () => {
      const r = notificationListSchema.safeParse({ limit: 200 })
      expect(r.success).toBe(false)
    })

    it("rejects invalid filter", () => {
      const r = notificationListSchema.safeParse({ filter: "archived" })
      expect(r.success).toBe(false)
    })
  })
})
