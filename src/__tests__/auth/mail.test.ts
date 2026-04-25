import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

const sendMock = vi.hoisted(() => vi.fn())
const ResendCtor = vi.hoisted(() => {
  function Resend() {
    return { emails: { send: sendMock } }
  }
  return vi.fn(Resend as any)
})

vi.mock("resend", () => ({ Resend: ResendCtor }))

let mailModule: typeof import("@/components/auth/mail")

async function loadFresh() {
  vi.resetModules()
  mailModule = await import("@/components/auth/mail")
}

describe("auth/mail", () => {
  const origKey = process.env.RESEND_API_KEY
  const origUrl = process.env.NEXT_PUBLIC_APP_URL
  const origFrom = process.env.EMAIL_FROM

  beforeEach(async () => {
    sendMock.mockReset()
    ResendCtor.mockClear()
  })

  afterEach(() => {
    process.env.RESEND_API_KEY = origKey
    process.env.NEXT_PUBLIC_APP_URL = origUrl
    process.env.EMAIL_FROM = origFrom
  })

  it("returns silently when RESEND_API_KEY is unset", async () => {
    delete process.env.RESEND_API_KEY
    await loadFresh()

    await mailModule.sendTwoFactorTokenEmail("a@b.c", "123456")
    await mailModule.sendPasswordResetEmail("a@b.c", "tok")
    await mailModule.sendVerificationEmail("a@b.c", "tok")

    expect(sendMock).not.toHaveBeenCalled()
    expect(ResendCtor).not.toHaveBeenCalled()
  })

  it("sends 2FA email with token in body", async () => {
    process.env.RESEND_API_KEY = "re_test"
    process.env.EMAIL_FROM = "from@x"
    await loadFresh()

    sendMock.mockResolvedValue({})
    await mailModule.sendTwoFactorTokenEmail("user@x.com", "123456")

    const arg = sendMock.mock.calls[0]![0]
    expect(arg.to).toBe("user@x.com")
    expect(arg.from).toBe("from@x")
    expect(arg.subject).toBe("2FA Code")
    expect(arg.html).toContain("123456")
  })

  it("builds reset link using NEXT_PUBLIC_APP_URL", async () => {
    process.env.RESEND_API_KEY = "re_test"
    process.env.NEXT_PUBLIC_APP_URL = "https://app.mazin.sd"
    await loadFresh()

    sendMock.mockResolvedValue({})
    await mailModule.sendPasswordResetEmail("user@x.com", "reset-tok")

    const arg = sendMock.mock.calls[0]![0]
    expect(arg.html).toContain("https://app.mazin.sd/new-password?token=reset-tok")
  })

  it("builds verification link pointing at /new-verification", async () => {
    process.env.RESEND_API_KEY = "re_test"
    process.env.NEXT_PUBLIC_APP_URL = "https://app.mazin.sd"
    await loadFresh()

    sendMock.mockResolvedValue({})
    await mailModule.sendVerificationEmail("user@x.com", "verify-tok")

    const arg = sendMock.mock.calls[0]![0]
    expect(arg.html).toContain("/new-verification?token=verify-tok")
    expect(arg.text).toContain("/new-verification?token=verify-tok")
  })

  it("swallows delivery errors without re-throwing", async () => {
    process.env.RESEND_API_KEY = "re_test"
    await loadFresh()

    sendMock.mockRejectedValue(new Error("network down"))

    await expect(mailModule.sendTwoFactorTokenEmail("a@b.c", "1")).resolves.toBeUndefined()
    await expect(mailModule.sendPasswordResetEmail("a@b.c", "t")).resolves.toBeUndefined()
    await expect(mailModule.sendVerificationEmail("a@b.c", "t")).resolves.toBeUndefined()
  })

  it("reuses a single Resend client across sends", async () => {
    process.env.RESEND_API_KEY = "re_test"
    await loadFresh()

    sendMock.mockResolvedValue({})
    await mailModule.sendTwoFactorTokenEmail("a@b.c", "1")
    await mailModule.sendPasswordResetEmail("a@b.c", "1")
    await mailModule.sendVerificationEmail("a@b.c", "1")

    // Constructor called lazily the first time
    expect(ResendCtor).toHaveBeenCalledTimes(1)
  })
})
