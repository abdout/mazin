import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/components/auth/verification/2f-token", () => ({
  getTwoFactorTokenByEmail: vi.fn(),
}))
vi.mock("@/components/auth/password/token", () => ({
  getPasswordResetTokenByEmail: vi.fn(),
}))
vi.mock("@/components/auth/verification/verification-token", () => ({
  getVerificationTokenByEmail: vi.fn(),
}))

import { db } from "@/lib/db"
import { getTwoFactorTokenByEmail } from "@/components/auth/verification/2f-token"
import { getPasswordResetTokenByEmail } from "@/components/auth/password/token"
import { getVerificationTokenByEmail } from "@/components/auth/verification/verification-token"
import {
  generateTwoFactorToken,
  generatePasswordResetToken,
  generateVerificationToken,
} from "@/components/auth/tokens"

describe("Auth Token Generation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================
  // generateTwoFactorToken
  // ============================================
  describe("generateTwoFactorToken", () => {
    it("creates a 6-digit token with 5-minute expiry", async () => {
      vi.mocked(getTwoFactorTokenByEmail).mockResolvedValue(null)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(db.twoFactorToken.create).mockImplementation(((args: any) => Promise.resolve(args.data)) as any)

      const result = await generateTwoFactorToken("user@test.com")

      expect(db.twoFactorToken.create).toHaveBeenCalledTimes(1)
      const createCall = vi.mocked(db.twoFactorToken.create).mock.calls[0]![0] as {
        data: { email: string; token: string; expires: Date }
      }
      expect(createCall.data.email).toBe("user@test.com")
      // Token is a 6-digit numeric string (100000-999999)
      expect(createCall.data.token).toMatch(/^\d{6}$/)
      // Expires about 5 minutes from now
      const expectedExpiry = Date.now() + 5 * 60 * 1000
      expect(createCall.data.expires.getTime()).toBeGreaterThan(Date.now())
      expect(createCall.data.expires.getTime()).toBeLessThanOrEqual(expectedExpiry + 1000)
    })

    it("deletes existing token before creating new one", async () => {
      vi.mocked(getTwoFactorTokenByEmail).mockResolvedValue({
        id: "old-token-id",
        email: "user@test.com",
        token: "123456",
        expires: new Date(),
      })
      vi.mocked(db.twoFactorToken.delete).mockResolvedValue({} as never)
      vi.mocked(db.twoFactorToken.create).mockImplementation(((args: any) => Promise.resolve(args.data)) as any)

      await generateTwoFactorToken("user@test.com")

      expect(db.twoFactorToken.delete).toHaveBeenCalledWith({
        where: { id: "old-token-id" },
      })
    })

    it("does not delete when no existing token", async () => {
      vi.mocked(getTwoFactorTokenByEmail).mockResolvedValue(null)
      vi.mocked(db.twoFactorToken.create).mockImplementation(((args: any) => Promise.resolve(args.data)) as any)

      await generateTwoFactorToken("fresh@test.com")

      expect(db.twoFactorToken.delete).not.toHaveBeenCalled()
    })
  })

  // ============================================
  // generatePasswordResetToken
  // ============================================
  describe("generatePasswordResetToken", () => {
    it("creates a UUID token with 1-hour expiry", async () => {
      vi.mocked(getPasswordResetTokenByEmail).mockResolvedValue(null)
      vi.mocked(db.passwordResetToken.create).mockImplementation(((args: any) => Promise.resolve(args.data)) as any)

      const result = await generatePasswordResetToken("user@test.com")

      expect(db.passwordResetToken.create).toHaveBeenCalledTimes(1)
      const createCall = vi.mocked(db.passwordResetToken.create).mock.calls[0]![0] as {
        data: { email: string; token: string; expires: Date }
      }
      expect(createCall.data.email).toBe("user@test.com")
      // UUID v4 format
      expect(createCall.data.token).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      )
      // Expires about 1 hour from now
      const expectedExpiry = Date.now() + 3600 * 1000
      expect(createCall.data.expires.getTime()).toBeGreaterThan(Date.now())
      expect(createCall.data.expires.getTime()).toBeLessThanOrEqual(expectedExpiry + 1000)
    })

    it("deletes existing token before creating new one", async () => {
      vi.mocked(getPasswordResetTokenByEmail).mockResolvedValue({
        id: "old-reset-id",
        email: "user@test.com",
        token: "old-uuid",
        expires: new Date(),
      })
      vi.mocked(db.passwordResetToken.delete).mockResolvedValue({} as never)
      vi.mocked(db.passwordResetToken.create).mockImplementation(((args: any) => Promise.resolve(args.data)) as any)

      await generatePasswordResetToken("user@test.com")

      expect(db.passwordResetToken.delete).toHaveBeenCalledWith({
        where: { id: "old-reset-id" },
      })
    })

    it("does not delete when no existing token", async () => {
      vi.mocked(getPasswordResetTokenByEmail).mockResolvedValue(null)
      vi.mocked(db.passwordResetToken.create).mockImplementation(((args: any) => Promise.resolve(args.data)) as any)

      await generatePasswordResetToken("new@test.com")

      expect(db.passwordResetToken.delete).not.toHaveBeenCalled()
    })
  })

  // ============================================
  // generateVerificationToken
  // ============================================
  describe("generateVerificationToken", () => {
    it("creates a UUID token with 24-hour expiry", async () => {
      vi.mocked(getVerificationTokenByEmail).mockResolvedValue(null)
      vi.mocked(db.verificationToken.create).mockImplementation(((args: any) => Promise.resolve(args.data)) as any)

      const result = await generateVerificationToken("user@test.com")

      expect(db.verificationToken.create).toHaveBeenCalledTimes(1)
      const createCall = vi.mocked(db.verificationToken.create).mock.calls[0]![0] as {
        data: { email: string; token: string; expires: Date }
      }
      expect(createCall.data.email).toBe("user@test.com")
      // UUID v4 format
      expect(createCall.data.token).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      )
      // Expires about 24 hours from now
      const expectedExpiry = Date.now() + 24 * 3600 * 1000
      expect(createCall.data.expires.getTime()).toBeGreaterThan(Date.now())
      expect(createCall.data.expires.getTime()).toBeLessThanOrEqual(expectedExpiry + 1000)
    })

    it("deletes existing token before creating new one", async () => {
      vi.mocked(getVerificationTokenByEmail).mockResolvedValue({
        id: "old-verify-id",
        email: "user@test.com",
        token: "old-uuid",
        expires: new Date(),
      })
      vi.mocked(db.verificationToken.delete).mockResolvedValue({} as never)
      vi.mocked(db.verificationToken.create).mockImplementation(((args: any) => Promise.resolve(args.data)) as any)

      await generateVerificationToken("user@test.com")

      expect(db.verificationToken.delete).toHaveBeenCalledWith({
        where: { id: "old-verify-id" },
      })
    })

    it("does not delete when no existing token", async () => {
      vi.mocked(getVerificationTokenByEmail).mockResolvedValue(null)
      vi.mocked(db.verificationToken.create).mockImplementation(((args: any) => Promise.resolve(args.data)) as any)

      await generateVerificationToken("new@test.com")

      expect(db.verificationToken.delete).not.toHaveBeenCalled()
    })
  })
})
