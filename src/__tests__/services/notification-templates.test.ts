import { describe, it, expect } from "vitest"
import {
  NOTIFICATION_TEMPLATES,
  getNotificationContent,
  getWhatsAppTemplate,
} from "@/lib/services/notification/templates"
import type { NotificationType } from "@prisma/client"

const ALL_TYPES: NotificationType[] = [
  "TASK_ASSIGNED",
  "TASK_DUE_SOON",
  "TASK_OVERDUE",
  "TASK_COMPLETED",
  "STAGE_ATTENTION_NEEDED",
  "STAGE_COMPLETED",
  "SHIPMENT_CREATED",
  "SHIPMENT_ARRIVAL",
  "SHIPMENT_CLEARED",
  "SHIPMENT_RELEASED",
  "SHIPMENT_DELIVERED",
  "PAYMENT_REQUEST",
  "PAYMENT_RECEIVED",
  "PAYMENT_OVERDUE",
  "SYSTEM_ALERT",
]

// =============================================================================
// NOTIFICATION_TEMPLATES
// =============================================================================

describe("NOTIFICATION_TEMPLATES", () => {
  it("has entries for all NotificationType values", () => {
    for (const type of ALL_TYPES) {
      expect(NOTIFICATION_TEMPLATES[type]).toBeDefined()
    }
  })

  it("every template has titleEn, titleAr, messageEn, messageAr", () => {
    for (const type of ALL_TYPES) {
      const tmpl = NOTIFICATION_TEMPLATES[type]
      expect(typeof tmpl.titleEn).toBe("string")
      expect(tmpl.titleEn.length).toBeGreaterThan(0)
      expect(typeof tmpl.titleAr).toBe("string")
      expect(tmpl.titleAr.length).toBeGreaterThan(0)
      expect(typeof tmpl.messageEn).toBe("string")
      expect(tmpl.messageEn.length).toBeGreaterThan(0)
      expect(typeof tmpl.messageAr).toBe("string")
      expect(tmpl.messageAr.length).toBeGreaterThan(0)
    }
  })

  it("task templates reference {taskTitle} in messages", () => {
    expect(NOTIFICATION_TEMPLATES.TASK_ASSIGNED.messageEn).toContain("{taskTitle}")
    expect(NOTIFICATION_TEMPLATES.TASK_DUE_SOON.messageEn).toContain("{taskTitle}")
    expect(NOTIFICATION_TEMPLATES.TASK_OVERDUE.messageEn).toContain("{taskTitle}")
    expect(NOTIFICATION_TEMPLATES.TASK_COMPLETED.messageEn).toContain("{taskTitle}")
  })

  it("shipment templates reference {trackingNumber} in messages", () => {
    expect(NOTIFICATION_TEMPLATES.SHIPMENT_CREATED.messageEn).toContain("{trackingNumber}")
    expect(NOTIFICATION_TEMPLATES.SHIPMENT_ARRIVAL.messageEn).toContain("{trackingNumber}")
    expect(NOTIFICATION_TEMPLATES.SHIPMENT_CLEARED.messageEn).toContain("{trackingNumber}")
    expect(NOTIFICATION_TEMPLATES.SHIPMENT_RELEASED.messageEn).toContain("{trackingNumber}")
    expect(NOTIFICATION_TEMPLATES.SHIPMENT_DELIVERED.messageEn).toContain("{trackingNumber}")
  })

  it("payment templates reference {invoiceNumber} and {amount}", () => {
    expect(NOTIFICATION_TEMPLATES.PAYMENT_REQUEST.messageEn).toContain("{invoiceNumber}")
    expect(NOTIFICATION_TEMPLATES.PAYMENT_REQUEST.messageEn).toContain("{amount}")
    expect(NOTIFICATION_TEMPLATES.PAYMENT_RECEIVED.messageEn).toContain("{invoiceNumber}")
    expect(NOTIFICATION_TEMPLATES.PAYMENT_OVERDUE.messageEn).toContain("{invoiceNumber}")
  })
})

// =============================================================================
// getNotificationContent
// =============================================================================

describe("getNotificationContent", () => {
  describe("locale selection", () => {
    it("returns English content for 'en' locale", () => {
      const result = getNotificationContent("TASK_ASSIGNED", "en")
      expect(result.title).toBe("New Task Assigned")
      expect(result.message).toContain("You have been assigned")
    })

    it("returns Arabic content for 'ar' locale", () => {
      const result = getNotificationContent("TASK_ASSIGNED", "ar")
      expect(result.title).toBe("مهمة جديدة")
      expect(result.message).toContain("تم تعيينك لمهمة")
    })
  })

  describe("variable replacement", () => {
    it("replaces {taskTitle} in message", () => {
      const result = getNotificationContent("TASK_ASSIGNED", "en", {
        taskTitle: "Verify Documents",
      })
      expect(result.message).toBe("You have been assigned: Verify Documents")
      expect(result.message).not.toContain("{taskTitle}")
    })

    it("replaces multiple variables in payment request", () => {
      const result = getNotificationContent("PAYMENT_REQUEST", "en", {
        invoiceNumber: "1044/25",
        amount: "500,000",
        currency: "SDG",
      })
      expect(result.message).toContain("1044/25")
      expect(result.message).toContain("500,000")
      expect(result.message).toContain("SDG")
      expect(result.message).not.toContain("{invoiceNumber}")
      expect(result.message).not.toContain("{amount}")
      expect(result.message).not.toContain("{currency}")
    })

    it("replaces variables in Arabic messages", () => {
      const result = getNotificationContent("SHIPMENT_ARRIVAL", "ar", {
        trackingNumber: "TRK-ABC123",
      })
      expect(result.message).toContain("TRK-ABC123")
      expect(result.message).not.toContain("{trackingNumber}")
    })

    it("replaces {hours} in TASK_DUE_SOON", () => {
      const result = getNotificationContent("TASK_DUE_SOON", "en", {
        taskTitle: "Pay Duties",
        hours: 4,
      })
      expect(result.message).toContain("Pay Duties")
      expect(result.message).toContain("4")
      expect(result.message).not.toContain("{hours}")
    })

    it("leaves unreferenced placeholders when no variables provided", () => {
      const result = getNotificationContent("TASK_ASSIGNED", "en")
      expect(result.message).toContain("{taskTitle}")
    })

    it("replaces {message} for SYSTEM_ALERT", () => {
      const result = getNotificationContent("SYSTEM_ALERT", "en", {
        message: "Server maintenance at 10 PM",
      })
      expect(result.message).toBe("Server maintenance at 10 PM")
    })
  })

  it("returns title and message properties", () => {
    const result = getNotificationContent("SHIPMENT_CREATED", "en")
    expect(result).toHaveProperty("title")
    expect(result).toHaveProperty("message")
  })
})

// =============================================================================
// getWhatsAppTemplate
// =============================================================================

describe("getWhatsAppTemplate", () => {
  const supportedTypes: Array<{ type: NotificationType; template: string }> = [
    { type: "TASK_ASSIGNED", template: "task_assigned_ar" },
    { type: "TASK_DUE_SOON", template: "task_reminder_ar" },
    { type: "PAYMENT_REQUEST", template: "payment_request_ar" },
    { type: "SHIPMENT_ARRIVAL", template: "shipment_arrival_ar" },
    { type: "SHIPMENT_RELEASED", template: "shipment_released_ar" },
    { type: "SHIPMENT_DELIVERED", template: "shipment_delivered_ar" },
  ]

  it("returns template name for each supported type", () => {
    for (const { type, template } of supportedTypes) {
      expect(getWhatsAppTemplate(type)).toBe(template)
    }
  })

  it("returns null for unsupported notification types", () => {
    const unsupported: NotificationType[] = [
      "TASK_OVERDUE",
      "TASK_COMPLETED",
      "STAGE_ATTENTION_NEEDED",
      "STAGE_COMPLETED",
      "SHIPMENT_CREATED",
      "SHIPMENT_CLEARED",
      "PAYMENT_RECEIVED",
      "PAYMENT_OVERDUE",
      "SYSTEM_ALERT",
    ]
    for (const type of unsupported) {
      expect(getWhatsAppTemplate(type)).toBeNull()
    }
  })

  it("all returned template names end with _ar", () => {
    for (const { type } of supportedTypes) {
      const tmpl = getWhatsAppTemplate(type)
      expect(tmpl).not.toBeNull()
      expect(tmpl!.endsWith("_ar")).toBe(true)
    }
  })
})
