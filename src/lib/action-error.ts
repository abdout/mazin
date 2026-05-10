// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Server-action error helpers.
 *
 * Why: many existing server actions catch errors and return
 * `error: err.message` to the client. That leaks Prisma error strings
 * (table names, constraint names, SQL fragments) — see audit finding #30.
 *
 * `safeActionError` is the central translator: it maps known error classes
 * (e.g. `ForbiddenError`) to stable error codes, and falls through to a
 * generic message for everything else. Always logs the raw error first so
 * Sentry / Vercel logs still see the detail.
 *
 * Usage:
 *   try {
 *     ...
 *   } catch (err) {
 *     return safeActionError(err, log, "Failed to update bank account.")
 *   }
 */

import { ForbiddenError } from "@/lib/authorization"
import type { logger } from "@/lib/logger"

export type SafeActionError = {
  success: false
  error: string
  /** Stable, machine-readable code for client-side branching. */
  code: "FORBIDDEN" | "UNAUTHORIZED" | "NOT_FOUND" | "VALIDATION" | "OPERATION_FAILED"
}

type Log = ReturnType<typeof logger.forModule>

/**
 * Translate an unknown server-action error into a safe response shape.
 *
 * @param err          The thrown value.
 * @param log          The module-scoped logger for raw error capture.
 * @param fallbackMsg  User-facing copy when the error doesn't match a known
 *                     class. Should NOT include any technical detail.
 */
export function safeActionError(
  err: unknown,
  log: Log,
  fallbackMsg = "Something went wrong. Please try again.",
): SafeActionError {
  if (err instanceof ForbiddenError) {
    // No log here — failed authz attempts are noise unless they spike. The
    // role-check helper already logs structured info if you opt in.
    return {
      success: false,
      error: "You don't have permission to do this.",
      code: "FORBIDDEN",
    }
  }

  if (err instanceof Error && err.message === "Unauthorized") {
    return {
      success: false,
      error: "Please sign in to continue.",
      code: "UNAUTHORIZED",
    }
  }

  // Anything else is unexpected — log the full thing so we can debug, but
  // hand the client a clean generic message. Never propagate `err.message`.
  log.error("Server action failed", err as Error)
  return {
    success: false,
    error: fallbackMsg,
    code: "OPERATION_FAILED",
  }
}
