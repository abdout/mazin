import { describe, it, expect, vi, beforeEach } from "vitest"

import { db } from "@/lib/db"
import { getUserByEmail, getUserById } from "@/components/auth/user"
import { makeUser } from "@/__tests__/helpers/factories"

describe("User Lookup Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================
  // getUserByEmail
  // ============================================
  describe("getUserByEmail", () => {
    it("returns user when found", async () => {
      const mockUser = makeUser({ email: "found@test.com" })
      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser)

      const result = await getUserByEmail("found@test.com")

      expect(db.user.findUnique).toHaveBeenCalledWith({ where: { email: "found@test.com" } })
      expect(result).toEqual(mockUser)
    })

    it("returns null when user not found", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(null)

      const result = await getUserByEmail("nonexistent@test.com")

      expect(result).toBeNull()
    })

    it("returns null when db throws an error", async () => {
      vi.mocked(db.user.findUnique).mockRejectedValue(new Error("DB connection lost"))

      const result = await getUserByEmail("error@test.com")

      expect(result).toBeNull()
    })
  })

  // ============================================
  // getUserById
  // ============================================
  describe("getUserById", () => {
    it("returns user when found", async () => {
      const mockUser = makeUser({ id: "user-123" })
      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser)

      const result = await getUserById("user-123")

      expect(db.user.findUnique).toHaveBeenCalledWith({ where: { id: "user-123" } })
      expect(result).toEqual(mockUser)
    })

    it("returns null when user not found", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(null)

      const result = await getUserById("nonexistent-id")

      expect(result).toBeNull()
    })

    it("returns null when db throws an error", async () => {
      vi.mocked(db.user.findUnique).mockRejectedValue(new Error("DB timeout"))

      const result = await getUserById("error-id")

      expect(result).toBeNull()
    })
  })
})
