import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { upsertCompanySettings } from "../organization/actions"
import { makeSession } from "@/__tests__/helpers/factories"

const USER_A = "user-a"

const VALID_INPUT = {
  companyName: "Port Sudan Clearance Co.",
  companyNameAr: "شركة مازن للتخليص الجمركي",
  taxId: "TAX-001",
  email: "office@example.com",
  phone: "+249111111111",
  website: "https://example.com",
  address1: "Main Road",
  address2: "",
  city: "Port Sudan",
  state: "Red Sea",
  country: "SD",
  postalCode: "",
  bankName: "Bank of Khartoum",
  bankBranch: "Port Sudan",
  accountName: "Mazin LLC",
  accountNumber: "1234567890",
  iban: "",
  swiftCode: "",
  invoicePrefix: "INV",
  defaultCurrency: "SDG",
  defaultTaxRate: 15,
  defaultPaymentTerms: 30,
}

describe("settings organization actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(
      makeSession({ user: { id: USER_A, role: "ADMIN", name: "A", email: "a@t" } }) as any
    )
  })

  it("rejects unauthenticated callers", async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as any)
    const res = await upsertCompanySettings(VALID_INPUT)
    expect(res.ok).toBe(false)
    expect(db.companySettings.upsert).not.toHaveBeenCalled()
  })

  it("rejects missing companyName with INVALID_INPUT", async () => {
    const res = await upsertCompanySettings({ ...VALID_INPUT, companyName: "" })
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.error).toBe("INVALID_INPUT")
      expect(res.issues?.companyName).toBeDefined()
    }
  })

  it("rejects invalid website URL", async () => {
    const res = await upsertCompanySettings({ ...VALID_INPUT, website: "not-a-url" })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.issues?.website).toBeDefined()
  })

  it("scopes upsert by userId (not by id) so one row exists per tenant", async () => {
    vi.mocked(db.companySettings.upsert).mockResolvedValue({ id: "cs-1" } as any)
    await upsertCompanySettings(VALID_INPUT)
    const call = vi.mocked(db.companySettings.upsert).mock.calls[0]?.[0] as any
    expect(call.where).toEqual({ userId: USER_A })
    expect(call.create.userId).toBe(USER_A)
    // update must NOT reset userId (Prisma would reject but we want to see
    // the intent in the test)
    expect(call.update.userId).toBeUndefined()
  })

  it("normalizes empty strings to null in persisted payload", async () => {
    vi.mocked(db.companySettings.upsert).mockResolvedValue({ id: "cs-1" } as any)
    await upsertCompanySettings(VALID_INPUT)
    const call = vi.mocked(db.companySettings.upsert).mock.calls[0]?.[0] as any
    // Intentionally empty in VALID_INPUT: address2, postalCode, iban, swiftCode
    expect(call.create.address2).toBeNull()
    expect(call.create.postalCode).toBeNull()
    expect(call.create.iban).toBeNull()
    expect(call.create.swiftCode).toBeNull()
  })

  it("returns ok with the upserted id on success", async () => {
    vi.mocked(db.companySettings.upsert).mockResolvedValue({ id: "cs-1" } as any)
    const res = await upsertCompanySettings(VALID_INPUT)
    expect(res.ok).toBe(true)
    if (res.ok) expect(res.data.id).toBe("cs-1")
  })
})
