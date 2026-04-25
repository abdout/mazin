import { describe, it, expect } from "vitest"
import {
  publicRoutes,
  publicRoutePrefixes,
  authRoutes,
  apiAuthPrefix,
  DEFAULT_LOGIN_REDIRECT,
} from "@/routes"

describe("routes config", () => {
  it("lists both root and localized marketing pages as public", () => {
    expect(publicRoutes).toContain("/")
    expect(publicRoutes).toContain("/en/about")
    expect(publicRoutes).toContain("/ar/about")
    expect(publicRoutes).toContain("/en/services")
    expect(publicRoutes).toContain("/ar/services")
  })

  it("exposes /track/ as a public prefix (no auth for tracking)", () => {
    expect(publicRoutePrefixes).toContain("/en/track/")
    expect(publicRoutePrefixes).toContain("/ar/track/")
  })

  it("authRoutes cover login/join/reset in both locales", () => {
    expect(authRoutes).toContain("/login")
    expect(authRoutes).toContain("/en/login")
    expect(authRoutes).toContain("/ar/login")
    expect(authRoutes).toContain("/en/reset")
    expect(authRoutes).toContain("/ar/reset")
  })

  it("default post-login redirect is /dashboard", () => {
    expect(DEFAULT_LOGIN_REDIRECT).toBe("/dashboard")
  })

  it("API auth prefix targets the NextAuth handlers", () => {
    expect(apiAuthPrefix).toBe("/api/auth")
  })

  it("no route appears in both publicRoutes and authRoutes", () => {
    for (const r of authRoutes) {
      expect(publicRoutes).not.toContain(r)
    }
  })
})
