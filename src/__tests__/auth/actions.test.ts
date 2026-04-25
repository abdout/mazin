import { describe, it, expect, vi, beforeEach } from "vitest"

// --- mocks -----------------------------------------------------------------
vi.mock("@/components/auth/mail", () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
  sendTwoFactorTokenEmail: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/components/auth/tokens", () => ({
  generateVerificationToken: vi
    .fn()
    .mockResolvedValue({ email: "u@x.com", token: "v-tok" }),
  generatePasswordResetToken: vi
    .fn()
    .mockResolvedValue({ email: "u@x.com", token: "r-tok" }),
  generateTwoFactorToken: vi
    .fn()
    .mockResolvedValue({ email: "u@x.com", token: "2-tok" }),
}))

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed"),
  },
}))

import { db } from "@/lib/db"
import { sendVerificationEmail, sendPasswordResetEmail } from "@/components/auth/mail"
import { newPassword } from "@/components/auth/password/action"
import { newVerification } from "@/components/auth/verification/action"
import { reset } from "@/components/auth/reset/action"
import { register } from "@/components/auth/join/action"

describe("auth actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ----- register ---------------------------------------------------------
  describe("register", () => {
    it("rejects invalid fields", async () => {
      const result = await register({
        email: "bad",
        password: "a",
        name: "",
      } as any)
      expect(result).toEqual({ error: "Invalid fields!" })
    })

    it("rejects existing email", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue({ id: "u1" } as any)
      const result = await register({
        email: "u@x.com",
        password: "Password123",
        name: "Test",
      })
      expect(result).toEqual({ error: "Email already in use!" })
    })

    it("creates user, sends verification email on success", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(null)
      vi.mocked(db.user.create).mockResolvedValue({ id: "new" } as any)

      const result = await register({
        email: "u@x.com",
        password: "Password123",
        name: "Test",
      })

      expect(db.user.create).toHaveBeenCalled()
      expect(sendVerificationEmail).toHaveBeenCalledWith("u@x.com", "v-tok")
      expect(result).toEqual({ success: "Confirmation email sent!" })
    })
  })

  // ----- reset ------------------------------------------------------------
  describe("reset", () => {
    it("rejects invalid email", async () => {
      const result = await reset({ email: "not-an-email" } as any)
      expect(result).toEqual({ error: "Invalid emaiL!" })
    })

    it("returns error when email not registered", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(null)
      const result = await reset({ email: "u@x.com" })
      expect(result).toEqual({ error: "Email not found!" })
    })

    it("generates token and sends reset email on success", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue({ id: "u1" } as any)
      const result = await reset({ email: "u@x.com" })
      expect(sendPasswordResetEmail).toHaveBeenCalledWith("u@x.com", "r-tok")
      expect(result).toEqual({ success: "Reset email sent!" })
    })
  })

  // ----- newPassword ------------------------------------------------------
  describe("newPassword", () => {
    it("requires a token", async () => {
      const result = await newPassword({ password: "new-password" } as any, null)
      expect(result).toEqual({ error: "Missing token!" })
    })

    it("rejects invalid fields", async () => {
      const result = await newPassword({ password: "x" } as any, "tok")
      expect(result).toEqual({ error: "Invalid fields!" })
    })

    it("rejects unknown token", async () => {
      vi.mocked(db.passwordResetToken.findUnique).mockResolvedValue(null)
      const result = await newPassword({ password: "Password123" } as any, "tok")
      expect(result).toEqual({ error: "Invalid token!" })
    })

    it("rejects expired token", async () => {
      vi.mocked(db.passwordResetToken.findUnique).mockResolvedValue({
        id: "r1",
        email: "u@x.com",
        token: "tok",
        expires: new Date("2020-01-01"),
      } as any)
      const result = await newPassword({ password: "Password123" } as any, "tok")
      expect(result).toEqual({ error: "Token has expired!" })
    })

    it("rejects when email no longer registered", async () => {
      vi.mocked(db.passwordResetToken.findUnique).mockResolvedValue({
        id: "r1",
        email: "u@x.com",
        token: "tok",
        expires: new Date(Date.now() + 60_000),
      } as any)
      vi.mocked(db.user.findUnique).mockResolvedValue(null)
      const result = await newPassword({ password: "Password123" } as any, "tok")
      expect(result).toEqual({ error: "Email does not exist!" })
    })

    it("hashes password, updates user, deletes token on success", async () => {
      vi.mocked(db.passwordResetToken.findUnique).mockResolvedValue({
        id: "r1",
        email: "u@x.com",
        token: "tok",
        expires: new Date(Date.now() + 60_000),
      } as any)
      vi.mocked(db.user.findUnique).mockResolvedValue({ id: "u1" } as any)
      vi.mocked(db.user.update).mockResolvedValue({ id: "u1" } as any)
      vi.mocked(db.passwordResetToken.delete).mockResolvedValue({} as any)

      const result = await newPassword({ password: "Password123" } as any, "tok")
      expect(result).toEqual({ success: "Password updated!" })
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: "u1" },
        data: { password: "hashed" },
      })
      expect(db.passwordResetToken.delete).toHaveBeenCalled()
    })
  })

  // ----- newVerification --------------------------------------------------
  describe("newVerification", () => {
    it("reports already-verified when token missing but user verified", async () => {
      vi.mocked(db.verificationToken.findUnique).mockResolvedValue(null)
      vi.mocked(db.user.findUnique).mockResolvedValue({
        id: "u1",
        email: "u@x.com",
        emailVerified: new Date(),
      } as any)
      const result = await newVerification("tok")
      expect(result).toEqual({ success: "Email already verified!" })
    })

    it("reports missing token error when token not found and user not verified", async () => {
      vi.mocked(db.verificationToken.findUnique).mockResolvedValue(null)
      vi.mocked(db.user.findUnique).mockResolvedValue(null)
      const result = await newVerification("tok")
      expect(result).toEqual({ error: "Token does not exist!" })
    })

    it("reports expiry when token past its expiry", async () => {
      vi.mocked(db.verificationToken.findUnique).mockResolvedValue({
        id: "v1",
        email: "u@x.com",
        expires: new Date("2020-01-01"),
      } as any)
      const result = await newVerification("tok")
      expect(result).toEqual({ error: "Token has expired!" })
    })

    it("marks user as verified when valid token", async () => {
      vi.mocked(db.verificationToken.findUnique).mockResolvedValue({
        id: "v1",
        email: "u@x.com",
        expires: new Date(Date.now() + 60_000),
      } as any)
      vi.mocked(db.user.findUnique).mockResolvedValue({
        id: "u1",
        email: "u@x.com",
        emailVerified: null,
      } as any)
      vi.mocked(db.user.update).mockResolvedValue({} as any)
      vi.mocked(db.verificationToken.delete).mockResolvedValue({} as any)

      const result = await newVerification("tok")
      expect(result).toEqual({ success: "Email verified!" })
      expect(db.user.update).toHaveBeenCalled()
      expect(db.verificationToken.delete).toHaveBeenCalled()
    })

    it("returns success when user already verified with a valid token", async () => {
      vi.mocked(db.verificationToken.findUnique).mockResolvedValue({
        id: "v1",
        email: "u@x.com",
        expires: new Date(Date.now() + 60_000),
      } as any)
      vi.mocked(db.user.findUnique).mockResolvedValue({
        id: "u1",
        email: "u@x.com",
        emailVerified: new Date(),
      } as any)

      const result = await newVerification("tok")
      expect(result).toEqual({ success: "Email verified!" })
      expect(db.user.update).not.toHaveBeenCalled()
    })
  })
})
