import { describe, it, expect, vi, beforeEach } from "vitest"
import { db } from "@/lib/db"
import { getAccountByUserId } from "@/components/auth/account"

describe("getAccountByUserId", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns the account from findFirst", async () => {
    const account = { id: "a1", userId: "u1", provider: "google" }
    vi.mocked(db.account.findFirst).mockResolvedValue(account as any)
    const result = await getAccountByUserId("u1")
    expect(result).toEqual(account)
    expect(db.account.findFirst).toHaveBeenCalledWith({ where: { userId: "u1" } })
  })

  it("returns null when Prisma call throws", async () => {
    vi.mocked(db.account.findFirst).mockRejectedValue(new Error("db offline"))
    const result = await getAccountByUserId("u1")
    expect(result).toBeNull()
  })

  it("returns null when account not found", async () => {
    vi.mocked(db.account.findFirst).mockResolvedValue(null)
    expect(await getAccountByUserId("u-none")).toBeNull()
  })
})
