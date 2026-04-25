/**
 * Staff invite lifecycle — issue, accept, revoke. Ensures expired and
 * already-accepted invites can't be consumed twice.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn() }))
vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({
    user: { id: "admin-1", email: "admin@abdout.sd", type: "STAFF", role: "ADMIN" },
  })),
}))

const userFindUnique = vi.fn()
const userCreate = vi.fn()
const inviteFindUnique = vi.fn()
const inviteUpdate = vi.fn()
const inviteCreate = vi.fn()
const inviteUpdateMany = vi.fn()

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: (args: unknown) => userFindUnique(args),
      create: (args: unknown) => userCreate(args),
    },
    staffInvite: {
      findUnique: (args: unknown) => inviteFindUnique(args),
      create: (args: unknown) => inviteCreate(args),
      update: (args: unknown) => inviteUpdate(args),
      updateMany: (args: unknown) => inviteUpdateMany(args),
      findMany: vi.fn(async () => []),
    },
  },
}))

import { inviteStaff, acceptInvite } from "@/components/platform/settings/team/actions"

describe("inviteStaff", () => {
  beforeEach(() => {
    userFindUnique.mockReset()
    inviteCreate.mockReset()
    inviteUpdateMany.mockReset()
    inviteCreate.mockResolvedValue({ id: "invite-1" })
  })

  it("rejects if user already exists", async () => {
    userFindUnique.mockResolvedValue({ id: "existing" })
    const result = await inviteStaff({ email: "exist@x.sd", role: "CLERK" })
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/already exists/)
    expect(inviteCreate).not.toHaveBeenCalled()
  })

  it("supersedes existing pending invites before issuing new one", async () => {
    userFindUnique.mockResolvedValue(null)
    await inviteStaff({ email: "new@x.sd", role: "MANAGER" })
    expect(inviteUpdateMany).toHaveBeenCalledWith({
      where: { email: "new@x.sd", status: "PENDING" },
      data: { status: "REVOKED" },
    })
    expect(inviteCreate).toHaveBeenCalled()
  })

  it("returns a claimable invite URL", async () => {
    userFindUnique.mockResolvedValue(null)
    const result = await inviteStaff({ email: "new@x.sd", role: "CLERK" })
    expect(result.success).toBe(true)
    expect(result.inviteUrl).toMatch(/^\/join\/invite\/[A-Za-z0-9_-]+$/)
  })
})

describe("acceptInvite", () => {
  beforeEach(() => {
    inviteFindUnique.mockReset()
    userFindUnique.mockReset()
    userCreate.mockReset()
    inviteUpdate.mockReset()
  })

  it("rejects unknown tokens", async () => {
    inviteFindUnique.mockResolvedValue(null)
    const result = await acceptInvite({
      token: "abcdefghijklmnopqrst",
      name: "User",
      password: "password123",
    })
    expect(result.success).toBe(false)
  })

  it("rejects already-accepted invites", async () => {
    inviteFindUnique.mockResolvedValue({
      id: "i1",
      status: "ACCEPTED",
      expiresAt: new Date(Date.now() + 1e6),
    })
    const result = await acceptInvite({
      token: "abcdefghijklmnopqrst",
      name: "User",
      password: "password123",
    })
    expect(result.success).toBe(false)
  })

  it("rejects expired invites and marks them EXPIRED", async () => {
    inviteFindUnique.mockResolvedValue({
      id: "i1",
      status: "PENDING",
      expiresAt: new Date(Date.now() - 1000),
    })
    const result = await acceptInvite({
      token: "abcdefghijklmnopqrst",
      name: "User",
      password: "password123",
    })
    expect(result.success).toBe(false)
    expect(inviteUpdate).toHaveBeenCalledWith({
      where: { id: "i1" },
      data: { status: "EXPIRED" },
    })
  })

  it("creates a STAFF user and marks invite ACCEPTED", async () => {
    inviteFindUnique.mockResolvedValue({
      id: "i1",
      email: "new@x.sd",
      role: "MANAGER",
      status: "PENDING",
      expiresAt: new Date(Date.now() + 1e6),
    })
    userFindUnique.mockResolvedValue(null)
    userCreate.mockResolvedValue({ id: "user-new", email: "new@x.sd" })

    const result = await acceptInvite({
      token: "abcdefghijklmnopqrst",
      name: "New User",
      password: "password123",
    })
    expect(result.success).toBe(true)
    expect(userCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "new@x.sd",
          type: "STAFF",
          role: "MANAGER",
        }),
      })
    )
    expect(inviteUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "i1" },
        data: expect.objectContaining({ status: "ACCEPTED" }),
      })
    )
  })

  it("rejects if an account already exists for that email", async () => {
    inviteFindUnique.mockResolvedValue({
      id: "i1",
      email: "new@x.sd",
      role: "CLERK",
      status: "PENDING",
      expiresAt: new Date(Date.now() + 1e6),
    })
    userFindUnique.mockResolvedValue({ id: "existing" })
    const result = await acceptInvite({
      token: "abcdefghijklmnopqrst",
      name: "User",
      password: "password123",
    })
    expect(result.success).toBe(false)
    expect(userCreate).not.toHaveBeenCalled()
  })
})
