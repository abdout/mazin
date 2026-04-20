import { describe, it, expect, vi, beforeEach, afterAll } from "vitest"
import { db } from "@/lib/db"
import {
  sendWhatsAppMessage,
  updateWhatsAppMessageStatus,
  verifyWebhookSignature,
} from "@/lib/services/notification/whatsapp"

const mockDb = db as any

// ---------------------------------------------------------------------------
// Globals for fetch + env
// ---------------------------------------------------------------------------

const originalEnv = { ...process.env }

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal("fetch", vi.fn())
  process.env.WHATSAPP_PHONE_NUMBER_ID = "12345"
  process.env.WHATSAPP_ACCESS_TOKEN = "test-token"
})

// Restore env after all tests
afterAll(() => {
  process.env = originalEnv
})

// =============================================================================
// Phone number formatting (tested indirectly via sendWhatsAppMessage)
// =============================================================================

describe("phone number formatting", () => {
  it("strips non-numeric characters except leading +", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ messages: [{ id: "msg-1" }] }),
    })
    vi.stubGlobal("fetch", fetchMock)
    mockDb.whatsAppMessage.create.mockResolvedValue({} as any)

    await sendWhatsAppMessage({ to: "+249-123-456-789", message: "hi" })

    const body = JSON.parse(fetchMock.mock.calls[0]![1].body)
    expect(body.to).toBe("249123456789")
  })

  it("converts local 0-prefix number to Sudan country code", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ messages: [{ id: "msg-2" }] }),
    })
    vi.stubGlobal("fetch", fetchMock)
    mockDb.whatsAppMessage.create.mockResolvedValue({} as any)

    await sendWhatsAppMessage({ to: "0912345678", message: "test" })

    const body = JSON.parse(fetchMock.mock.calls[0]![1].body)
    expect(body.to).toBe("249912345678")
  })

  it("removes leading + for API compatibility", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ messages: [{ id: "msg-3" }] }),
    })
    vi.stubGlobal("fetch", fetchMock)
    mockDb.whatsAppMessage.create.mockResolvedValue({} as any)

    await sendWhatsAppMessage({ to: "+249123456789", message: "test" })

    const body = JSON.parse(fetchMock.mock.calls[0]![1].body)
    expect(body.to).toBe("249123456789")
  })

  it("handles already-clean number without + or 0 prefix", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ messages: [{ id: "msg-4" }] }),
    })
    vi.stubGlobal("fetch", fetchMock)
    mockDb.whatsAppMessage.create.mockResolvedValue({} as any)

    await sendWhatsAppMessage({ to: "249123456789", message: "test" })

    const body = JSON.parse(fetchMock.mock.calls[0]![1].body)
    expect(body.to).toBe("249123456789")
  })
})

// =============================================================================
// sendWhatsAppMessage — text messages
// =============================================================================

describe("sendWhatsAppMessage (text)", () => {
  it("sends a text message with correct body shape", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ messages: [{ id: "wamid-1" }] }),
    })
    vi.stubGlobal("fetch", fetchMock)
    mockDb.whatsAppMessage.create.mockResolvedValue({} as any)

    const result = await sendWhatsAppMessage({ to: "249111222333", message: "Hello" })

    expect(result.success).toBe(true)
    expect(result.messageId).toBe("wamid-1")

    const body = JSON.parse(fetchMock.mock.calls[0]![1].body)
    expect(body.messaging_product).toBe("whatsapp")
    expect(body.type).toBe("text")
    expect(body.text.body).toBe("Hello")
  })

  it("returns error when neither message nor template provided", async () => {
    const result = await sendWhatsAppMessage({ to: "249111222333" })

    expect(result.success).toBe(false)
    expect(result.error).toContain("No message or template")
  })

  it("returns error when WhatsApp is not configured", async () => {
    delete process.env.WHATSAPP_PHONE_NUMBER_ID
    delete process.env.WHATSAPP_ACCESS_TOKEN

    const result = await sendWhatsAppMessage({ to: "249111222333", message: "hi" })

    expect(result.success).toBe(false)
    expect(result.error).toContain("not configured")
  })
})

// =============================================================================
// sendWhatsAppMessage — template messages
// =============================================================================

describe("sendWhatsAppMessage (template)", () => {
  it("sends a template message with parameters", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ messages: [{ id: "wamid-t1" }] }),
    })
    vi.stubGlobal("fetch", fetchMock)
    mockDb.whatsAppMessage.create.mockResolvedValue({} as any)

    const result = await sendWhatsAppMessage({
      to: "249111222333",
      template: "task_assigned",
      parameters: { name: "Ali", task: "Inspection" },
    })

    expect(result.success).toBe(true)

    const body = JSON.parse(fetchMock.mock.calls[0]![1].body)
    expect(body.type).toBe("template")
    expect(body.template.name).toBe("task_assigned")
    expect(body.template.language.code).toBe("ar")
    expect(body.template.components[0].type).toBe("body")
    expect(body.template.components[0].parameters).toHaveLength(2)
    expect(body.template.components[0].parameters[0].text).toBe("Ali")
    expect(body.template.components[0].parameters[1].text).toBe("Inspection")
  })

  it("sends a template without parameters", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ messages: [{ id: "wamid-t2" }] }),
    })
    vi.stubGlobal("fetch", fetchMock)
    mockDb.whatsAppMessage.create.mockResolvedValue({} as any)

    await sendWhatsAppMessage({
      to: "249111222333",
      template: "shipment_delivered",
    })

    const body = JSON.parse(fetchMock.mock.calls[0]![1].body)
    expect(body.template.name).toBe("shipment_delivered")
    expect(body.template.components).toBeUndefined()
  })
})

// =============================================================================
// sendWhatsAppMessage — error handling & logging
// =============================================================================

describe("sendWhatsAppMessage (errors)", () => {
  it("handles API error response and logs failure", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: { message: "Invalid token" } }),
    })
    vi.stubGlobal("fetch", fetchMock)
    mockDb.whatsAppMessage.create.mockResolvedValue({} as any)

    const result = await sendWhatsAppMessage({ to: "249111222333", message: "hi" })

    expect(result.success).toBe(false)
    expect(result.error).toBe("Invalid token")

    // Should log the failed message
    expect(mockDb.whatsAppMessage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: "FAILED",
        templateName: "text",
      }),
    })
  })

  it("handles network/fetch exception", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("Network failure"))
    vi.stubGlobal("fetch", fetchMock)
    mockDb.whatsAppMessage.create.mockResolvedValue({} as any)

    const result = await sendWhatsAppMessage({ to: "249111222333", message: "hi" })

    expect(result.success).toBe(false)
    expect(result.error).toBe("Network failure")
  })

  it("logs successful message with SENT status", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ messages: [{ id: "wamid-log" }] }),
    })
    vi.stubGlobal("fetch", fetchMock)
    mockDb.whatsAppMessage.create.mockResolvedValue({} as any)

    await sendWhatsAppMessage({ to: "249111222333", message: "success" })

    expect(mockDb.whatsAppMessage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: "SENT",
        whatsappMessageId: "wamid-log",
        sentAt: expect.any(Date),
      }),
    })
  })

  it("uses correct API URL with phone number ID", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ messages: [{ id: "msg" }] }),
    })
    vi.stubGlobal("fetch", fetchMock)
    mockDb.whatsAppMessage.create.mockResolvedValue({} as any)

    await sendWhatsAppMessage({ to: "249111222333", message: "url test" })

    const url = fetchMock.mock.calls[0]![0]
    expect(url).toBe("https://graph.facebook.com/v18.0/12345/messages")
  })

  it("sends Authorization header with bearer token", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ messages: [{ id: "msg" }] }),
    })
    vi.stubGlobal("fetch", fetchMock)
    mockDb.whatsAppMessage.create.mockResolvedValue({} as any)

    await sendWhatsAppMessage({ to: "249111222333", message: "auth test" })

    const headers = fetchMock.mock.calls[0]![1].headers
    expect(headers.Authorization).toBe("Bearer test-token")
  })
})

// =============================================================================
// updateWhatsAppMessageStatus
// =============================================================================

describe("updateWhatsAppMessageStatus", () => {
  it("updates status to DELIVERED with timestamp", async () => {
    mockDb.whatsAppMessage.updateMany.mockResolvedValue({ count: 1 } as any)

    const ts = new Date("2025-06-01T10:00:00Z")
    await updateWhatsAppMessageStatus("wamid-100", "DELIVERED", ts)

    expect(mockDb.whatsAppMessage.updateMany).toHaveBeenCalledWith({
      where: { whatsappMessageId: "wamid-100" },
      data: expect.objectContaining({
        status: "DELIVERED",
        deliveredAt: ts,
      }),
    })
  })

  it("updates status to READ with timestamp", async () => {
    mockDb.whatsAppMessage.updateMany.mockResolvedValue({ count: 1 } as any)

    await updateWhatsAppMessageStatus("wamid-200", "READ")

    expect(mockDb.whatsAppMessage.updateMany).toHaveBeenCalledWith({
      where: { whatsappMessageId: "wamid-200" },
      data: expect.objectContaining({
        status: "READ",
        readAt: expect.any(Date),
      }),
    })
  })

  it("updates status to FAILED without extra timestamp fields", async () => {
    mockDb.whatsAppMessage.updateMany.mockResolvedValue({ count: 1 } as any)

    await updateWhatsAppMessageStatus("wamid-300", "FAILED")

    const updateCall = mockDb.whatsAppMessage.updateMany.mock.calls[0]![0]
    expect(updateCall.data.status).toBe("FAILED")
    expect(updateCall.data.deliveredAt).toBeUndefined()
    expect(updateCall.data.readAt).toBeUndefined()
  })

  it("does not throw when updateMany fails", async () => {
    mockDb.whatsAppMessage.updateMany.mockRejectedValue(new Error("DB error"))

    await expect(
      updateWhatsAppMessageStatus("wamid-err", "DELIVERED")
    ).resolves.toBeUndefined()
  })
})

// =============================================================================
// verifyWebhookSignature
// =============================================================================

describe("verifyWebhookSignature", () => {
  it("returns true for valid signature", async () => {
    const crypto = await import("node:crypto")
    const secret = "my-webhook-secret"
    const payload = '{"entry":[{"changes":[]}]}'
    const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex")

    const result = verifyWebhookSignature(`sha256=${expected}`, payload, secret)
    expect(result).toBe(true)
  })

  it("returns false for invalid signature", () => {
    const result = verifyWebhookSignature(
      "sha256=invalid-sig",
      '{"data":"test"}',
      "secret"
    )
    expect(result).toBe(false)
  })

  it("returns false when signature is missing sha256= prefix", async () => {
    const crypto = await import("node:crypto")
    const secret = "sec"
    const payload = "body"
    const hash = crypto.createHmac("sha256", secret).update(payload).digest("hex")

    // Pass raw hash without prefix — should fail because source prepends sha256=
    const result = verifyWebhookSignature(hash, payload, secret)
    expect(result).toBe(false)
  })

  it("handles empty payload", async () => {
    const crypto = await import("node:crypto")
    const secret = "s"
    const payload = ""
    const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex")

    const result = verifyWebhookSignature(`sha256=${expected}`, payload, secret)
    expect(result).toBe(true)
  })
})
