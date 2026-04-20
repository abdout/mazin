import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/components/auth/user", () => ({
  getUserByEmail: vi.fn(),
}))
vi.mock("@/components/auth/mail", () => ({
  sendVerificationEmail: vi.fn(),
}))
vi.mock("@/components/auth/tokens", () => ({
  generateVerificationToken: vi.fn(),
}))
vi.mock("bcryptjs", () => ({
  default: { hash: vi.fn() },
}))

import { db } from "@/lib/db"
import { register } from "@/components/auth/join/action"
import { getUserByEmail } from "@/components/auth/user"
import { sendVerificationEmail } from "@/components/auth/mail"
import { generateVerificationToken } from "@/components/auth/tokens"
import bcrypt from "bcryptjs"
import { makeUser } from "@/__tests__/helpers/factories"

describe("register (join action)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================
  // Validation
  // ============================================
  it("returns error for invalid fields (missing email)", async () => {
    const result = await register({
      email: "",
      password: "Password1",
      name: "Test User",
    })

    expect(result).toEqual({ error: "Invalid fields!" })
  })

  it("returns error for invalid fields (short password)", async () => {
    const result = await register({
      email: "test@test.com",
      password: "12",
      name: "Test User",
    })

    expect(result).toEqual({ error: "Invalid fields!" })
  })

  it("returns error for invalid fields (missing name)", async () => {
    const result = await register({
      email: "test@test.com",
      password: "Password1",
      name: "",
    })

    expect(result).toEqual({ error: "Invalid fields!" })
  })

  it("returns error for invalid email format", async () => {
    const result = await register({
      email: "not-an-email",
      password: "Password1",
      name: "Test User",
    })

    expect(result).toEqual({ error: "Invalid fields!" })
  })

  // ============================================
  // Duplicate email
  // ============================================
  it("returns error when email already in use", async () => {
    const existingUser = makeUser({ email: "taken@test.com" })
    vi.mocked(getUserByEmail).mockResolvedValue(existingUser)

    const result = await register({
      email: "taken@test.com",
      password: "Password1",
      name: "Test User",
    })

    expect(getUserByEmail).toHaveBeenCalledWith("taken@test.com")
    expect(result).toEqual({ error: "Email already in use!" })
    expect(db.user.create).not.toHaveBeenCalled()
  })

  // ============================================
  // Successful registration
  // ============================================
  it("hashes password with bcrypt (salt rounds = 10)", async () => {
    vi.mocked(getUserByEmail).mockResolvedValue(null)
    vi.mocked(bcrypt.hash).mockResolvedValue("hashed-password" as never)
    vi.mocked(db.user.create).mockResolvedValue(makeUser())
    vi.mocked(generateVerificationToken).mockResolvedValue({
      id: "token-1",
      email: "new@test.com",
      token: "verification-uuid",
      expires: new Date(),
    })
    vi.mocked(sendVerificationEmail).mockResolvedValue(undefined)

    await register({
      email: "new@test.com",
      password: "Secure1x",
      name: "New User",
    })

    expect(bcrypt.hash).toHaveBeenCalledWith("Secure1x", 10)
  })

  it("creates user with hashed password in the database", async () => {
    vi.mocked(getUserByEmail).mockResolvedValue(null)
    vi.mocked(bcrypt.hash).mockResolvedValue("hashed-password" as never)
    vi.mocked(db.user.create).mockResolvedValue(makeUser())
    vi.mocked(generateVerificationToken).mockResolvedValue({
      id: "token-1",
      email: "new@test.com",
      token: "verification-uuid",
      expires: new Date(),
    })
    vi.mocked(sendVerificationEmail).mockResolvedValue(undefined)

    await register({
      email: "new@test.com",
      password: "Secure1x",
      name: "New User",
    })

    expect(db.user.create).toHaveBeenCalledWith({
      data: {
        name: "New User",
        email: "new@test.com",
        password: "hashed-password",
      },
    })
  })

  it("generates verification token and sends email on success", async () => {
    vi.mocked(getUserByEmail).mockResolvedValue(null)
    vi.mocked(bcrypt.hash).mockResolvedValue("hashed-password" as never)
    vi.mocked(db.user.create).mockResolvedValue(makeUser())
    vi.mocked(generateVerificationToken).mockResolvedValue({
      id: "token-1",
      email: "new@test.com",
      token: "verification-uuid",
      expires: new Date(),
    })
    vi.mocked(sendVerificationEmail).mockResolvedValue(undefined)

    const result = await register({
      email: "new@test.com",
      password: "Secure1x",
      name: "New User",
    })

    expect(generateVerificationToken).toHaveBeenCalledWith("new@test.com")
    expect(sendVerificationEmail).toHaveBeenCalledWith(
      "new@test.com",
      "verification-uuid"
    )
    expect(result).toEqual({ success: "Confirmation email sent!" })
  })
})
