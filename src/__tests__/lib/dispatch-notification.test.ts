import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

vi.mock("@/lib/services/notification", () => ({
  createNotification: vi.fn().mockResolvedValue(undefined),
}))

import { db } from "@/lib/db"
import { dispatchNotification } from "@/lib/dispatch-notification"

describe("dispatchNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(db.user.findUnique).mockResolvedValue({ role: "ADMIN" } as any)
    vi.mocked(db.notificationPreference.findUnique).mockResolvedValue(null)
    vi.mocked(db.notification.create).mockImplementation((async ({ data }: { data: Record<string, unknown> }) => ({
      id: `n-${Math.random().toString(36).slice(2, 9)}`,
      ...data,
    })) as never)
    vi.mocked(db.notification.update).mockResolvedValue({} as any)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("throws when neither userId nor clientId provided", async () => {
    await expect(
      dispatchNotification({
        type: "SYSTEM_ALERT",
        title: "t",
        body: "b",
      } as any)
    ).rejects.toThrow("userId or clientId required")
  })

  it("throws when both userId and clientId provided", async () => {
    await expect(
      dispatchNotification({
        userId: "u1",
        clientId: "c1",
        type: "SYSTEM_ALERT",
        title: "t",
        body: "b",
      })
    ).rejects.toThrow("cannot target both")
  })

  it("creates a notification row per allowed channel", async () => {
    const result = await dispatchNotification({
      userId: "u1",
      type: "TASK_ASSIGNED",
      title: "task",
      body: "body",
      channels: ["IN_APP", "EMAIL"],
    })

    expect(result.createdIds).toHaveLength(2)
    expect(result.skipped).toBe(0)
    expect(db.notification.create).toHaveBeenCalledTimes(2)
  })

  it("deduplicates repeated channels", async () => {
    const result = await dispatchNotification({
      userId: "u1",
      type: "TASK_ASSIGNED",
      title: "t",
      body: "b",
      channels: ["IN_APP", "IN_APP", "EMAIL"],
    })
    expect(result.createdIds).toHaveLength(2)
  })

  it("filters out channels not allowed by the user's preferences", async () => {
    vi.mocked(db.notificationPreference.findUnique).mockResolvedValue({
      preferences: { TASK_ASSIGNED: ["IN_APP"] }, // only IN_APP allowed
    } as any)
    const result = await dispatchNotification({
      userId: "u1",
      type: "TASK_ASSIGNED",
      title: "t",
      body: "b",
      channels: ["IN_APP", "EMAIL", "WHATSAPP"],
    })
    expect(result.createdIds).toHaveLength(1)
  })

  it("returns skipped=1 when inside quiet hours and not overridden", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-04-20T23:00:00Z")) // 23 UTC
    // Sets quiet hours spanning 22 → 08 (wraps midnight)
    vi.mocked(db.notificationPreference.findUnique).mockResolvedValue({
      quietHoursStart: new Date().getHours(), // capture "now" inside window
      quietHoursEnd: (new Date().getHours() + 2) % 24,
      preferences: {},
    } as any)

    const result = await dispatchNotification({
      userId: "u1",
      type: "TASK_ASSIGNED",
      title: "t",
      body: "b",
    })
    expect(result.createdIds).toHaveLength(0)
    expect(result.skipped).toBe(1)
  })

  it("overrideQuietHours dispatches even during quiet hours", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-04-20T23:00:00Z"))
    const hour = new Date().getHours()
    vi.mocked(db.notificationPreference.findUnique).mockResolvedValue({
      quietHoursStart: hour,
      quietHoursEnd: (hour + 2) % 24,
      preferences: {},
    } as any)

    const result = await dispatchNotification({
      userId: "u1",
      type: "SYSTEM_ALERT",
      title: "t",
      body: "b",
      overrideQuietHours: true,
    })
    expect(result.skipped).toBe(0)
  })

  it("tags IN_APP as SENT immediately but non-IN_APP as PENDING", async () => {
    await dispatchNotification({
      userId: "u1",
      type: "TASK_ASSIGNED",
      title: "t",
      body: "b",
      channels: ["IN_APP", "EMAIL"],
    })
    const calls = vi.mocked(db.notification.create).mock.calls
    const inApp = calls.find((c: any) => c[0].data.channel === "IN_APP")
    const email = calls.find((c: any) => c[0].data.channel === "EMAIL")
    expect(inApp![0].data.status).toBe("SENT")
    expect(email![0].data.status).toBe("PENDING")
  })

  it("uses default client matrix when target is a client", async () => {
    // No user lookup for client branch
    vi.mocked(db.notificationPreference.findUnique).mockResolvedValue(null)
    const result = await dispatchNotification({
      clientId: "c1",
      type: "SHIPMENT_ARRIVAL",
      title: "t",
      body: "b",
    })
    // DEFAULT_CLIENT_MATRIX.SHIPMENT_ARRIVAL = IN_APP + WHATSAPP
    expect(result.createdIds).toHaveLength(2)
  })
})
