import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/utils/arabic-numbers", () => ({
  numberToArabicWords: vi.fn().mockReturnValue("mock-arabic-words"),
}))

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { generateStatementOfAccount } from "@/actions/invoice"
import { makeSession, makeClient, makeInvoice } from "@/__tests__/helpers/factories"

describe("generateStatementOfAccount", () => {
  const session = makeSession()

  const validFormData = {
    clientId: "client-1",
    periodStart: "2026-01-01",
    periodEnd: "2026-03-31",
    openingBalance: 0,
    currency: "SDG" as const,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(session as any)
  })

  it("throws Unauthorized when no session", async () => {
    vi.mocked(auth).mockResolvedValue(null as any)

    await expect(generateStatementOfAccount(validFormData)).rejects.toThrow(
      "Unauthorized"
    )
  })

  it("throws Client not found for invalid clientId", async () => {
    vi.mocked(db.client.findFirst).mockResolvedValue(null)

    await expect(generateStatementOfAccount(validFormData)).rejects.toThrow(
      "Client not found"
    )
  })

  it("creates statement with correct running balance", async () => {
    const client = makeClient({ id: "client-1" })
    vi.mocked(db.client.findFirst).mockResolvedValue(client as any)

    const inv1 = makeInvoice({ id: "i1", total: 5000, invoiceNumber: "1/26", createdAt: new Date("2026-01-15") })
    const inv2 = makeInvoice({ id: "i2", total: 3000, invoiceNumber: "2/26", createdAt: new Date("2026-02-10") })
    vi.mocked(db.invoice.findMany).mockResolvedValue([inv1, inv2] as any)
    vi.mocked(db.statementOfAccount.count).mockResolvedValue(2)
    vi.mocked(db.statementOfAccount.create).mockResolvedValue({
      id: "soa-1",
      statementNumber: "SOA-2026/003",
      entries: [],
      client,
    } as any as any)

    await generateStatementOfAccount(validFormData)

    const createCall = vi.mocked(db.statementOfAccount.create).mock.calls[0]![0] as {
      data: Record<string, unknown>
    }

    // openingBalance=0, inv1=5000, inv2=3000
    // totalDebits = 5000 + 3000 = 8000
    // totalCredits = 0
    // closingBalance = 0 + 8000 - 0 = 8000
    expect(createCall.data.totalDebits).toBe(8000)
    expect(createCall.data.totalCredits).toBe(0)
    expect(createCall.data.closingBalance).toBe(8000)
    expect(createCall.data.openingBalance).toBe(0)

    // Verify entries have running balances
    const entries = (createCall.data.entries as { create: Array<Record<string, unknown>> }).create
    expect(entries).toHaveLength(2)
    // After first invoice: 0 + 5000 = 5000
    expect(entries[0]!.debit).toBe(5000)
    expect(entries[0]!.balance).toBe(5000)
    expect(entries[0]!.invoiceId).toBe("i1")
    // After second invoice: 5000 + 3000 = 8000
    expect(entries[1]!.debit).toBe(3000)
    expect(entries[1]!.balance).toBe(8000)
    expect(entries[1]!.invoiceId).toBe("i2")
  })

  it("generates statement number format SOA-YYYY/NNN", async () => {
    vi.mocked(db.client.findFirst).mockResolvedValue(makeClient({ id: "client-1" }) as any)
    vi.mocked(db.invoice.findMany).mockResolvedValue([])
    vi.mocked(db.statementOfAccount.count).mockResolvedValue(4)
    vi.mocked(db.statementOfAccount.create).mockResolvedValue({
      id: "soa-1",
      statementNumber: "SOA-2026/005",
      entries: [],
      client: makeClient(),
    } as any as any)

    await generateStatementOfAccount(validFormData)

    const createCall = vi.mocked(db.statementOfAccount.create).mock.calls[0]![0] as {
      data: Record<string, unknown>
    }
    const year = new Date().getFullYear()
    // count=4 → sequence = 5 → "005"
    expect(createCall.data.statementNumber).toBe(`SOA-${year}/005`)
  })

  it("accounts for opening balance in running totals", async () => {
    vi.mocked(db.client.findFirst).mockResolvedValue(makeClient({ id: "client-1" }) as any)

    const inv1 = makeInvoice({ id: "i1", total: 2000, invoiceNumber: "1/26", createdAt: new Date("2026-01-15") })
    vi.mocked(db.invoice.findMany).mockResolvedValue([inv1] as any)
    vi.mocked(db.statementOfAccount.count).mockResolvedValue(0)
    vi.mocked(db.statementOfAccount.create).mockResolvedValue({
      id: "soa-1",
      statementNumber: "SOA-2026/001",
      entries: [],
      client: makeClient(),
    } as any as any)

    await generateStatementOfAccount({
      ...validFormData,
      openingBalance: 1500,
    })

    const createCall = vi.mocked(db.statementOfAccount.create).mock.calls[0]![0] as {
      data: Record<string, unknown>
    }

    // openingBalance=1500, inv1=2000
    // running: 1500 + 2000 = 3500
    // closingBalance = 1500 + 2000 - 0 = 3500
    expect(createCall.data.openingBalance).toBe(1500)
    expect(createCall.data.closingBalance).toBe(3500)

    const entries = (createCall.data.entries as { create: Array<Record<string, unknown>> }).create
    expect(entries[0]!.balance).toBe(3500)
  })

  it("calls revalidatePath after creation", async () => {
    vi.mocked(db.client.findFirst).mockResolvedValue(makeClient({ id: "client-1" }) as any)
    vi.mocked(db.invoice.findMany).mockResolvedValue([])
    vi.mocked(db.statementOfAccount.count).mockResolvedValue(0)
    vi.mocked(db.statementOfAccount.create).mockResolvedValue({
      id: "soa-1",
      statementNumber: "SOA-2026/001",
      entries: [],
      client: makeClient(),
    } as any as any)

    await generateStatementOfAccount(validFormData)

    expect(revalidatePath).toHaveBeenCalledWith("/invoice")
  })
})
