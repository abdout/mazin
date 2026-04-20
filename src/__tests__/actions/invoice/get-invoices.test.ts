import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { getInvoices } from "@/actions/invoice"
import { makeSession, makeInvoice } from "@/__tests__/helpers/factories"

describe("getInvoices", () => {
  const session = makeSession()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(session as any)
  })

  it("throws Unauthorized when no session", async () => {
    vi.mocked(auth).mockResolvedValue(null as any)

    await expect(getInvoices()).rejects.toThrow("Unauthorized")
  })

  it("calls findMany with userId filter", async () => {
    const mockInvoices = [makeInvoice(), makeInvoice()]
    vi.mocked(db.invoice.findMany).mockResolvedValue(mockInvoices as any)

    const result = await getInvoices()

    expect(db.invoice.findMany).toHaveBeenCalledWith({
      where: { userId: "test-user-id" },
      include: { items: true, shipment: true },
      orderBy: { createdAt: "desc" },
    })
    expect(result).toEqual(mockInvoices)
  })

  it("passes status filter when provided", async () => {
    vi.mocked(db.invoice.findMany).mockResolvedValue([])

    await getInvoices({ status: "PAID" })

    expect(db.invoice.findMany).toHaveBeenCalledWith({
      where: { userId: "test-user-id", status: "PAID" },
      include: { items: true, shipment: true },
      orderBy: { createdAt: "desc" },
    })
  })

  it("orders by createdAt desc", async () => {
    vi.mocked(db.invoice.findMany).mockResolvedValue([])

    await getInvoices()

    const call = vi.mocked(db.invoice.findMany).mock.calls[0]![0] as {
      orderBy: Record<string, string>
    }
    expect(call.orderBy).toEqual({ createdAt: "desc" })
  })
})
