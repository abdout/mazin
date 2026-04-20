import { describe, it, expect, vi } from "vitest"

// Mock @prisma/client so the UserRole enum resolves outside of Prisma generation
vi.mock("@prisma/client", () => ({
  UserRole: {
    ADMIN: "ADMIN",
    MANAGER: "MANAGER",
    CLERK: "CLERK",
    VIEWER: "VIEWER",
  },
}))

import {
  LoginSchema,
  RegisterSchema,
  ResetSchema,
  NewPasswordSchema,
  SettingsSchema,
} from "@/components/auth/validation"

// ---------------------------------------------------------------------------
// LoginSchema
// ---------------------------------------------------------------------------
describe("LoginSchema", () => {
  it("accepts valid email and password", () => {
    const result = LoginSchema.safeParse({
      email: "user@example.com",
      password: "secret123",
    })
    expect(result.success).toBe(true)
  })

  it("accepts optional 2FA code", () => {
    const result = LoginSchema.safeParse({
      email: "user@example.com",
      password: "secret123",
      code: "Test1234",
    })
    expect(result.success).toBe(true)
  })

  it("rejects missing email", () => {
    const result = LoginSchema.safeParse({ password: "secret123" })
    expect(result.success).toBe(false)
  })

  it("rejects invalid email format", () => {
    const result = LoginSchema.safeParse({
      email: "not-an-email",
      password: "secret123",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const emailIssue = result.error.issues.find((i) => i.path.includes("email"))
      expect(emailIssue).toBeDefined()
    }
  })

  it("rejects empty password", () => {
    const result = LoginSchema.safeParse({
      email: "user@example.com",
      password: "",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const pwIssue = result.error.issues.find((i) => i.path.includes("password"))
      expect(pwIssue).toBeDefined()
    }
  })

  it("rejects missing password", () => {
    const result = LoginSchema.safeParse({ email: "user@example.com" })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// RegisterSchema
// ---------------------------------------------------------------------------
describe("RegisterSchema", () => {
  it("accepts valid name, email, and 6+ char password", () => {
    const result = RegisterSchema.safeParse({
      name: "John Doe",
      email: "john@example.com",
      password: "Test1234",
    })
    expect(result.success).toBe(true)
  })

  it("rejects missing name", () => {
    const result = RegisterSchema.safeParse({
      email: "john@example.com",
      password: "Test1234",
    })
    expect(result.success).toBe(false)
  })

  it("rejects empty name", () => {
    const result = RegisterSchema.safeParse({
      name: "",
      email: "john@example.com",
      password: "Test1234",
    })
    expect(result.success).toBe(false)
  })

  it("rejects missing email", () => {
    const result = RegisterSchema.safeParse({
      name: "John",
      password: "Test1234",
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid email format", () => {
    const result = RegisterSchema.safeParse({
      name: "John",
      email: "bad-email",
      password: "Test1234",
    })
    expect(result.success).toBe(false)
  })

  it("rejects 7-char password (below minimum 8)", () => {
    const result = RegisterSchema.safeParse({
      name: "John",
      email: "john@example.com",
      password: "Abcde1x",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const pwIssue = result.error.issues.find((i) => i.path.includes("password"))
      expect(pwIssue).toBeDefined()
    }
  })

  it("accepts exactly 8-char password with complexity", () => {
    const result = RegisterSchema.safeParse({
      name: "John",
      email: "john@example.com",
      password: "Abcdef1x",
    })
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// ResetSchema
// ---------------------------------------------------------------------------
describe("ResetSchema", () => {
  it("accepts valid email", () => {
    const result = ResetSchema.safeParse({ email: "reset@example.com" })
    expect(result.success).toBe(true)
  })

  it("rejects missing email", () => {
    const result = ResetSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it("rejects invalid email format", () => {
    const result = ResetSchema.safeParse({ email: "not-valid" })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// NewPasswordSchema
// ---------------------------------------------------------------------------
describe("NewPasswordSchema", () => {
  it("accepts 8+ char password with complexity", () => {
    const result = NewPasswordSchema.safeParse({ password: "NewPass1" })
    expect(result.success).toBe(true)
  })

  it("rejects 7-char password", () => {
    const result = NewPasswordSchema.safeParse({ password: "Abc12x" })
    expect(result.success).toBe(false)
  })

  it("rejects missing password", () => {
    const result = NewPasswordSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it("rejects empty password", () => {
    const result = NewPasswordSchema.safeParse({ password: "" })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// SettingsSchema
// ---------------------------------------------------------------------------
describe("SettingsSchema", () => {
  it("accepts valid settings with all optional fields omitted", () => {
    const result = SettingsSchema.safeParse({ role: "ADMIN" })
    expect(result.success).toBe(true)
  })

  it("accepts full valid settings", () => {
    const result = SettingsSchema.safeParse({
      name: "Updated Name",
      email: "new@example.com",
      role: "MANAGER",
      isTwoFactorEnabled: true,
    })
    expect(result.success).toBe(true)
  })

  it("rejects invalid role value", () => {
    const result = SettingsSchema.safeParse({ role: "SUPERADMIN" })
    expect(result.success).toBe(false)
  })

  it("fails refinement when password is provided without newPassword", () => {
    const result = SettingsSchema.safeParse({
      role: "ADMIN",
      password: "OldPass1",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) =>
        i.path.includes("newPassword")
      )
      expect(issue).toBeDefined()
      expect(issue!.message).toBe("New password is required!")
    }
  })

  it("fails refinement when newPassword is provided without password", () => {
    const result = SettingsSchema.safeParse({
      role: "ADMIN",
      newPassword: "NewPass1",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) =>
        i.path.includes("password")
      )
      expect(issue).toBeDefined()
      expect(issue!.message).toBe("Password is required!")
    }
  })

  it("accepts when both password and newPassword are provided", () => {
    const result = SettingsSchema.safeParse({
      role: "ADMIN",
      password: "OldPass1",
      newPassword: "NewPass1",
    })
    expect(result.success).toBe(true)
  })

  it("accepts all four role values", () => {
    for (const role of ["ADMIN", "MANAGER", "CLERK", "VIEWER"]) {
      const result = SettingsSchema.safeParse({ role })
      expect(result.success, `role ${role} should be accepted`).toBe(true)
    }
  })
})
