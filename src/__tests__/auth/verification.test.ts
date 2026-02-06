import { describe, it, expect, vi, beforeEach } from "vitest"
import { newVerification } from "@/components/auth/verification/action"

// Mock the token lookup and user lookup
vi.mock("@/components/auth/verification/verificiation-token", () => ({
  getVerificationTokenByToken: vi.fn(),
}))

vi.mock("@/components/auth/user", () => ({
  getUserByEmail: vi.fn(),
}))

import { getVerificationTokenByToken } from "@/components/auth/verification/verificiation-token"
import { getUserByEmail } from "@/components/auth/user"

const mockGetToken = vi.mocked(getVerificationTokenByToken)
const mockGetUser = vi.mocked(getUserByEmail)

describe("newVerification", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns error when token does not exist", async () => {
    mockGetToken.mockResolvedValue(null)
    mockGetUser.mockResolvedValue(null)

    const result = await newVerification("invalid-token")
    expect(result).toEqual({ error: "Token does not exist!" })
  })

  it("returns success when email is already verified", async () => {
    mockGetToken.mockResolvedValue(null)
    mockGetUser.mockResolvedValue({
      id: "1",
      email: "test@test.com",
      emailVerified: new Date(),
    } as never)

    const result = await newVerification("test@test.com")
    expect(result).toEqual({ success: "Email already verified!" })
  })

  it("returns error when token has expired", async () => {
    mockGetToken.mockResolvedValue({
      id: "token-1",
      email: "test@test.com",
      token: "valid-token",
      expires: new Date(Date.now() - 10000), // expired
    })

    const result = await newVerification("valid-token")
    expect(result).toEqual({ error: "Token has expired!" })
  })
})
