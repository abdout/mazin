import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { NextRequest } from "next/server"

vi.mock("next-auth/jwt", () => ({
  getToken: vi.fn(),
}))

import { getToken } from "next-auth/jwt"
import { middleware } from "@/middleware"

function makeRequest(
  url: string,
  opts: { cookie?: string; method?: string; xff?: string } = {}
): NextRequest {
  const headers = new Headers()
  if (opts.cookie) headers.set("cookie", opts.cookie)
  if (opts.xff) headers.set("x-forwarded-for", opts.xff)
  return new NextRequest(new Request(url, { method: opts.method ?? "GET", headers }))
}

describe("middleware JWT verification", () => {
  const originalSecret = process.env.AUTH_SECRET
  const originalVerify = process.env.AUTH_JWT_VERIFY

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.AUTH_SECRET = "test-secret"
    process.env.AUTH_JWT_VERIFY = "strict"
  })

  afterEach(() => {
    process.env.AUTH_SECRET = originalSecret
    process.env.AUTH_JWT_VERIFY = originalVerify
  })

  it("rejects a forged cookie when AUTH_SECRET is configured", async () => {
    // A random cookie value without a valid signature → getToken returns null,
    // previously the middleware would have treated it as logged-in on presence.
    vi.mocked(getToken).mockResolvedValueOnce(null)
    const req = makeRequest("http://localhost:3000/en/dashboard", {
      cookie: "authjs.session-token=forged.nonsense.value",
    })
    const res = await middleware(req)
    // Anonymous on a protected route → redirected to /en/login.
    expect(res?.status).toBe(307)
    expect(res?.headers.get("location")).toContain("/login")
  })

  it("lets a request through when getToken verifies the JWT", async () => {
    vi.mocked(getToken).mockResolvedValueOnce({ sub: "user-a" } as any)
    const req = makeRequest("http://localhost:3000/en/dashboard", {
      cookie: "authjs.session-token=valid.jwt.here",
    })
    const res = await middleware(req)
    // Authed → no redirect; NextResponse.next() has no location header.
    expect(res?.headers.get("location")).toBeNull()
  })

  it("falls back to cookie-presence when AUTH_JWT_VERIFY=lax (rollback lever)", async () => {
    process.env.AUTH_JWT_VERIFY = "lax"
    // getToken should NOT be consulted under lax mode.
    const req = makeRequest("http://localhost:3000/en/dashboard", {
      cookie: "authjs.session-token=anything",
    })
    const res = await middleware(req)
    expect(res?.headers.get("location")).toBeNull()
    expect(getToken).not.toHaveBeenCalled()
  })

  it("falls back to cookie-presence when AUTH_SECRET is missing", async () => {
    delete process.env.AUTH_SECRET
    const req = makeRequest("http://localhost:3000/en/dashboard")
    const res = await middleware(req)
    // No cookie, no secret → still treated as anonymous → redirect to /login.
    expect(res?.status).toBe(307)
    expect(res?.headers.get("location")).toContain("/login")
    expect(getToken).not.toHaveBeenCalled()
  })

  it("redirects logged-in users away from auth routes after verifying", async () => {
    vi.mocked(getToken).mockResolvedValueOnce({ sub: "user-a" } as any)
    const req = makeRequest("http://localhost:3000/en/login", {
      cookie: "authjs.session-token=valid.jwt",
    })
    const res = await middleware(req)
    expect(res?.status).toBe(307)
    expect(res?.headers.get("location")).toContain("/dashboard")
  })

  // ---------------------------------------------------------------------------
  // Community vs staff routing (JWT `type` claim)
  // ---------------------------------------------------------------------------

  it("sends COMMUNITY users to /marketplace on post-login redirect, not /dashboard", async () => {
    // Use mockResolvedValue (not Once) because middleware consults getToken
    // twice on auth routes: once for isAuthenticated, once for the type lookup.
    vi.mocked(getToken).mockResolvedValue({
      sub: "user-c",
      type: "COMMUNITY",
    } as any)
    const req = makeRequest("http://localhost:3000/en/login", {
      cookie: "authjs.session-token=valid.jwt",
    })
    const res = await middleware(req)
    expect(res?.status).toBe(307)
    expect(res?.headers.get("location")).toContain("/marketplace")
    expect(res?.headers.get("location")).not.toContain("/dashboard")
  })

  it("sends staff users to /dashboard even when type is absent from the token", async () => {
    vi.mocked(getToken).mockResolvedValue({ sub: "user-a" } as any)
    const req = makeRequest("http://localhost:3000/en/login", {
      cookie: "authjs.session-token=valid.jwt",
    })
    const res = await middleware(req)
    expect(res?.status).toBe(307)
    expect(res?.headers.get("location")).toContain("/dashboard")
  })

  it("kicks COMMUNITY users off staff surfaces like /dashboard", async () => {
    vi.mocked(getToken).mockResolvedValue({
      sub: "user-c",
      type: "COMMUNITY",
    } as any)
    const req = makeRequest("http://localhost:3000/en/dashboard", {
      cookie: "authjs.session-token=valid.jwt",
    })
    const res = await middleware(req)
    expect(res?.status).toBe(307)
    expect(res?.headers.get("location")).toContain("/marketplace")
  })

  it("allows COMMUNITY users to reach /marketplace (in allowlist)", async () => {
    vi.mocked(getToken).mockResolvedValue({
      sub: "user-c",
      type: "COMMUNITY",
    } as any)
    const req = makeRequest("http://localhost:3000/en/marketplace", {
      cookie: "authjs.session-token=valid.jwt",
    })
    const res = await middleware(req)
    expect(res?.headers.get("location")).toBeNull()
  })

  it("allows COMMUNITY users to reach /settings/profile (in allowlist)", async () => {
    vi.mocked(getToken).mockResolvedValue({
      sub: "user-c",
      type: "COMMUNITY",
    } as any)
    const req = makeRequest("http://localhost:3000/en/settings/profile", {
      cookie: "authjs.session-token=valid.jwt",
    })
    const res = await middleware(req)
    expect(res?.headers.get("location")).toBeNull()
  })

  it("redirects COMMUNITY users away from /settings/notifications (not in allowlist)", async () => {
    // The allowlist is /settings/profile and /settings/security only; other
    // settings sub-routes are staff-only.
    vi.mocked(getToken).mockResolvedValue({
      sub: "user-c",
      type: "COMMUNITY",
    } as any)
    const req = makeRequest("http://localhost:3000/en/settings/notifications", {
      cookie: "authjs.session-token=valid.jwt",
    })
    const res = await middleware(req)
    expect(res?.status).toBe(307)
    expect(res?.headers.get("location")).toContain("/marketplace")
  })

  it("lets staff users reach any protected route regardless of community allowlist", async () => {
    vi.mocked(getToken).mockResolvedValue({
      sub: "user-a",
      type: "STAFF",
    } as any)
    const req = makeRequest("http://localhost:3000/en/finance/expenses", {
      cookie: "authjs.session-token=valid.jwt",
    })
    const res = await middleware(req)
    expect(res?.headers.get("location")).toBeNull()
  })

  it("lax mode skips the community guard — no extra getToken call, staff-default behaviour", async () => {
    process.env.AUTH_JWT_VERIFY = "lax"
    const req = makeRequest("http://localhost:3000/en/dashboard", {
      cookie: "authjs.session-token=anything",
    })
    const res = await middleware(req)
    // Treated as staff (the default), not redirected away from /dashboard.
    expect(res?.headers.get("location")).toBeNull()
    // getToken never consulted in lax mode.
    expect(getToken).not.toHaveBeenCalled()
  })
})
