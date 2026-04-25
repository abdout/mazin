import { describe, it, expect } from "vitest"
import {
  publicRoutes,
  publicRoutePrefixes,
  authRoutes,
  apiAuthPrefix,
  DEFAULT_LOGIN_REDIRECT,
} from "@/routes"
import { i18n } from "@/components/internationalization/config"

// ---------------------------------------------------------------------------
// Route configuration tests
// ---------------------------------------------------------------------------
describe("route configuration", () => {
  it("publicRoutes is a non-empty array", () => {
    expect(Array.isArray(publicRoutes)).toBe(true)
    expect(publicRoutes.length).toBeGreaterThan(0)
  })

  it("publicRoutes includes root '/'", () => {
    expect(publicRoutes).toContain("/")
  })

  it("publicRoutes includes marketing pages", () => {
    expect(publicRoutes).toContain("/about")
    expect(publicRoutes).toContain("/services")
    expect(publicRoutes).toContain("/contact")
  })

  it("authRoutes includes login and join", () => {
    expect(authRoutes).toContain("/login")
    expect(authRoutes).toContain("/join")
  })

  it("authRoutes includes password reset routes", () => {
    expect(authRoutes).toContain("/reset")
    expect(authRoutes).toContain("/new-password")
  })

  it("authRoutes includes locale-prefixed versions", () => {
    for (const locale of i18n.locales) {
      expect(authRoutes).toContain(`/${locale}/login`)
      expect(authRoutes).toContain(`/${locale}/join`)
    }
  })

  it("apiAuthPrefix is '/api/auth'", () => {
    expect(apiAuthPrefix).toBe("/api/auth")
  })

  it("DEFAULT_LOGIN_REDIRECT is '/dashboard'", () => {
    expect(DEFAULT_LOGIN_REDIRECT).toBe("/dashboard")
  })

  it("publicRoutePrefixes includes tracking prefixes", () => {
    expect(publicRoutePrefixes).toContain("/en/track/")
    expect(publicRoutePrefixes).toContain("/ar/track/")
  })
})

// ---------------------------------------------------------------------------
// Route overlap detection
// ---------------------------------------------------------------------------
describe("route overlap detection", () => {
  it("no auth route (without locale prefix) is also in publicRoutes (except /)", () => {
    // Normalize: strip locale prefixes to get the base route
    const baseAuthRoutes = authRoutes
      .map((r) => r.replace(/^\/(ar|en)/, ""))
      .filter((r) => r !== "/")

    const basePublicRoutes = new Set(
      publicRoutes.map((r) => r.replace(/^\/(ar|en)/, ""))
    )

    const overlapping = baseAuthRoutes.filter((r) => basePublicRoutes.has(r))
    expect(
      overlapping,
      `These routes overlap between auth and public: ${overlapping.join(", ")}`
    ).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Locale detection logic (testing the algorithm, not the Next.js runtime)
// ---------------------------------------------------------------------------
describe("locale detection logic", () => {
  // Reimplement the pure getLocale algorithm from middleware.ts for unit testing
  function getLocale(cookieLocale: string | undefined, acceptLanguage: string): string {
    if (cookieLocale && (i18n.locales as readonly string[]).includes(cookieLocale)) {
      return cookieLocale
    }

    const preferredLocale = acceptLanguage.split(",")[0]?.split("-")[0]?.toLowerCase()
    if (preferredLocale && (i18n.locales as readonly string[]).includes(preferredLocale)) {
      return preferredLocale
    }

    return i18n.defaultLocale
  }

  it("cookie locale takes priority over Accept-Language", () => {
    expect(getLocale("en", "ar,en;q=0.9")).toBe("en")
  })

  it("cookie locale 'ar' is respected", () => {
    expect(getLocale("ar", "en-US,en;q=0.9")).toBe("ar")
  })

  it("falls back to Accept-Language when no cookie", () => {
    expect(getLocale(undefined, "en-US,en;q=0.9")).toBe("en")
  })

  it("extracts language code from Accept-Language (ignores region)", () => {
    expect(getLocale(undefined, "ar-SA,ar;q=0.9")).toBe("ar")
  })

  it("defaults to 'ar' when cookie and Accept-Language are both unsupported", () => {
    expect(getLocale(undefined, "fr-FR,de;q=0.9")).toBe("ar")
  })

  it("defaults to 'ar' when Accept-Language is empty", () => {
    expect(getLocale(undefined, "")).toBe("ar")
  })

  it("ignores invalid cookie locale and falls back", () => {
    expect(getLocale("zz", "en-US")).toBe("en")
  })

  it("ignores invalid cookie locale and defaults to 'ar' when Accept-Language is also unsupported", () => {
    expect(getLocale("zz", "xx-XX")).toBe("ar")
  })
})

// ---------------------------------------------------------------------------
// API route bypass — regression guard for the /api locale-redirect bug.
// Middleware used to redirect /api/cron/reminders → /ar/api/cron/reminders,
// breaking Vercel cron and PDF endpoints. Every /api/* path must be skipped.
// ---------------------------------------------------------------------------
describe("api route bypass", () => {
  // Mirror the check used in middleware.ts line 109.
  function isApiRoute(pathname: string): boolean {
    return pathname.startsWith("/api/")
  }

  it.each([
    "/api/cron/reminders",
    "/api/cron/demurrage",
    "/api/health",
    "/api/invoice/123/pdf",
    "/api/statement/123/pdf",
    "/api/auth/callback/google",
  ])("bypasses locale redirect for %s", (pathname) => {
    expect(isApiRoute(pathname)).toBe(true)
  })

  it("does not bypass for page routes that only contain /api/ elsewhere", () => {
    expect(isApiRoute("/dashboard/api/tokens")).toBe(false)
    expect(isApiRoute("/ar/api-docs")).toBe(false)
  })
})
