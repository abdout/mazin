/**
 * Environment variable validation using Zod.
 *
 * Split into `serverSchema` (Node-only, secrets) and `clientSchema` (exposed to browser).
 *
 * Behavior:
 *  - In production (`NODE_ENV === "production"`): `DATABASE_URL` and `AUTH_SECRET`
 *    are required. Missing values throw a clear error at first access.
 *  - In development: missing optional vars log a warning but do not throw.
 *
 * Usage:
 *   import { env } from "@/lib/env"
 *   const url = env.DATABASE_URL
 */

import { z } from "zod"

const isProduction = process.env.NODE_ENV === "production"

/**
 * Server-only environment variables.
 * Never import `env` into client components or expose these values to the browser.
 */
const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Database
  DATABASE_URL: isProduction
    ? z.string().min(1, "DATABASE_URL is required in production")
    : z.string().min(1).optional(),

  // NextAuth
  AUTH_SECRET: isProduction
    ? z.string().min(1, "AUTH_SECRET is required in production")
    : z.string().min(1).optional(),
  AUTH_URL: z.string().url().optional(),
  AUTH_TRUST_HOST: z.string().optional(),

  // OAuth providers
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  FACEBOOK_CLIENT_ID: z.string().optional(),
  FACEBOOK_CLIENT_SECRET: z.string().optional(),

  // Email
  RESEND_API_KEY: z.string().optional(),

  // AI / Chatbot
  GROQ_API_KEY: z.string().optional(),

  // Cron
  CRON_SECRET: z.string().optional(),

  // WhatsApp (Meta Cloud API)
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),

  // Sentry (server)
  SENTRY_AUTH_TOKEN: z.string().optional(),
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
})

/**
 * Client-safe environment variables.
 * Only `NEXT_PUBLIC_*` vars are available in the browser.
 */
const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
})

type ServerEnv = z.infer<typeof serverSchema>
type ClientEnv = z.infer<typeof clientSchema>
type Env = ServerEnv & ClientEnv

/**
 * Raw process.env values we care about.
 * Hardcoded so the Next.js compiler can inline `NEXT_PUBLIC_*` at build time.
 */
const rawEnv = {
  NODE_ENV: process.env.NODE_ENV,

  DATABASE_URL: process.env.DATABASE_URL,

  AUTH_SECRET: process.env.AUTH_SECRET,
  AUTH_URL: process.env.AUTH_URL,
  AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  FACEBOOK_CLIENT_ID: process.env.FACEBOOK_CLIENT_ID,
  FACEBOOK_CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET,

  RESEND_API_KEY: process.env.RESEND_API_KEY,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  CRON_SECRET: process.env.CRON_SECRET,

  WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
  WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN,

  SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
  SENTRY_DSN: process.env.SENTRY_DSN,
  SENTRY_ORG: process.env.SENTRY_ORG,
  SENTRY_PROJECT: process.env.SENTRY_PROJECT,

  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
} as const

/**
 * Parse + validate once, lazily on first access.
 * Throws in production when required vars are missing.
 * Warns in development when optional vars are missing.
 */
let cached: Env | undefined

function parseEnv(): Env {
  if (cached) return cached

  const isServer = typeof window === "undefined"
  const merged = z.object({ ...serverSchema.shape, ...clientSchema.shape })
  const result = merged.safeParse(rawEnv)

  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n")

    // Production: always throw so deploys fail fast.
    if (isProduction) {
      throw new Error(`Invalid environment variables:\n${issues}`)
    }

    // Development: warn but keep running.
    console.warn(
      `[env] Invalid or missing environment variables (non-fatal in development):\n${issues}`,
    )
  }

  // In development, warn about missing optional vars that gate features.
  if (!isProduction && isServer) {
    const optionalChecks: Array<[keyof typeof rawEnv, string]> = [
      ["RESEND_API_KEY", "email sending disabled"],
      ["GROQ_API_KEY", "chatbot disabled"],
      ["CRON_SECRET", "cron endpoints will reject all requests"],
      ["GOOGLE_CLIENT_ID", "Google OAuth disabled"],
      ["FACEBOOK_CLIENT_ID", "Facebook OAuth disabled"],
      ["WHATSAPP_ACCESS_TOKEN", "WhatsApp notifications disabled"],
      ["SENTRY_DSN", "Sentry error reporting disabled"],
    ]

    for (const [key, reason] of optionalChecks) {
      if (!rawEnv[key]) {
        console.warn(`[env] ${key} is not set — ${reason}`)
      }
    }
  }

  // `safeParse` with optional fields always produces a partial object even on
  // failure, so fall back to `rawEnv` when parsing fails in development.
  cached = (result.success ? result.data : (rawEnv as unknown as Env)) as Env
  return cached
}

/**
 * Validated environment variables.
 *
 * Access is lazy: parsing + validation happens on first property read, not at
 * import time. This keeps edge bundles small and avoids crashing during build.
 *
 * @example
 *   import { env } from "@/lib/env"
 *   const db = new Pool({ connectionString: env.DATABASE_URL })
 */
export const env = new Proxy({} as Env, {
  get(_target, prop: string) {
    const parsed = parseEnv()
    return parsed[prop as keyof Env]
  },
  has(_target, prop: string) {
    const parsed = parseEnv()
    return prop in parsed
  },
  ownKeys() {
    return Reflect.ownKeys(parseEnv())
  },
  getOwnPropertyDescriptor(_target, prop: string) {
    const parsed = parseEnv()
    if (prop in parsed) {
      return {
        enumerable: true,
        configurable: true,
        value: parsed[prop as keyof Env],
      }
    }
    return undefined
  },
})

export type { Env, ServerEnv, ClientEnv }
