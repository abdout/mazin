import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  unstable_cache: (fn: any) => fn,
}))
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({
    get: (key: string) => (key === "x-forwarded-for" ? "203.0.113.42" : null),
  })),
}))

import { auth } from "@/auth"
import { db } from "@/lib/db"
import {
  recordContactView,
  updateServiceListing,
} from "../actions"
import { makeSession } from "@/__tests__/helpers/factories"
import { __resetRateLimits } from "@/lib/rate-limit"

const USER_A = "user-a"
const USER_B = "user-b"
const REQ_ID = "cm7abcdefghijklmnopqrstuv" // valid cuid shape
const LISTING_ID = "cm7listing0000000000000aa"

describe("marketplace actions — security fixes", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    __resetRateLimits()
    vi.mocked(auth).mockResolvedValue(
      makeSession({ user: { id: USER_A, role: "ADMIN", name: "A", email: "a@t" } }) as any
    )
  })

  describe("recordContactView", () => {
    it("rejects unauthenticated callers (previously unprotected)", async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as any)
      const result = await recordContactView({
        requestId: REQ_ID,
        contactMethod: "whatsapp",
      })
      expect(result.success).toBe(false)
      expect(result.error).toBe("Not authenticated")
      expect(db.serviceRequest.update).not.toHaveBeenCalled()
    })

    it("rejects when caller is neither the requester nor the vendor owner", async () => {
      vi.mocked(db.serviceRequest.findFirst).mockResolvedValue(null as any)
      const result = await recordContactView({
        requestId: REQ_ID,
        contactMethod: "phone",
      })
      expect(result.success).toBe(false)
      expect(result.error).toBe("Request not found")
      expect(db.serviceRequest.update).not.toHaveBeenCalled()
    })

    it("passes through when the caller matches requesterId or vendor.userId", async () => {
      vi.mocked(db.serviceRequest.findFirst).mockResolvedValue({
        id: REQ_ID,
        requesterId: USER_A,
      } as any)
      vi.mocked(db.serviceRequest.update).mockResolvedValue({
        id: REQ_ID,
        status: "CONTACTED",
      } as any)
      const result = await recordContactView({
        requestId: REQ_ID,
        contactMethod: "email",
      })
      expect(result.success).toBe(true)
      const findCall = vi.mocked(db.serviceRequest.findFirst).mock.calls[0]![0] as any
      // The OR clause is the important part — either requesterId or vendor.userId.
      expect(findCall.where.OR).toEqual(
        expect.arrayContaining([
          { requesterId: USER_A },
          { vendor: { userId: USER_A } },
        ])
      )
    })
  })

  describe("updateServiceListing", () => {
    it("strips attempted vendorId rebind (not in the update schema)", async () => {
      vi.mocked(db.serviceListing.findUnique).mockResolvedValue({
        id: LISTING_ID,
        vendor: { userId: USER_A },
      } as any)
      vi.mocked(db.serviceListing.update).mockResolvedValue({
        id: LISTING_ID,
      } as any)

      // Include a valid field (title) plus a forbidden one (vendorId).
      await updateServiceListing(LISTING_ID, {
        title: "Updated Title",
        // @ts-expect-error — vendorId is not a valid update key, included here to
        // verify the partial schema rejects it
        vendorId: USER_B,
      })
      const updateCall = vi.mocked(db.serviceListing.update).mock.calls[0]?.[0] as any
      expect(updateCall.data).not.toHaveProperty("vendorId")
      expect(updateCall.data.title).toBe("Updated Title")
    })

    it("refuses to update a listing whose vendor isn't owned by the caller (non-admin)", async () => {
      vi.mocked(auth).mockResolvedValueOnce(
        makeSession({ user: { id: USER_B, role: "CLERK", name: "B", email: "b@t" } }) as any
      )
      vi.mocked(db.serviceListing.findUnique).mockResolvedValue({
        id: LISTING_ID,
        vendor: { userId: USER_A },
      } as any)
      const result = await updateServiceListing(LISTING_ID, { title: "Hijack" })
      expect(result.success).toBe(false)
      expect(result.error).toBe("Not authorized to update this listing")
      expect(db.serviceListing.update).not.toHaveBeenCalled()
    })

    it("rejects invalid data (zod parse fails)", async () => {
      // `title` has min(3) — two chars fails validation before any DB work.
      const result = await updateServiceListing(LISTING_ID, { title: "a" })
      expect(result.success).toBe(false)
      expect(result.error).toBe("Invalid listing data")
      expect(db.serviceListing.findUnique).not.toHaveBeenCalled()
    })
  })
})
