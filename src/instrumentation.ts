import * as Sentry from "@sentry/nextjs"

// Next.js 16 requires instrumentation.ts to run server-side init hooks.
// Sentry hooks into this to initialize the Node and Edge SDKs with the
// project config under sentry.server.config.ts / sentry.edge.config.ts.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config")
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config")
  }
}

export const onRequestError = Sentry.captureRequestError
