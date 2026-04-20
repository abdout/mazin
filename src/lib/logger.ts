import * as Sentry from "@sentry/nextjs"

type LogContext = Record<string, unknown>

function formatMessage(module: string, message: string) {
  return `[${module}] ${message}`
}

function createLogger(module: string) {
  return {
    info(message: string, context?: LogContext) {
      if (process.env.NODE_ENV === "development") {
        console.info(formatMessage(module, message), context ?? "")
      }
    },

    warn(message: string, context?: LogContext) {
      console.warn(formatMessage(module, message), context ?? "")
      Sentry.addBreadcrumb({
        category: module,
        message,
        level: "warning",
        data: context,
      })
    },

    error(message: string, error?: unknown, context?: LogContext) {
      const formatted = formatMessage(module, message)

      if (process.env.NODE_ENV === "development") {
        console.error(formatted, error, context ?? "")
      }

      if (error instanceof Error) {
        Sentry.captureException(error, {
          tags: { module },
          extra: { message, ...context },
        })
      } else {
        Sentry.captureMessage(formatted, {
          level: "error",
          tags: { module },
          extra: { error, ...context },
        })
      }
    },

    fatal(message: string, error?: unknown, context?: LogContext) {
      const formatted = formatMessage(module, message)
      console.error(formatted, error, context ?? "")

      if (error instanceof Error) {
        Sentry.captureException(error, {
          level: "fatal",
          tags: { module },
          extra: { message, ...context },
        })
      } else {
        Sentry.captureMessage(formatted, {
          level: "fatal",
          tags: { module },
          extra: { error, ...context },
        })
      }
    },
  }
}

export const logger = {
  forModule: createLogger,
}
