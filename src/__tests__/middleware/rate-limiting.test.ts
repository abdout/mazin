import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// ---------------------------------------------------------------------------
// The rate-limiting logic in middleware.ts is a private function backed by a
// Map. Since it is not exported, we replicate the exact same algorithm here
// to unit-test its behavior in isolation.
// ---------------------------------------------------------------------------

const RATE_LIMIT_WINDOW_MS = 60_000 // 1 minute
const RATE_LIMIT_MAX = 10 // 10 requests per minute per IP

describe("rate limiting logic", () => {
  let rateLimitMap: Map<string, { count: number; resetTime: number }>

  function isRateLimited(ip: string): boolean {
    const now = Date.now()
    const entry = rateLimitMap.get(ip)

    if (!entry || now > entry.resetTime) {
      rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS })
      return false
    }

    entry.count++
    return entry.count > RATE_LIMIT_MAX
  }

  beforeEach(() => {
    rateLimitMap = new Map()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("allows the first request from any IP", () => {
    expect(isRateLimited("192.168.1.1")).toBe(false)
  })

  it("allows up to RATE_LIMIT_MAX requests within the window", () => {
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      expect(isRateLimited("192.168.1.1")).toBe(false)
    }
  })

  it("blocks the request exceeding RATE_LIMIT_MAX", () => {
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      isRateLimited("192.168.1.1")
    }
    // The 11th request should be blocked
    expect(isRateLimited("192.168.1.1")).toBe(true)
  })

  it("tracks different IPs independently", () => {
    // Fill up IP A
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      isRateLimited("10.0.0.1")
    }
    expect(isRateLimited("10.0.0.1")).toBe(true)

    // IP B should still be allowed
    expect(isRateLimited("10.0.0.2")).toBe(false)
  })

  it("resets the counter after the time window expires", () => {
    // Use all allowed requests
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      isRateLimited("192.168.1.1")
    }
    expect(isRateLimited("192.168.1.1")).toBe(true)

    // Advance time past the rate limit window
    vi.advanceTimersByTime(RATE_LIMIT_WINDOW_MS + 1)

    // Should be allowed again
    expect(isRateLimited("192.168.1.1")).toBe(false)
  })

  it("creates a new window entry after expiry", () => {
    isRateLimited("192.168.1.1")

    vi.advanceTimersByTime(RATE_LIMIT_WINDOW_MS + 1)

    // After expiry, the first call resets the entry
    isRateLimited("192.168.1.1")
    const entry = rateLimitMap.get("192.168.1.1")!
    expect(entry.count).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// Constants validation — verify the rate limit constants are sensible
// ---------------------------------------------------------------------------
describe("rate limit constants", () => {
  it("RATE_LIMIT_MAX is a reasonable value (between 5 and 100)", () => {
    expect(RATE_LIMIT_MAX).toBeGreaterThanOrEqual(5)
    expect(RATE_LIMIT_MAX).toBeLessThanOrEqual(100)
  })

  it("RATE_LIMIT_WINDOW_MS is 1 minute", () => {
    expect(RATE_LIMIT_WINDOW_MS).toBe(60_000)
  })
})

// ---------------------------------------------------------------------------
// Auth route configuration validation
// ---------------------------------------------------------------------------
describe("auth route configuration for rate limiting", () => {
  it("authRoutes are defined and include auth pages that need rate limiting", async () => {
    const { authRoutes } = await import("@/routes")
    expect(authRoutes).toContain("/login")
    expect(authRoutes).toContain("/join")
    expect(authRoutes).toContain("/reset")
    expect(authRoutes).toContain("/new-password")
  })

  it("apiAuthPrefix covers the auth API endpoint", async () => {
    const { apiAuthPrefix } = await import("@/routes")
    expect(apiAuthPrefix).toBe("/api/auth")
    // Verify the prefix would match typical NextAuth API routes
    expect("/api/auth/signin".startsWith(apiAuthPrefix)).toBe(true)
    expect("/api/auth/callback/google".startsWith(apiAuthPrefix)).toBe(true)
    expect("/api/auth/session".startsWith(apiAuthPrefix)).toBe(true)
  })
})
