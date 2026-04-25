/**
 * Verifies that marketplace actions enforce row-level ownership: a community
 * user cannot update another community user's listing; staff can override.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), unstable_cache: (fn: unknown) => fn }))
vi.mock("next/headers", () => ({ headers: async () => new Headers() }))
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: () => ({ limited: false }),
  getClientIp: () => "127.0.0.1",
}))

const authMock = vi.fn()
vi.mock("@/auth", () => ({ auth: () => authMock() }))

const findUnique = vi.fn()
const update = vi.fn()
vi.mock("@/lib/db", () => ({
  db: {
    serviceListing: {
      findUnique: (args: unknown) => findUnique(args),
      update: (args: unknown) => update(args),
    },
  },
}))

import { updateServiceListing } from "@/components/platform/marketplace/actions"

describe("marketplace ownership enforcement", () => {
  beforeEach(() => {
    authMock.mockReset()
    findUnique.mockReset()
    update.mockReset()
    update.mockResolvedValue({ id: "listing-1" })
  })

  it("allows vendor owner to update their listing", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1", role: "VIEWER" } })
    findUnique.mockResolvedValue({
      id: "listing-1",
      vendor: { userId: "user-1" },
    })
    const result = await updateServiceListing("listing-1", { title: "New title" })
    expect(result.success).toBe(true)
    expect(update).toHaveBeenCalled()
  })

  it("rejects non-owner updates", async () => {
    authMock.mockResolvedValue({ user: { id: "user-2", role: "VIEWER" } })
    findUnique.mockResolvedValue({
      id: "listing-1",
      vendor: { userId: "user-1" },
    })
    const result = await updateServiceListing("listing-1", { title: "Hijack" })
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/Not authorized/)
    expect(update).not.toHaveBeenCalled()
  })

  it("ADMIN can update any listing (moderation)", async () => {
    authMock.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } })
    findUnique.mockResolvedValue({
      id: "listing-1",
      vendor: { userId: "user-1" },
    })
    const result = await updateServiceListing("listing-1", { title: "Moderated" })
    expect(result.success).toBe(true)
    expect(update).toHaveBeenCalled()
  })

  it("rejects unauthenticated updates", async () => {
    authMock.mockResolvedValue(null)
    const result = await updateServiceListing("listing-1", { title: "x" })
    expect(result.success).toBe(false)
    expect(result.error).toBe("Not authenticated")
  })
})
