import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { updateInvoice } from "@/actions/invoice"
import { makeSession, makeInvoice, makeInvoiceItem } from "@/__tests__/helpers/factories"

describe("updateInvoice", () => {
  const session = makeSession()
  const invoiceId = "inv-1"

  const validFormData = {
    currency: "SDG" as const,
    items: [{ id: "item-1", description: "Updated fee", quantity: 2, unitPrice: 500 }],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(session as any)
    // Re-establish $transaction after clearAllMocks wipes its implementation
    vi.mocked(db.$transaction).mockImplementation((fn: unknown) => {
      if (typeof fn === "function") return fn(db)
      return Promise.resolve(fn)
    })
  })

  it("throws Unauthorized when no session", async () => {
    vi.mocked(auth).mockResolvedValue(null as any)

    await expect(updateInvoice(invoiceId, validFormData)).rejects.toThrow(
      "Unauthorized"
    )
  })

  it("throws Invoice not found when findFirst returns null (ownership check)", async () => {
    vi.mocked(db.invoice.findFirst).mockResolvedValue(null)

    await expect(updateInvoice(invoiceId, validFormData)).rejects.toThrow(
      "Invoice not found"
    )
  })

  it("throws Cannot edit a paid or cancelled invoice for PAID status", async () => {
    vi.mocked(db.invoice.findFirst).mockResolvedValue(
      makeInvoice({ id: invoiceId, status: "PAID", items: [] }) as any
     )

    await expect(updateInvoice(invoiceId, validFormData)).rejects.toThrow(
      "Cannot edit a paid or cancelled invoice"
    )
  })

  it("throws Cannot edit a paid or cancelled invoice for CANCELLED status", async () => {
    vi.mocked(db.invoice.findFirst).mockResolvedValue(
      makeInvoice({ id: invoiceId, status: "CANCELLED", items: [] }) as any
     )

    await expect(updateInvoice(invoiceId, validFormData)).rejects.toThrow(
      "Cannot edit a paid or cancelled invoice"
    )
  })

  it("calls $transaction for updates", async () => {
    const existingItem = makeInvoiceItem({ id: "item-1", invoiceId })
    vi.mocked(db.invoice.findFirst).mockResolvedValue(
      makeInvoice({ id: invoiceId, status: "DRAFT", items: [existingItem] }) as any
     )
    vi.mocked(db.invoiceItem.deleteMany).mockResolvedValue({ count: 0 })
    vi.mocked(db.invoiceItem.update).mockResolvedValue(existingItem as any)
    vi.mocked(db.invoice.update).mockResolvedValue(makeInvoice({ id: invoiceId }) as any)

    await updateInvoice(invoiceId, validFormData)

    // $transaction receives a callback, and our mock passes `db` as tx
    expect(db.$transaction).toHaveBeenCalledTimes(1)
    expect(db.$transaction).toHaveBeenCalledWith(expect.any(Function))
  })

  it("revalidates both list and detail paths", async () => {
    const existingItem = makeInvoiceItem({ id: "item-1", invoiceId })
    vi.mocked(db.invoice.findFirst).mockResolvedValue(
      makeInvoice({ id: invoiceId, status: "DRAFT", items: [existingItem] }) as any
     )
    vi.mocked(db.invoiceItem.deleteMany).mockResolvedValue({ count: 0 })
    vi.mocked(db.invoiceItem.update).mockResolvedValue(existingItem as any)
    vi.mocked(db.invoice.update).mockResolvedValue(makeInvoice({ id: invoiceId }) as any)

    await updateInvoice(invoiceId, validFormData)

    expect(revalidatePath).toHaveBeenCalledWith("/invoice")
    expect(revalidatePath).toHaveBeenCalledWith(`/invoice/${invoiceId}`)
  })

  it("deletes removed items and creates new ones within the transaction", async () => {
    const keepItem = makeInvoiceItem({ id: "item-keep", invoiceId })
    const removeItem = makeInvoiceItem({ id: "item-remove", invoiceId })
    vi.mocked(db.invoice.findFirst).mockResolvedValue(
      makeInvoice({
        id: invoiceId,
        status: "DRAFT",
        items: [keepItem, removeItem],
      }) as any
     )
    vi.mocked(db.invoiceItem.deleteMany).mockResolvedValue({ count: 1 })
    vi.mocked(db.invoiceItem.update).mockResolvedValue(keepItem as any)
    vi.mocked(db.invoiceItem.create).mockResolvedValue(
      makeInvoiceItem({ invoiceId }) as any
     )
    vi.mocked(db.invoice.update).mockResolvedValue(makeInvoice({ id: invoiceId }) as any)

    await updateInvoice(invoiceId, {
      currency: "SDG",
      items: [
        { id: "item-keep", description: "Kept", quantity: 1, unitPrice: 100 },
        { description: "Brand new", quantity: 3, unitPrice: 200 },
      ],
    })

    // Verify $transaction was called and its callback executed
    expect(db.$transaction).toHaveBeenCalledTimes(1)

    // item-remove should be deleted (not in new list)
    expect(db.invoiceItem.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ["item-remove"] } },
    })

    // item-keep should be updated
    expect(db.invoiceItem.update).toHaveBeenCalledWith({
      where: { id: "item-keep" },
      data: {
        description: "Kept",
        quantity: 1,
        unitPrice: 100,
        total: 100,
      },
    })

    // new item should be created via createMany (batched)
    expect(db.invoiceItem.createMany).toHaveBeenCalledTimes(1)
    expect(db.invoiceItem.createMany).toHaveBeenCalledWith({
      data: [
        {
          invoiceId,
          description: "Brand new",
          quantity: 3,
          unitPrice: 200,
          total: 600,
        },
      ],
    })

    // invoice totals updated: subtotal = 100 + 600 = 700, tax = 700*0.17 = 119, total = 819
    const updateCall = vi.mocked(db.invoice.update).mock.calls[0]![0] as {
      data: Record<string, unknown>
    }
    expect(updateCall.data.subtotal).toBe(700)
    expect(updateCall.data.tax).toBeCloseTo(119, 5)
    expect(updateCall.data.total).toBeCloseTo(819, 5)
  })
})
