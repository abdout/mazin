import { describe, expect, it } from "vitest"
import { can, requireCan } from "@/lib/authorization"
import type { AuthContext } from "@/lib/auth-context"

const mkCtx = (role: AuthContext["role"], type: AuthContext["userType"] = "STAFF"): AuthContext => ({
  userId: "u",
  userType: type,
  role,
  email: "u@x.sd",
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
  it("throws for forbidden", () => {
    expect(() => requireCan(mkCtx("CLERK"), "delete", "finance")).toThrow(/Forbidden/)
  })

  it("passes for allowed", () => {
    expect(() => requireCan(mkCtx("MANAGER"), "read", "invoice")).not.toThrow()
  })
})
