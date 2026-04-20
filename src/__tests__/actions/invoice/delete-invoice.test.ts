import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { deleteInvoice } from "@/actions/invoice"
import { makeSession, makeInvoice } from "@/__tests__/helpers/factories"

describe("deleteInvoice", () => {
  const session = makeSession()
  const invoiceId = "inv-1"

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(session as any)
  })

  it("throws Unauthorized when no session", async () => {
    vi.mocked(auth).mockResolvedValue(null as any)

    await expect(deleteInvoice(invoiceId)).rejects.toThrow("Unauthorized")
  })

  it("throws Invoice not found when not owned by user", async () => {
    vi.mocked(db.invoice.findFirst).mockResolvedValue(null)

    await expect(deleteInvoice(invoiceId)).rejects.toThrow("Invoice not found")

    expect(db.invoice.findFirst).toHaveBeenCalledWith({
      where: { id: invoiceId, userId: "test-user-id" },
    })
  })

  it("deletes invoice and revalidates path", async () => {
    vi.mocked(db.invoice.findFirst).mockResolvedValue(
      makeInvoice({ id: invoiceId }) as any
    )
    vi.mocked(db.invoice.delete).mockResolvedValue(
      makeInvoice({ id: invoiceId }) as any
    )

    await deleteInvoice(invoiceId)

    expect(db.invoice.delete).toHaveBeenCalledWith({
      where: { id: invoiceId },
    })
    expect(revalidatePath).toHaveBeenCalledWith("/invoice")
  })

  it("does not delete when ownership check fails", async () => {
    vi.mocked(db.invoice.findFirst).mockResolvedValue(null)

    await expect(deleteInvoice(invoiceId)).rejects.toThrow("Invoice not found")

    expect(db.invoice.delete).not.toHaveBeenCalled()
  })
})
