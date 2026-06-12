// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Render a `@react-pdf/renderer` document to a Buffer with a hard timeout.
 *
 * Why: Vercel's default function timeout is 10s. Without a wrapper, a buggy
 * or malicious payload (e.g. a 10K-row statement) silently consumes the
 * full budget and a 504 falls back to the user with no useful telemetry.
 * This wrapper rejects at `timeoutMs` so the route handler can return a
 * structured 504 + Sentry breadcrumb.
 */

import { renderToBuffer } from "@react-pdf/renderer"

export class PdfTimeoutError extends Error {
  readonly timeoutMs: number
  constructor(timeoutMs: number) {
    super(`PDF render exceeded ${timeoutMs}ms`)
    this.name = "PdfTimeoutError"
    this.timeoutMs = timeoutMs
  }
}

export async function renderPdfWithTimeout(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doc: any,
  timeoutMs = 8000,
): Promise<Buffer> {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new PdfTimeoutError(timeoutMs)), timeoutMs)
  })

  try {
    const buffer = await Promise.race([renderToBuffer(doc), timeout])
    return buffer as Buffer
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle)
  }
}
