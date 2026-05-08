// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Per-action rate limits for credential-bearing auth flows.
 *
 * The middleware caps total auth POSTs at 20/min/IP. These per-action,
 * per-email + per-IP limiters add the second axis: a single attacker IP
 * rotation can defeat the IP cap, but cannot defeat the per-email cap.
 *
 * Limits are intentionally generous on the IP axis (legitimate users behind
 * NAT) and tight on the email axis (real-world brute force).
 *
 * Returns a generic error when blocked — do NOT echo "email locked" or any
 * message that helps an attacker enumerate accounts.
 */

import { headers } from "next/headers"
import { getClientIp, rateLimit } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"

const log = logger.forModule("auth.rate-limit")

const FIFTEEN_MIN = 15 * 60_000
const ONE_HOUR = 60 * 60_000

// Tunings: see Epic 1.3 in docs/production-readiness-epics.md.
const LIMITS = {
  login: {
    perEmail: { limit: 5, windowMs: FIFTEEN_MIN },
    perIp: { limit: 20, windowMs: FIFTEEN_MIN },
  },
  reset: {
    perEmail: { limit: 3, windowMs: ONE_HOUR },
    perIp: { limit: 10, windowMs: ONE_HOUR },
  },
  register: {
    // No per-email axis — registration creates the email; cap by IP only.
    perEmail: null,
    perIp: { limit: 3, windowMs: ONE_HOUR },
  },
  "new-password": {
    perEmail: { limit: 5, windowMs: FIFTEEN_MIN },
    perIp: { limit: 20, windowMs: FIFTEEN_MIN },
  },
} as const

type AuthAction = keyof typeof LIMITS

/**
 * Check both per-email (when applicable) and per-IP buckets for an auth action.
 *
 * @param action  Which auth flow is being throttled.
 * @param email   The email being attempted; lower-cased for the bucket key.
 *                Pass `null` for actions that don't have a target email
 *                (i.e. registration, where the email isn't trusted yet).
 * @returns `{ limited: false }` to proceed, `{ limited: true, error }` to bail.
 */
export async function checkAuthRateLimit(
  action: AuthAction,
  email: string | null,
): Promise<{ limited: false } | { limited: true; error: string }> {
  const config = LIMITS[action]
  const ip = getClientIp(await headers())

  // Per-IP axis runs first so an attacker doesn't burn through the per-email
  // bucket for an arbitrary victim address.
  const ipResult = await rateLimit(
    `auth:${action}:ip`,
    ip,
    config.perIp.limit,
    config.perIp.windowMs,
  )
  if (ipResult.limited) {
    log.warn("Auth rate limit hit (per-IP)", { action, ip })
    return { limited: true, error: "Too many requests. Please try again later." }
  }

  if (config.perEmail && email) {
    const key = email.toLowerCase().trim()
    const emailResult = await rateLimit(
      `auth:${action}:email`,
      key,
      config.perEmail.limit,
      config.perEmail.windowMs,
    )
    if (emailResult.limited) {
      // Don't expose whether the email exists; same generic copy as IP-block.
      log.warn("Auth rate limit hit (per-email)", { action, ip })
      return { limited: true, error: "Too many requests. Please try again later." }
    }
  }

  return { limited: false }
}
