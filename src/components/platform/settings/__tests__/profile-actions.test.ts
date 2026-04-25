import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/components/auth/account", () => ({
  getAccountByUserId: vi.fn(),
}))
vi.mock("@/components/auth/user", () => ({
  getUserByEmail: vi.fn(),
}))

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { getAccountByUserId } from "@/components/auth/account"
import { getUserByEmail } from "@/components/auth/user"
import { updateProfile } from "../profile/actions"
import { makeSession } from "@/__tests__/helpers/factories"

const USER_A = "user-a"

describe("settings profile actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(
      makeSession({ user: { id: USER_A, role: "ADMIN", name: "A", email: "a@t" } }) as any
    )
    vi.mocked(getAccountByUserId).mockResolvedValue(null as any)
  })

  describe("updateProfile", () => {
    it("rejects unauthenticated callers", async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as any)
      const res = await updateProfile({ name: "Test" })
      expect(res.ok).toBe(false)
      if (!res.ok) expect(res.error).toBe("UNAUTHENTICATED")
      expect(db.user.update).not.toHaveBeenCalled()
    })

    it("returns INVALID_INPUT with field issues for bad email", async () => {
      const res = await updateProfile({ email: "not-an-email" })
      expect(res.ok).toBe(false)
      if (!res.ok) {
        expect(res.error).toBe("INVALID_INPUT")
        expect(res.issues?.email).toBeDefined()
      }
    })

    it("drops email change for OAuth users (silent, not error)", async () => {
      vi.mocked(getAccountByUserId).mockResolvedValueOnce({ provider: "google" } as any)
      vi.mocked(db.user.update).mockResolvedValue({ id: USER_A } as any)
      const res = await updateProfile({
        name: "New Name",
        email: "newemail@example.com",
      })
      expect(res.ok).toBe(true)
      // Verify the update payload did NOT include an email change.
      const call = vi.mocked(db.user.update).mock.calls[0]?.[0] as any
      expect(call.data.email).toBeUndefined()
      expect(call.data.name).toBe("New Name")
    })

    it("rejects an email collision with another user", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue({ email: "old@t" } as any)
      vi.mocked(getUserByEmail).mockResolvedValueOnce({ id: "someone-else" } as any)
      const res = await updateProfile({ email: "taken@example.com" })
      expect(res.ok).toBe(false)
      if (!res.ok) {
        expect(res.error).toBe("EMAIL_TAKEN")
        expect(res.issues?.email).toBeDefined()
      }
      expect(db.user.update).not.toHaveBeenCalled()
    })

    it("clears emailVerified when the email actually changes", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue({ email: "old@t" } as any)
      vi.mocked(getUserByEmail).mockResolvedValueOnce(null as any)
      vi.mocked(db.user.update).mockResolvedValue({ id: USER_A } as any)
      const res = await updateProfile({ email: "fresh@example.com" })
      expect(res.ok).toBe(true)
      const call = vi.mocked(db.user.update).mock.calls[0]?.[0] as any
      expect(call.data.email).toBe("fresh@example.com")
      expect(call.data.emailVerified).toBeNull()
      if (res.ok) expect(res.data.emailChanged).toBe(true)
    })

    it("normalizes empty strings for phone/image to null", async () => {
      vi.mocked(db.user.update).mockResolvedValue({ id: USER_A } as any)
      await updateProfile({ name: "Ok", phone: "", image: "" })
      const call = vi.mocked(db.user.update).mock.calls[0]?.[0] as any
      expect(call.data.phone).toBeNull()
      expect(call.data.image).toBeNull()
    })

    it("no-ops when no editable fields are provided", async () => {
      const res = await updateProfile({})
      expect(res.ok).toBe(true)
      expect(db.user.update).not.toHaveBeenCalled()
    })
  })
})
