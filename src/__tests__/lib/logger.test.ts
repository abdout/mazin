import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

const sentryMocks = vi.hoisted(() => ({
  addBreadcrumb: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}))

vi.mock("@sentry/nextjs", () => sentryMocks)

import { logger } from "@/lib/logger"

describe("logger", () => {
  const origEnv = process.env.NODE_ENV
  let infoSpy: ReturnType<typeof vi.spyOn>
  let warnSpy: ReturnType<typeof vi.spyOn>
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    infoSpy = vi.spyOn(console, "info").mockImplementation(() => {})
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    Object.assign(process.env, { NODE_ENV: origEnv })
    infoSpy.mockRestore()
    warnSpy.mockRestore()
    errorSpy.mockRestore()
  })

  it("info logs to console only in development", () => {
    Object.assign(process.env, { NODE_ENV: "development" })
    const log = logger.forModule("test.module")

    log.info("hello", { extra: 1 })
    expect(infoSpy).toHaveBeenCalledWith("[test.module] hello", { extra: 1 })

    Object.assign(process.env, { NODE_ENV: "production" })
    infoSpy.mockClear()
    log.info("hidden")
    expect(infoSpy).not.toHaveBeenCalled()
  })

  it("warn logs to console AND adds a Sentry breadcrumb", () => {
    const log = logger.forModule("mod")
    log.warn("careful", { code: 42 })
    expect(warnSpy).toHaveBeenCalled()
    expect(sentryMocks.addBreadcrumb).toHaveBeenCalledWith({
      category: "mod",
      message: "careful",
      level: "warning",
      data: { code: 42 },
    })
  })

  it("error captures Error instance with Sentry.captureException", () => {
    const log = logger.forModule("mod")
    const err = new Error("boom")
    log.error("failed", err, { userId: "u1" })
    expect(sentryMocks.captureException).toHaveBeenCalledWith(err, {
      tags: { module: "mod" },
      extra: { message: "failed", userId: "u1" },
    })
  })

  it("error captures non-Error with Sentry.captureMessage", () => {
    const log = logger.forModule("mod")
    log.error("failed", "just-a-string")
    expect(sentryMocks.captureMessage).toHaveBeenCalledWith(
      "[mod] failed",
      expect.objectContaining({ level: "error", tags: { module: "mod" } })
    )
  })

  it("fatal always logs to console and captures as fatal", () => {
    Object.assign(process.env, { NODE_ENV: "production" })
    const log = logger.forModule("mod")
    const err = new Error("nuclear")
    log.fatal("critical", err)
    expect(errorSpy).toHaveBeenCalled()
    expect(sentryMocks.captureException).toHaveBeenCalledWith(
      err,
      expect.objectContaining({ level: "fatal" })
    )
  })
})
