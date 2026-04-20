import { vi } from "vitest"

export function mockAuth(session: unknown = null) {
  const authMock = vi.fn().mockResolvedValue(session)
  vi.doMock("@/auth", () => ({ auth: authMock }))
  return authMock
}

export function mockAuthenticatedSession(overrides = {}) {
  return {
    user: { id: "test-user-id", name: "Test User", email: "test@test.com", role: "ADMIN", ...overrides },
    expires: new Date(Date.now() + 86400000).toISOString(),
  }
}

export function mockUnauthenticatedSession() {
  return null
}
