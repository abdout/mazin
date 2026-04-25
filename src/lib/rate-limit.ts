// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * In-memory IP-based rate limiter.
 *
 * Acceptable pre-GA for a single-region Vercel deployment — instances stay
 * warm long enough to catch bursts and bcrypt cost is the real defense on
 * credential endpoints. Swap to `@upstash/ratelimit` + `@upstash/redis`
 * before GA (tracked: middleware.ts rate-limit TODO).
 *
 * Separate buckets live in separate Maps so a `login` flood cannot consume
 * the budget for `vendor-signup` or vice-versa.
 */

export interface RateLimitResult {
  limited: boolean
  remaining: number
  resetAt: number
}

interface Bucket {
  count: number
  resetTime: number
}

const buckets = new Map<string, Map<string, Bucket>>()

function getBucket(name: string): Map<string, Bucket> {
  let bucket = buckets.get(name)
  if (!bucket) {
    bucket = new Map()
    buckets.set(name, bucket)
  }
  return bucket
}

/**
 * Check & record a hit for `key` within bucket `name`.
 * Returns whether this request should be blocked.
 */
export function rateLimit(
  name: string,
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const bucket = getBucket(name)
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

/**
 * Extract a best-effort client IP from common proxy headers.
 * Falls back to "unknown" so the rate limiter still works when routed
 * behind a proxy that strips forwarded headers.
 */
export function getClientIp(headers: Headers | { get: (k: string) => string | null }): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    "unknown"
  )
}

// Reset helper — used by tests. Not part of the production API.
export function __resetRateLimits(name?: string): void {
  if (name) buckets.delete(name)
  else buckets.clear()
}
