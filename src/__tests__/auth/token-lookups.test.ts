import { describe, it, expect, vi, beforeEach } from "vitest"
import { db } from "@/lib/db"
import {
  getPasswordResetTokenByToken,
  getPasswordResetTokenByEmail,
} from "@/components/auth/password/token"
import {
  getTwoFactorTokenByToken,
  getTwoFactorTokenByEmail,
} from "@/components/auth/verification/2f-token"
import {
  getVerificationTokenByToken,
  getVerificationTokenByEmail,
} from "@/components/auth/verification/verification-token"
import { getTwoFactorConfirmationByUserId } from "@/components/auth/verification/2f-confirmation"

describe("auth token lookups", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("password reset token", () => {
    it("getPasswordResetTokenByToken returns the token", async () => {
      const token = { id: "t1", token: "abc", email: "x@y.z" }
      vi.mocked(db.passwordResetToken.findUnique).mockResolvedValue(token as any)
      expect(await getPasswordResetTokenByToken("abc")).toEqual(token)
    })

    it("getPasswordResetTokenByToken returns null on db error", async () => {
      vi.mocked(db.passwordResetToken.findUnique).mockRejectedValue(new Error("x"))
      expect(await getPasswordResetTokenByToken("abc")).toBeNull()
    })

    it("getPasswordResetTokenByEmail returns null on db error", async () => {
      vi.mocked(db.passwordResetToken.findFirst).mockRejectedValue(new Error("x"))
      expect(await getPasswordResetTokenByEmail("x@y.z")).toBeNull()
    })

    it("getPasswordResetTokenByEmail returns token on success", async () => {
      const t = { id: "p1", token: "p", email: "x@y.z" }
      vi.mocked(db.passwordResetToken.findFirst).mockResolvedValue(t as any)
      expect(await getPasswordResetTokenByEmail("x@y.z")).toEqual(t)
    })
  })

  describe("2FA token", () => {
    it("getTwoFactorTokenByToken returns null on error", async () => {
      vi.mocked(db.twoFactorToken.findUnique).mockRejectedValue(new Error("x"))
      expect(await getTwoFactorTokenByToken("t")).toBeNull()
    })

    it("getTwoFactorTokenByEmail returns null on error", async () => {
      vi.mocked(db.twoFactorToken.findFirst).mockRejectedValue(new Error("x"))
      expect(await getTwoFactorTokenByEmail("e")).toBeNull()
    })

    it("getTwoFactorTokenByEmail returns token on success", async () => {
      vi.mocked(db.twoFactorToken.findFirst).mockResolvedValue({ id: "1" } as any)
      expect(await getTwoFactorTokenByEmail("x")).toEqual({ id: "1" })
    })
  })

  describe("verification token", () => {
    it("getVerificationTokenByToken returns null on error", async () => {
      vi.mocked(db.verificationToken.findUnique).mockRejectedValue(new Error("x"))
      expect(await getVerificationTokenByToken("t")).toBeNull()
    })

    it("getVerificationTokenByEmail returns null on error", async () => {
      vi.mocked(db.verificationToken.findFirst).mockRejectedValue(new Error("x"))
      expect(await getVerificationTokenByEmail("e")).toBeNull()
    })

    it("returns token on success", async () => {
      vi.mocked(db.verificationToken.findUnique).mockResolvedValue({ id: "v" } as any)
      expect(await getVerificationTokenByToken("t")).toEqual({ id: "v" })
    })
  })

  describe("2FA confirmation", () => {
    it("getTwoFactorConfirmationByUserId returns null on error", async () => {
      vi.mocked(db.twoFactorConfirmation.findUnique).mockRejectedValue(new Error("x"))
      expect(await getTwoFactorConfirmationByUserId("u")).toBeNull()
    })

    it("returns the confirmation when present", async () => {
      vi.mocked(db.twoFactorConfirmation.findUnique).mockResolvedValue({
        id: "c",
        userId: "u",
      } as any)
      expect(await getTwoFactorConfirmationByUserId("u")).toEqual({
        id: "c",
        userId: "u",
      })
    })
  })
})
