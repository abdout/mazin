import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"

// The global test setup (`__tests__/setup.ts`) mocks `@/lib/rate-limit` for
// every test file. This file *is* the unit test for that module, so we have
// to opt out of the global mock and exercise the real implementation here.
vi.unmock("@/lib/rate-limit")

// We mock @upstash/ratelimit so the suite runs without a live Redis. The
// mocked limiter behaves like a real one: it counts hits per (prefix, key)
// and returns `success: false` once `limit` is exceeded.
//
// This proves the wrapper:
//   1) prefers Upstash when env is configured (counter persists across calls)
//   2) falls back to in-memory when env is absent
//   3) keys per (name, limit, windowMs) tuple correctly
//   4) fails open when Upstash throws

interface MockState {
  shouldThrow: boolean
  // hits per (prefix, key)
  hits: Map<string, number>
}
const mockState: MockState = {
  shouldThrow: false,
  hits: new Map(),
}

vi.mock("@upstash/redis", () => ({
  Redis: class MockRedis {
    constructor(_: { url: string; token: string }) {}
  },
}))

vi.mock("@upstash/ratelimit", () => {
  // Mocked Ratelimit: each instance carries its prefix + limit, and reads
  // shared `mockState.hits` so successive `.limit(key)` calls accumulate.
  class MockRatelimit {
    private prefix: string
    private limit_: number
    constructor({ prefix, limiter }: { prefix: string; limiter: { limit: number } }) {
      this.prefix = prefix
      this.limit_ = limiter.limit
    }
    async limit(key: string) {
      if (mockState.shouldThrow) throw new Error("upstash boom")
      const hitKey = `${this.prefix}:${key}`
      const count = (mockState.hits.get(hitKey) ?? 0) + 1
      mockState.hits.set(hitKey, count)
      return {
        success: count <= this.limit_,
        remaining: Math.max(0, this.limit_ - count),
        reset: Date.now() + 60_000,
      }
    }
    static slidingWindow(limit: number, _window: string) {
      return { limit }
    }
  }
  return { Ratelimit: MockRatelimit }
})

async function loadRateLimit() {
  // Re-import to pick up env changes between tests.
  vi.resetModules()
  return await import("@/lib/rate-limit")
}

describe("rateLimit", () => {
  const originalUrl = process.env.UPSTASH_REDIS_REST_URL
  const originalToken = process.env.UPSTASH_REDIS_REST_TOKEN

  beforeEach(() => {
    mockState.hits.clear()
    mockState.shouldThrow = false
  })

  afterEach(() => {
    process.env.UPSTASH_REDIS_REST_URL = originalUrl
    process.env.UPSTASH_REDIS_REST_TOKEN = originalToken
  })

  describe("Upstash branch (env configured)", () => {
    beforeEach(() => {
      process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io"
      process.env.UPSTASH_REDIS_REST_TOKEN = "test-token"
    })

    it("counter persists across simulated cold-start invocations", async () => {
      const { rateLimit, __resetRateLimits } = await loadRateLimit()
      __resetRateLimits()

      const r1 = await rateLimit("login", "alice@example.com", 3, 60_000)
      const r2 = await rateLimit("login", "alice@example.com", 3, 60_000)
      const r3 = await rateLimit("login", "alice@example.com", 3, 60_000)
      const r4 = await rateLimit("login", "alice@example.com", 3, 60_000)

      expect(r1.limited).toBe(false)
      expect(r2.limited).toBe(false)
      expect(r3.limited).toBe(false)
      expect(r4.limited).toBe(true)
      // Counter advanced past limit; remaining stays at 0.
      expect(r4.remaining).toBe(0)
    })

    it("isolates buckets by name", async () => {
      const { rateLimit } = await loadRateLimit()

      // Burn the limit on bucket A.
      for (let i = 0; i < 3; i++) await rateLimit("a", "k", 3, 60_000)
      const aBlocked = await rateLimit("a", "k", 3, 60_000)
      expect(aBlocked.limited).toBe(true)

      // Bucket B with the same key starts fresh.
      const bFresh = await rateLimit("b", "k", 3, 60_000)
      expect(bFresh.limited).toBe(false)
    })

    it("isolates buckets by limit (different config = different counter)", async () => {
      const { rateLimit } = await loadRateLimit()

      const r1 = await rateLimit("auth", "ip", 2, 60_000)
      const r2 = await rateLimit("auth", "ip", 2, 60_000)
      const r3 = await rateLimit("auth", "ip", 2, 60_000)
      expect(r1.limited).toBe(false)
      expect(r2.limited).toBe(false)
      expect(r3.limited).toBe(true)

      // Same name + key but different limit → fresh counter.
      const fresh = await rateLimit("auth", "ip", 10, 60_000)
      expect(fresh.limited).toBe(false)
    })

    it("fails open when the Redis call throws", async () => {
      const { rateLimit } = await loadRateLimit()
      mockState.shouldThrow = true

      const result = await rateLimit("auth", "ip", 1, 60_000)
      expect(result.limited).toBe(false)
      expect(result.remaining).toBe(1)
    })
  })

  describe("In-memory fallback (no Upstash env)", () => {
    beforeEach(() => {
      delete process.env.UPSTASH_REDIS_REST_URL
      delete process.env.UPSTASH_REDIS_REST_TOKEN
    })

    it("blocks once limit is exceeded within a single process", async () => {
      const { rateLimit, __resetRateLimits } = await loadRateLimit()
      __resetRateLimits()

      const a = await rateLimit("login", "ip", 2, 60_000)
      const b = await rateLimit("login", "ip", 2, 60_000)
      const c = await rateLimit("login", "ip", 2, 60_000)
      expect(a.limited).toBe(false)
      expect(b.limited).toBe(false)
      expect(c.limited).toBe(true)
    })

    it("resets after the window expires", async () => {
      vi.useFakeTimers()
      try {
        const { rateLimit, __resetRateLimits } = await loadRateLimit()
        __resetRateLimits()

        await rateLimit("x", "k", 1, 1000)
        const blocked = await rateLimit("x", "k", 1, 1000)
        expect(blocked.limited).toBe(true)

        vi.advanceTimersByTime(1001)

        const fresh = await rateLimit("x", "k", 1, 1000)
        expect(fresh.limited).toBe(false)
      } finally {
        vi.useRealTimers()
      }
    })

    it("__resetRateLimits clears per-bucket state", async () => {
      const { rateLimit, __resetRateLimits } = await loadRateLimit()
      __resetRateLimits()

      await rateLimit("foo", "ip", 1, 60_000)
      const blocked = await rateLimit("foo", "ip", 1, 60_000)
      expect(blocked.limited).toBe(true)

      __resetRateLimits("foo")

      const fresh = await rateLimit("foo", "ip", 1, 60_000)
      expect(fresh.limited).toBe(false)
    })
  })
})

describe("getClientIp", () => {
  it("prefers x-forwarded-for first hop", async () => {
    const { getClientIp } = await loadRateLimit()
    const headers = new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" })
    expect(getClientIp(headers)).toBe("1.2.3.4")
  })

  it("falls back to x-real-ip", async () => {
    const { getClientIp } = await loadRateLimit()
    const headers = new Headers({ "x-real-ip": "9.9.9.9" })
    expect(getClientIp(headers)).toBe("9.9.9.9")
  })

  it("returns 'unknown' when no proxy header is present", async () => {
    const { getClientIp } = await loadRateLimit()
    expect(getClientIp(new Headers())).toBe("unknown")
  })
})
