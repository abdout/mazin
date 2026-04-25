import { describe, it, expect } from "vitest"
import {
  NOTIFICATION_TYPE_CONFIG,
  PRIORITY_CONFIG,
  CHANNEL_ICONS,
  CHANNEL_CONFIG,
  NOTIFICATION_TYPES,
  NOTIFICATION_CHANNELS,
  DEFAULT_PREFERENCES,
  DEFAULT_CLIENT_MATRIX,
  TYPE_DICT_KEY,
  DEFAULT_QUIET_HOURS,
  NOTIFICATIONS_PER_PAGE,
  NOTIFICATION_BELL_MAX_DISPLAY,
} from "@/components/platform/notifications/config"

describe("notifications/config", () => {
  it("NOTIFICATION_TYPES and config align 1-1", () => {
    for (const type of NOTIFICATION_TYPES) {
      expect(NOTIFICATION_TYPE_CONFIG[type]).toBeDefined()
      expect(TYPE_DICT_KEY[type]).toBe(type)
    }
  })

  it("CHANNEL_ICONS covers every NOTIFICATION_CHANNEL", () => {
    for (const c of NOTIFICATION_CHANNELS) {
      expect(CHANNEL_ICONS[c]).toBeDefined()
      expect(CHANNEL_CONFIG[c]).toBeDefined()
    }
  })

  it("SMS is disabled by default", () => {
    expect(CHANNEL_CONFIG.SMS.enabled).toBe(false)
  })

  it("IN_APP/EMAIL/WHATSAPP enabled", () => {
    expect(CHANNEL_CONFIG.IN_APP.enabled).toBe(true)
    expect(CHANNEL_CONFIG.EMAIL.enabled).toBe(true)
    expect(CHANNEL_CONFIG.WHATSAPP.enabled).toBe(true)
  })

  it("PRIORITY_CONFIG covers each priority level", () => {
    expect(PRIORITY_CONFIG.low).toBeDefined()
    expect(PRIORITY_CONFIG.normal).toBeDefined()
    expect(PRIORITY_CONFIG.high).toBeDefined()
    expect(PRIORITY_CONFIG.urgent).toBeDefined()
    expect(PRIORITY_CONFIG.urgent.badgeVariant).toBe("destructive")
  })

  it("DEFAULT_PREFERENCES has ADMIN/MANAGER/CLERK/VIEWER/USER", () => {
    for (const role of ["ADMIN", "MANAGER", "CLERK", "VIEWER", "USER"]) {
      expect(DEFAULT_PREFERENCES[role]).toBeDefined()
    }
  })

  it("ADMIN defaults to IN_APP + EMAIL for all types", () => {
    const admin = DEFAULT_PREFERENCES.ADMIN!
    for (const type of NOTIFICATION_TYPES) {
      expect(admin[type]).toContain("IN_APP")
      expect(admin[type]).toContain("EMAIL")
    }
  })

  it("CLERK/USER default to IN_APP only", () => {
    const clerk = DEFAULT_PREFERENCES.CLERK!
    expect(clerk.TASK_ASSIGNED).toEqual(["IN_APP"])
  })

  it("DEFAULT_CLIENT_MATRIX prefers WhatsApp for shipment events", () => {
    expect(DEFAULT_CLIENT_MATRIX.SHIPMENT_ARRIVAL).toContain("WHATSAPP")
    expect(DEFAULT_CLIENT_MATRIX.PAYMENT_REQUEST).toContain("EMAIL")
  })

  it("DEFAULT_QUIET_HOURS spans 22:00–08:00", () => {
    expect(DEFAULT_QUIET_HOURS.start).toBe(22)
    expect(DEFAULT_QUIET_HOURS.end).toBe(8)
  })

  it("pagination constants are positive", () => {
    expect(NOTIFICATIONS_PER_PAGE).toBeGreaterThan(0)
    expect(NOTIFICATION_BELL_MAX_DISPLAY).toBeGreaterThan(0)
  })
})
