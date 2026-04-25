import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

const authMock = vi.hoisted(() => vi.fn())
vi.mock("@/auth", () => ({ auth: authMock }))

import { reportIssue } from "@/actions/report-issue"

describe("reportIssue", () => {
  const origFetch = globalThis.fetch
  const origToken = process.env.GITHUB_PERSONAL_ACCESS_TOKEN
  const origRepo = process.env.GITHUB_REPO

  beforeEach(() => {
    vi.clearAllMocks()
    authMock.mockResolvedValue({
      user: { name: "Test User", email: "test@example.com" },
    })
    process.env.GITHUB_PERSONAL_ACCESS_TOKEN = "test-token"
    process.env.GITHUB_REPO = "test/repo"
  })

  afterEach(() => {
    globalThis.fetch = origFetch
    process.env.GITHUB_PERSONAL_ACCESS_TOKEN = origToken
    process.env.GITHUB_REPO = origRepo
  })

  it("throws when GITHUB_PERSONAL_ACCESS_TOKEN is missing", async () => {
    delete process.env.GITHUB_PERSONAL_ACCESS_TOKEN
    await expect(
      reportIssue({ description: "Bug", pageUrl: "/dashboard" })
    ).rejects.toThrow("GITHUB_PERSONAL_ACCESS_TOKEN not configured")
  })

  it("POSTs an issue with [category] prefix and truncates long descriptions", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ comments_url: "https://api.github.com/comments/1" }),
    } as any)
    globalThis.fetch = fetchMock

    const longDesc = "x".repeat(200)
    await reportIssue({
      description: longDesc,
      pageUrl: "/dashboard",
      category: "bug",
    })

    // First call is the POST /issues
    const firstCall = fetchMock.mock.calls[0]!
    const url = firstCall[0] as string
    const init = firstCall[1] as RequestInit
    const payload = JSON.parse(init.body as string)

    expect(url).toBe("https://api.github.com/repos/test/repo/issues")
    expect(payload.title.startsWith("[bug] ")).toBe(true)
    expect(payload.title.length).toBeLessThanOrEqual(80)
    expect(payload.title.endsWith("...")).toBe(true)
    expect(payload.labels).toEqual(["report"])
    expect(payload.body).toContain("/dashboard")
    expect(payload.body).toContain("Test User")
  })

  it("retries after creating label when POST returns 422", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 422, text: async () => "" } as any)
      .mockResolvedValueOnce({ ok: true, status: 201 } as any) // create label
      .mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({}) } as any) // retry POST
    globalThis.fetch = fetchMock

    await reportIssue({ description: "issue", pageUrl: "/x" })

    expect(fetchMock).toHaveBeenCalledTimes(3)
    // label create
    expect(fetchMock.mock.calls[1]![0]).toContain("/labels")
  })

  it("throws on non-ok retry response", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 422, text: async () => "" } as any)
      .mockResolvedValueOnce({ ok: false, status: 500, text: async () => "" } as any) // label
      .mockResolvedValueOnce({ ok: false, status: 500, text: async () => "boom" } as any)
    globalThis.fetch = fetchMock

    await expect(
      reportIssue({ description: "issue", pageUrl: "/x" })
    ).rejects.toThrow(/GitHub API error/)
  })

  it("uses Anonymous when auth returns null", async () => {
    authMock.mockResolvedValue(null)
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({}),
    } as any)
    globalThis.fetch = fetchMock

    await reportIssue({ description: "anon bug", pageUrl: "/page" })
    const payload = JSON.parse(fetchMock.mock.calls[0]![1].body)
    expect(payload.body).toContain("Anonymous")
  })

  it("uses Anonymous when auth() throws", async () => {
    authMock.mockRejectedValue(new Error("session error"))
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({}),
    } as any)
    globalThis.fetch = fetchMock

    await reportIssue({ description: "anon bug", pageUrl: "/page" })
    const payload = JSON.parse(fetchMock.mock.calls[0]![1].body)
    expect(payload.body).toContain("Anonymous")
  })

  it("omits category prefix when category is 'other'", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({}),
    } as any)
    globalThis.fetch = fetchMock

    await reportIssue({ description: "a short bug", pageUrl: "/x", category: "other" })
    const payload = JSON.parse(fetchMock.mock.calls[0]![1].body)
    expect(payload.title).toBe("a short bug")
  })
})
