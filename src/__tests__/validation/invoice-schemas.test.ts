import { describe, it, expect, vi, beforeEach } from "vitest"

// ---------------------------------------------------------------------------
// Mock all server-side dependencies the invoice module imports
// ---------------------------------------------------------------------------
vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/utils/arabic-numbers", () => ({
  numberToArabicWords: vi.fn().mockReturnValue("mock"),
}))

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { createInvoice, updateInvoice } from "@/actions/invoice"
import { makeSession, makeInvoice } from "@/__tests__/helpers/factories"

// ---------------------------------------------------------------------------
// Because createInvoiceSchema / invoiceItemSchema are NOT exported, we
// exercise them indirectly by calling the server actions with invalid data.
// Zod validation runs synchronously inside the action, so ZodError is thrown
// before any database call is made.
// ---------------------------------------------------------------------------

describe("createInvoice schema validation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(auth).mockResolvedValue(makeSession() as any)
  })

  it("rejects empty object (missing items and currency)", async () => {
    await expect(createInvoice({} as never)).rejects.toThrow()
  })

  it("rejects when items array is empty", async () => {
    await expect(
      createInvoice({ currency: "SDG", items: [] } as never)
    ).rejects.toThrow()
  })

  it("rejects item with missing description", async () => {
    await expect(
      createInvoice({
        currency: "SDG",
        items: [{ quantity: 1, unitPrice: 100 }],
      } as never)
    ).rejects.toThrow()
  })

  it("rejects item with zero quantity", async () => {
    await expect(
      createInvoice({
        currency: "SDG",
        items: [{ description: "Fee", quantity: 0, unitPrice: 100 }],
      } as never)
    ).rejects.toThrow()
  })

  it("rejects item with negative unitPrice", async () => {
    await expect(
      createInvoice({
        currency: "SDG",
        items: [{ description: "Fee", quantity: 1, unitPrice: -50 }],
      } as never)
    ).rejects.toThrow()
  })

  it("rejects invalid currency value", async () => {
    await expect(
      createInvoice({
        currency: "EUR" as never,
        items: [{ description: "Fee", quantity: 1, unitPrice: 100 }],
      })
    ).rejects.toThrow()
  })

  it("rejects invalid invoiceType value", async () => {
    await expect(
      createInvoice({
        currency: "SDG",
        invoiceType: "INVALID" as never,
        items: [{ description: "Fee", quantity: 1, unitPrice: 100 }],
      })
    ).rejects.toThrow()
  })

  it("accepts valid minimal input", async () => {
    vi.mocked(db.invoice.count).mockResolvedValue(0)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(db.invoice.create).mockResolvedValue(makeInvoice() as any)

    await expect(
      createInvoice({
        currency: "SDG",
        items: [{ description: "Customs Fee", quantity: 1, unitPrice: 5000 }],
      })
    ).resolves.toBeDefined()
  })

  it("accepts all three currency values", async () => {
    vi.mocked(db.invoice.count).mockResolvedValue(0)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(db.invoice.create).mockResolvedValue(makeInvoice() as any)

    for (const currency of ["SDG", "USD", "SAR"] as const) {
      await expect(
        createInvoice({
          currency,
          items: [{ description: "Fee", quantity: 1, unitPrice: 100 }],
        })
      ).resolves.toBeDefined()
    }
  })

  it("accepts all four invoiceType values", async () => {
    vi.mocked(db.invoice.count).mockResolvedValue(0)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(db.invoice.create).mockResolvedValue(makeInvoice() as any)

    for (const invoiceType of ["CLEARANCE", "PROFORMA", "STATEMENT", "PORT"] as const) {
      await expect(
        createInvoice({
          currency: "SDG",
          invoiceType,
          items: [{ description: "Fee", quantity: 1, unitPrice: 100 }],
        })
      ).resolves.toBeDefined()
    }
  })

  it("coerces string quantity and unitPrice to numbers", async () => {
    vi.mocked(db.invoice.count).mockResolvedValue(0)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(db.invoice.create).mockResolvedValue(makeInvoice() as any)

    await createInvoice({
      currency: "SDG",
      items: [{ description: "Fee", quantity: "3" as never, unitPrice: "500" as never }],
    })

    const call = vi.mocked(db.invoice.create).mock.calls[0]![0] as {
      data: { subtotal: number }
    }
    // 3 * 500 = 1500
    expect(call.data.subtotal).toBe(1500)
  })
})

describe("updateInvoice schema validation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(auth).mockResolvedValue(makeSession() as any)
  })

  it("rejects when items is empty", async () => {
    // Provide an existing DRAFT invoice for the ownership check
     
    vi.mocked(db.invoice.findFirst).mockResolvedValue(
      makeInvoice({ status: "DRAFT", items: [] }) as any
    )

    await expect(
      updateInvoice("inv-1", { currency: "SDG", items: [] } as never)
    ).rejects.toThrow()
  })

  it("rejects item with empty description", async () => {
     
    vi.mocked(db.invoice.findFirst).mockResolvedValue(
      makeInvoice({ status: "DRAFT", items: [] }) as any
    )

    await expect(
      updateInvoice("inv-1", {
        currency: "SDG",
        items: [{ description: "", quantity: 1, unitPrice: 100 }],
      } as never)
    ).rejects.toThrow()
  })
})
