import { describe, it, expect, vi, beforeEach } from "vitest"
import type { AuthContext } from "@/lib/auth-context"

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

import { auth } from "@/auth"
import { canAccessRow, getAuthContext, isStaff, requireStaff } from "@/lib/auth-context"

const staffCtx: AuthContext = {
  userId: "staff-1",
  userType: "STAFF",
  role: "ADMIN",
  email: "admin@abdout.sd",
}

const communityCtx: AuthContext = {
  userId: "community-1",
  userType: "COMMUNITY",
  role: "VIEWER",
  email: "buyer@example.com",
}

describe("auth-context", () => {
  beforeEach(() => {
    vi.mocked(auth).mockReset()
  })

  describe("getAuthContext", () => {
    it("returns null for anonymous requests", async () => {
      vi.mocked(auth).mockResolvedValue(null as never)
      expect(await getAuthContext()).toBeNull()
    })

    it("surfaces userType + role from session", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: {
          id: "u1",
          email: "e@x.sd",
          type: "STAFF",
          role: "MANAGER",
        },
      } as never)
      const ctx = await getAuthContext()
      expect(ctx).toMatchObject({ userType: "STAFF", role: "MANAGER", userId: "u1" })
    })

    it("defaults to COMMUNITY when type missing (legacy session)", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "u1", email: "e@x.sd", role: "VIEWER" },
      } as never)
      const ctx = await getAuthContext()
      expect(ctx?.userType).toBe("COMMUNITY")
    })
  })

  describe("isStaff", () => {
    it("narrows STAFF", () => {
      expect(isStaff(staffCtx)).toBe(true)
      expect(isStaff(communityCtx)).toBe(false)
      expect(isStaff(null)).toBe(false)
    })
  })

  describe("canAccessRow (marketplace ownership)", () => {
    it("staff can always access any row", () => {
      expect(canAccessRow(staffCtx, "someone-else")).toBe(true)
      expect(canAccessRow(staffCtx, null)).toBe(true)
    })

    it("community user can only access own rows", () => {
      expect(canAccessRow(communityCtx, "community-1")).toBe(true)
      expect(canAccessRow(communityCtx, "community-2")).toBe(false)
      expect(canAccessRow(communityCtx, null)).toBe(false)
    })

    it("anonymous cannot access", () => {
      expect(canAccessRow(null, "any")).toBe(false)
    })
  })

  describe("requireStaff", () => {
    it("throws for community users", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "u1", email: "e@x.sd", type: "COMMUNITY", role: "VIEWER" },
      } as never)
      await expect(requireStaff()).rejects.toThrow("Staff access required")
    })

    it("throws for anonymous", async () => {
      vi.mocked(auth).mockResolvedValue(null as never)
      await expect(requireStaff()).rejects.toThrow("Unauthorized")
    })

    it("returns ctx for staff", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "u1", email: "e@x.sd", type: "STAFF", role: "ADMIN" },
      } as never)
      const ctx = await requireStaff()
      expect(ctx.userType).toBe("STAFF")
    })
  })
})
