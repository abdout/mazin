import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/auth", () => ({ auth: vi.fn() }))

import { auth } from "@/auth"
import {
  getTenantContext,
  checkTenantAccess,
  getCurrentUserId,
} from "@/lib/tenant-context"

describe("tenant-context", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("getTenantContext", () => {
    it("returns null when no session", async () => {
      vi.mocked(auth).mockResolvedValue(null as any)
      expect(await getTenantContext()).toBeNull()
    })

    it("returns null when session has no user id", async () => {
      vi.mocked(auth).mockResolvedValue({ user: {} } as any)
      expect(await getTenantContext()).toBeNull()
    })

    it("returns userId when session is valid", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "u-1" } } as any)
      const ctx = await getTenantContext()
      expect(ctx).toEqual({
        userId: "u-1",
        organizationId: undefined,
        companyId: undefined,
      })
    })
  })

  describe("checkTenantAccess", () => {
    it("returns true when authenticated", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "u-1" } } as any)
      expect(await checkTenantAccess()).toBe(true)
    })

    it("returns false when no session", async () => {
      vi.mocked(auth).mockResolvedValue(null as any)
      expect(await checkTenantAccess()).toBe(false)
    })
  })

  describe("getCurrentUserId", () => {
    it("returns user id from session", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "u-42" } } as any)
      expect(await getCurrentUserId()).toBe("u-42")
    })

    it("returns null when no session", async () => {
      vi.mocked(auth).mockResolvedValue(null as any)
      expect(await getCurrentUserId()).toBeNull()
    })
  })
})
