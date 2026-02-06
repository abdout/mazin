import { describe, it, expect, vi } from "vitest"

// We test the route config logic, not the middleware itself (which needs Next.js runtime)
vi.mock("next-auth/react", () => ({}))

describe("route configuration", () => {
  it("should define public routes", async () => {
    const { publicRoutes } = await import("@/routes")
    expect(publicRoutes).toBeDefined()
    expect(Array.isArray(publicRoutes)).toBe(true)
    expect(publicRoutes.length).toBeGreaterThan(0)
  })

  it("should define auth routes", async () => {
    const { authRoutes } = await import("@/routes")
    expect(authRoutes).toBeDefined()
    expect(authRoutes).toContain("/login")
    expect(authRoutes).toContain("/join")
  })

  it("should define API auth prefix", async () => {
    const { apiAuthPrefix } = await import("@/routes")
    expect(apiAuthPrefix).toBe("/api/auth")
  })

  it("should define default login redirect", async () => {
    const { DEFAULT_LOGIN_REDIRECT } = await import("@/routes")
    expect(DEFAULT_LOGIN_REDIRECT).toBe("/dashboard")
  })
})
