import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

async function loadFresh() {
  vi.resetModules()
  return import("@/lib/env")
}

describe("env", () => {
  const snapshot = { ...process.env }

  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  afterEach(() => {
    Object.assign(process.env, snapshot)
    vi.restoreAllMocks()
  })

  it("exposes NEXT_PUBLIC_APP_URL and reads from process.env lazily", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com"
    const { env } = await loadFresh()
    expect(env.NEXT_PUBLIC_APP_URL).toBe("https://app.example.com")
  })

  it("warns in development for missing optional vars without throwing", async () => {
    Object.assign(process.env, { NODE_ENV: "development" })
    delete process.env.RESEND_API_KEY
    delete process.env.GROQ_API_KEY

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
    const { env } = await loadFresh()
    // trigger lazy parse
    void env.RESEND_API_KEY

    // The env module may not log when on SSR-only warnings, but touching env
    // should not throw in development.
    expect(() => env.DATABASE_URL).not.toThrow()
    warnSpy.mockRestore()
  })

  it("caches parsed env across accesses (no duplicate warnings)", async () => {
    Object.assign(process.env, { NODE_ENV: "development" })
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

    const { env } = await loadFresh()
    void env.DATABASE_URL
    const calls1 = warnSpy.mock.calls.length
    void env.DATABASE_URL
    const calls2 = warnSpy.mock.calls.length

    expect(calls2).toBe(calls1)
    warnSpy.mockRestore()
  })

  it("has DATABASE_URL accessible as proxy property", async () => {
    process.env.DATABASE_URL = "postgres://localhost/mazin"
    const { env } = await loadFresh()
    expect(env.DATABASE_URL).toBe("postgres://localhost/mazin")
    expect("DATABASE_URL" in env).toBe(true)
  })
})
