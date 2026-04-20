import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { updateInvoiceStatus } from "@/actions/invoice"
import { makeSession, makeInvoice } from "@/__tests__/helpers/factories"

describe("updateInvoiceStatus", () => {
  const session = makeSession()
  const invoiceId = "inv-1"

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(session as any)
  })

  it("throws Unauthorized when no session", async () => {
    vi.mocked(auth).mockResolvedValue(null as any)

    await expect(updateInvoiceStatus(invoiceId, "PAID")).rejects.toThrow(
      "Unauthorized"
    )
  })

  it("throws Invoice not found when not owned by user", async () => {
    vi.mocked(db.invoice.findFirst).mockResolvedValue(null)

    await expect(updateInvoiceStatus(invoiceId, "SENT")).rejects.toThrow(
      "Invoice not found"
    )

    expect(db.invoice.findFirst).toHaveBeenCalledWith({
      where: { id: invoiceId, userId: "test-user-id" },
    })
  })

  it("updates status successfully", async () => {
    vi.mocked(db.invoice.findFirst).mockResolvedValue(
      makeInvoice({ id: invoiceId }) as any
     )
    vi.mocked(db.invoice.update).mockResolvedValue(
      makeInvoice({ id: invoiceId, status: "SENT" }) as any
     )

    const result = await updateInvoiceStatus(invoiceId, "SENT")

    expect(db.invoice.update).toHaveBeenCalledWith({
      where: { id: invoiceId },
      data: { status: "SENT" },
    })
    expect(result.status).toBe("SENT")
    expect(revalidatePath).toHaveBeenCalledWith("/invoice")
    expect(revalidatePath).toHaveBeenCalledWith(`/invoice/${invoiceId}`)
  })

  it('sets paidAt when status is "PAID"', async () => {
    vi.mocked(db.invoice.findFirst).mockResolvedValue(
      makeInvoice({ id: invoiceId }) as any
     )
    vi.mocked(db.invoice.update).mockResolvedValue(
      makeInvoice({ id: invoiceId, status: "PAID", paidAt: new Date() }) as any
     )

    await updateInvoiceStatus(invoiceId, "PAID")

    const updateCall = vi.mocked(db.invoice.update).mock.calls[0]![0] as {
      data: Record<string, unknown>
    }
    expect(updateCall.data.status).toBe("PAID")
    expect(updateCall.data.paidAt).toBeInstanceOf(Date)
  })

  it("does not set paidAt for non-PAID statuses", async () => {
    vi.mocked(db.invoice.findFirst).mockResolvedValue(
      makeInvoice({ id: invoiceId }) as any
     )
    vi.mocked(db.invoice.update).mockResolvedValue(
      makeInvoice({ id: invoiceId, status: "OVERDUE" }) as any
     )

    await updateInvoiceStatus(invoiceId, "OVERDUE")

    const updateCall = vi.mocked(db.invoice.update).mock.calls[0]![0] as {
      data: Record<string, unknown>
    }
    expect(updateCall.data.status).toBe("OVERDUE")
    expect(updateCall.data).not.toHaveProperty("paidAt")
  })
})
