// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Rate limiter — sliding-window via Upstash Redis, with a dev-only in-memory
 * fallback.
 *
 * Why: Vercel serverless instances don't share a process, so an in-memory
 * `Map` evaporates on every cold start. Upstash gives us a single source of
 * truth across the fleet. We keep the in-memory path so local dev and CI
 * (where Upstash isn't configured) still exercise the limiter contract.
 *
 * Env required in production: `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`.
 * `src/lib/env.ts` enforces this at boot. If somehow misconfigured at runtime
 * we **fail open** (with a loud `log.error`) so a Redis outage doesn't lock
 * legitimate users out — the env validation is the primary gate.
 *
 * API: a single async `rateLimit(name, key, limit, windowMs)`. Buckets are
 * keyed by `(name, limit, windowMs)` so e.g. a `login` flood cannot consume
 * the budget for `vendor-signup`, and changing limits doesn't bleed counters
 * across windows.
 */

import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { logger } from "@/lib/logger"

const log = logger.forModule("rate-limit")

const isProduction = process.env.NODE_ENV === "production"

export interface RateLimitResult {
  /** Whether this request should be blocked. */
  limited: boolean
  /** How many requests remain in the current window. */
  remaining: number
  /** Unix-ms timestamp when the bucket resets. Use for `Retry-After`. */
  resetAt: number
}

// ---------------------------------------------------------------------------
// Upstash branch
// ---------------------------------------------------------------------------

let cachedRedis: Redis | null | undefined
function getRedis(): Redis | null {
  if (cachedRedis !== undefined) return cachedRedis
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    if (isProduction) {
      // Defense-in-depth: env validation should have caught this at boot.
      // If we got here in prod, log loudly so ops sees it before it bites.
      log.error(
        "Upstash not configured in production — rate limits BYPASSED until UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set",
      )
    }
    cachedRedis = null
    return null
  }
  cachedRedis = new Redis({ url, token })
  return cachedRedis
}

const limiterCache = new Map<string, Ratelimit>()

function getLimiter(
  name: string,
  limit: number,
  windowMs: number,
): Ratelimit | null {
  const redis = getRedis()
  if (!redis) return null

  const cacheKey = `${name}:${limit}:${windowMs}`
  const cached = limiterCache.get(cacheKey)
  if (cached) return cached

  // Upstash `slidingWindow` takes a `Duration` string like `"5 m"`.
  const seconds = Math.max(1, Math.round(windowMs / 1000))
  const window = `${seconds} s` as `${number} s`

  const limiter = new Ratelimit({
    redis,
    prefix: `mazin:rl:${name}`,
    limiter: Ratelimit.slidingWindow(limit, window),
    analytics: false,
  })
  limiterCache.set(cacheKey, limiter)
  return limiter
}

// ---------------------------------------------------------------------------
// In-memory fallback (dev / CI only)
// ---------------------------------------------------------------------------

interface Bucket {
  count: number
  resetTime: number
}

const memoryBuckets = new Map<string, Map<string, Bucket>>()

function getMemoryBucket(name: string): Map<string, Bucket> {
  let bucket = memoryBuckets.get(name)
  if (!bucket) {
    bucket = new Map()
    memoryBuckets.set(name, bucket)
  }
  return bucket
}

function memoryRateLimit(
  name: string,
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const bucket = getMemoryBucket(name)
  const now = Date.now()
  const entry = bucket.get(key)

  if (!entry || now > entry.resetTime) {
    const resetAt = now + windowMs
    bucket.set(key, { count: 1, resetTime: resetAt })
    return { limited: false, remaining: limit - 1, resetAt }
  }

  entry.count++
  return {
    limited: entry.count > limit,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetTime,
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Record a hit against bucket `name` for `key` and return whether this
 * request should be blocked.
 *
 * @param name      Logical bucket name (e.g. `"auth:login"`, `"public-track"`).
 *                  Buckets are isolated — a flood on one cannot drain another.
 * @param key       The throttled identity (IP, email, userId — caller decides).
 * @param limit     Max requests per window.
 * @param windowMs  Window length in milliseconds.
 */
export async function rateLimit(
  name: string,
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const limiter = getLimiter(name, limit, windowMs)
  if (limiter) {
    try {
      const res = await limiter.limit(key)
      return {
        limited: !res.success,
        remaining: res.remaining,
        resetAt: res.reset,
      }
    } catch (err) {
      // Upstash REST hiccup — fail open, preserve UX, surface in logs/Sentry.
      log.error("Upstash rate-limit call failed; failing open", err as Error, {
        name,
        keyPrefix: key.slice(0, 16),
      })
      return {
        limited: false,
        remaining: limit,
        resetAt: Date.now() + windowMs,
      }
    }
  }

  // No Upstash → in-memory fallback. Acceptable in dev/test; in production
  // this means env validation was bypassed (see `getRedis`). The limit still
  // applies within a single Lambda instance, which is better than nothing.
  return memoryRateLimit(name, key, limit, windowMs)
}

/**
 * Best-effort client IP from common proxy headers. Falls back to `"unknown"`
 * so the limiter still works behind a proxy that strips forwarded headers.
 *
 * Note: behind Vercel + Cloudflare, `x-forwarded-for` is trustworthy. If we
 * ever run behind a less-strict proxy, swap this for a `request.ip`-based
 * helper that respects a configured trusted-proxy list.
 */
export function getClientIp(
  headers: Headers | { get: (k: string) => string | null },
): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    "unknown"
  )
}

/**
 * Test helper — clear in-memory state and the Upstash limiter cache.
 * Not part of the production API; kept exported for unit tests.
 */
export function __resetRateLimits(name?: string): void {
  if (name) {
    memoryBuckets.delete(name)
    for (const cacheKey of Array.from(limiterCache.keys())) {
      if (cacheKey.startsWith(`${name}:`)) limiterCache.delete(cacheKey)
    }
    return
  }
  memoryBuckets.clear()
  limiterCache.clear()
  cachedRedis = undefined
}
