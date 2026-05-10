import { describe, expect, it } from "vitest"
import {
  can,
  userCan,
  requireCan,
  ForbiddenError,
  type Action,
  type Resource,
} from "@/lib/authorization"
import type { AuthContext } from "@/lib/auth-context"

const mkCtx = (role: AuthContext["role"], type: AuthContext["userType"] = "STAFF"): AuthContext => ({
  userId: "u",
  userType: type,
  role,
  email: "u@x.sd",
})

// Session-user shape used by `userCan()` — mirrors what NextAuth puts in
// `session.user`. Kept tiny so these tests don't drag the full Session type.
const su = (role: string | null, type: string | null = "STAFF") => ({
  id: "u",
  type,
  role,
})

describe("authorization.can", () => {
  it("ADMIN can do anything", () => {
    const ctx = mkCtx("ADMIN")
    expect(can(ctx, "delete", "finance")).toBe(true)
    expect(can(ctx, "approve", "invoice")).toBe(true)
  })

  it("MANAGER can approve invoices but not manage settings", () => {
    const ctx = mkCtx("MANAGER")
    expect(can(ctx, "approve", "invoice")).toBe(true)
    expect(can(ctx, "update", "settings")).toBe(false)
  })

  it("CLERK cannot approve or delete finance", () => {
    const ctx = mkCtx("CLERK")
    expect(can(ctx, "create", "finance")).toBe(true)
    expect(can(ctx, "approve", "finance")).toBe(false)
    expect(can(ctx, "delete", "finance")).toBe(false)
  })

  it("VIEWER is read-only everywhere", () => {
    const ctx = mkCtx("VIEWER")
    expect(can(ctx, "read", "shipment")).toBe(true)
    expect(can(ctx, "create", "shipment")).toBe(false)
  })

  it("community users always fail staff permissions", () => {
    const ctx = mkCtx("ADMIN", "COMMUNITY")
    expect(can(ctx, "read", "shipment")).toBe(false)
  })

  it("null ctx fails", () => {
    expect(can(null, "read", "shipment")).toBe(false)
  })
})

describe("authorization.requireCan", () => {
  it("throws ForbiddenError (with metadata) for forbidden", () => {
    try {
      requireCan(mkCtx("CLERK"), "delete", "finance")
      expect.fail("expected ForbiddenError")
    } catch (err) {
      expect(err).toBeInstanceOf(ForbiddenError)
      const f = err as ForbiddenError
      expect(f.role).toBe("CLERK")
      expect(f.action).toBe("delete")
      expect(f.resource).toBe("finance")
      // Message stays human-readable for log lines, never reaches the user.
      expect(f.message).toMatch(/Forbidden/)
    }
  })

  it("passes for allowed", () => {
    expect(() => requireCan(mkCtx("MANAGER"), "read", "invoice")).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// Per-resource matrix for the new finance domain (issue #5 acceptance).
// Each test below codifies the role matrix from `docs/audit/security.md` so
// silent regressions show up as red, not as a privilege-escalation bug.
// ---------------------------------------------------------------------------

describe("authorization matrix — finance domain (audit P0 #5)", () => {
  it("ADMIN bypasses every restriction", () => {
    const cases: Array<[Action, Resource]> = [
      ["delete", "payroll"],
      ["approve", "budget"],
      ["delete", "account"],
      ["approve", "expense"],
      ["update", "wallet"],
    ]
    for (const [a, r] of cases) {
      expect(can(mkCtx("ADMIN"), a, r)).toBe(true)
    }
  })

  it("MANAGER has full payroll/budget/expense; account has no approve workflow", () => {
    for (const a of ["read", "create", "update", "delete", "approve"] as Action[]) {
      expect(can(mkCtx("MANAGER"), a, "payroll")).toBe(true)
      expect(can(mkCtx("MANAGER"), a, "budget")).toBe(true)
      expect(can(mkCtx("MANAGER"), a, "expense")).toBe(true)
    }
    expect(can(mkCtx("MANAGER"), "delete", "account")).toBe(true)
    expect(can(mkCtx("MANAGER"), "approve", "account")).toBe(false)
  })

  it("CLERK reads payroll/account/budget but cannot mutate", () => {
    for (const r of ["payroll", "account", "budget"] as const) {
      expect(can(mkCtx("CLERK"), "read", r)).toBe(true)
      for (const a of ["create", "update", "delete", "approve"] as Action[]) {
        expect(can(mkCtx("CLERK"), a, r)).toBe(false)
      }
    }
  })

  it("CLERK can submit expenses; cannot approve/update/delete", () => {
    expect(can(mkCtx("CLERK"), "create", "expense")).toBe(true)
    expect(can(mkCtx("CLERK"), "read", "expense")).toBe(true)
    expect(can(mkCtx("CLERK"), "approve", "expense")).toBe(false)
    expect(can(mkCtx("CLERK"), "update", "expense")).toBe(false)
    expect(can(mkCtx("CLERK"), "delete", "expense")).toBe(false)
  })

  it("CLERK can deposit/drawdown wallet (operational role)", () => {
    expect(can(mkCtx("CLERK"), "create", "wallet")).toBe(true)
    expect(can(mkCtx("CLERK"), "update", "wallet")).toBe(true)
  })

  it("VIEWER is read-only across every finance resource", () => {
    const finance: Resource[] = ["payroll", "account", "wallet", "expense", "budget"]
    for (const r of finance) {
      expect(can(mkCtx("VIEWER"), "read", r)).toBe(true)
      for (const a of ["create", "update", "delete", "approve"] as Action[]) {
        expect(can(mkCtx("VIEWER"), a, r)).toBe(false)
      }
    }
  })
})

describe("userCan — session-user shape", () => {
  it("matches `can()` for STAFF users", () => {
    expect(userCan(su("ADMIN"), "delete", "payroll")).toBe(true)
    expect(userCan(su("MANAGER"), "approve", "expense")).toBe(true)
    expect(userCan(su("CLERK"), "create", "expense")).toBe(true)
    expect(userCan(su("CLERK"), "approve", "expense")).toBe(false)
    expect(userCan(su("VIEWER"), "create", "payroll")).toBe(false)
  })

  it("blocks COMMUNITY users regardless of stored role (defence in depth)", () => {
    // Even if a stored role accidentally says ADMIN, COMMUNITY type wins —
    // important because OAuth signups are now type=COMMUNITY by default.
    expect(userCan(su("ADMIN", "COMMUNITY"), "create", "payroll")).toBe(false)
  })

  it("fails closed when fields are missing", () => {
    expect(userCan(undefined, "read", "payroll")).toBe(false)
    expect(userCan(null, "read", "payroll")).toBe(false)
    expect(userCan(su(null, "STAFF"), "read", "payroll")).toBe(false)
    expect(
      userCan({ id: undefined, type: "STAFF", role: "ADMIN" }, "read", "payroll"),
    ).toBe(false)
  })

  it("fails closed for unknown role strings (schema-drift defence)", () => {
    expect(userCan(su("SUPERUSER"), "read", "payroll")).toBe(false)
  })
})
