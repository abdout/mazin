import { describe, it, expect, vi, beforeEach } from "vitest"

const currentUserMock = vi.hoisted(() => vi.fn())
vi.mock("@/components/auth/auth", () => ({ currentUser: currentUserMock }))

import {
  canOriginateNotification,
  canOriginatePaymentNotification,
  canManageAllNotifications,
  requireAuthedUser,
  assertCanCreateNotification,
  assertCanMarkOwn,
  assertCanEditOwnPreferences,
} from "@/components/platform/notifications/authorization"

describe("notifications/authorization", () => {
  beforeEach(() => {
    currentUserMock.mockReset()
  })

  describe("canOriginateNotification", () => {
    it("allows ADMIN/MANAGER/CLERK", () => {
      expect(canOriginateNotification("ADMIN" as any)).toBe(true)
      expect(canOriginateNotification("MANAGER" as any)).toBe(true)
      expect(canOriginateNotification("CLERK" as any)).toBe(true)
    })

    it("denies VIEWER/USER/null", () => {
      expect(canOriginateNotification("VIEWER" as any)).toBe(false)
      expect(canOriginateNotification("USER" as any)).toBe(false)
      expect(canOriginateNotification(null)).toBe(false)
      expect(canOriginateNotification(undefined)).toBe(false)
    })
  })

  describe("canOriginatePaymentNotification", () => {
    it("only ADMIN/MANAGER", () => {
      expect(canOriginatePaymentNotification("ADMIN" as any)).toBe(true)
      expect(canOriginatePaymentNotification("MANAGER" as any)).toBe(true)
      expect(canOriginatePaymentNotification("CLERK" as any)).toBe(false)
      expect(canOriginatePaymentNotification("VIEWER" as any)).toBe(false)
    })
  })

  describe("canManageAllNotifications", () => {
    it("only ADMIN/MANAGER", () => {
      expect(canManageAllNotifications("ADMIN" as any)).toBe(true)
      expect(canManageAllNotifications("MANAGER" as any)).toBe(true)
      expect(canManageAllNotifications("CLERK" as any)).toBe(false)
      expect(canManageAllNotifications(null)).toBe(false)
    })
  })

  describe("requireAuthedUser", () => {
    it("throws UNAUTHENTICATED when no user", async () => {
      currentUserMock.mockResolvedValue(null)
      await expect(requireAuthedUser()).rejects.toThrow("UNAUTHENTICATED")
    })

    it("throws UNAUTHENTICATED when user has no id", async () => {
      currentUserMock.mockResolvedValue({})
      await expect(requireAuthedUser()).rejects.toThrow("UNAUTHENTICATED")
    })

    it("defaults role to USER when missing", async () => {
      currentUserMock.mockResolvedValue({ id: "u1" })
      const user = await requireAuthedUser()
      expect(user).toEqual({ id: "u1", role: "USER" })
    })

    it("returns role when present", async () => {
      currentUserMock.mockResolvedValue({ id: "u1", role: "ADMIN" })
      expect((await requireAuthedUser()).role).toBe("ADMIN")
    })
  })

  describe("assertCanCreateNotification", () => {
    it("rejects USER role", async () => {
      currentUserMock.mockResolvedValue({ id: "u1", role: "USER" })
      await expect(assertCanCreateNotification()).rejects.toThrow(
        "FORBIDDEN_NOTIFICATION_CREATE"
      )
    })

    it("rejects CLERK for payment-related", async () => {
      currentUserMock.mockResolvedValue({ id: "u1", role: "CLERK" })
      await expect(
        assertCanCreateNotification({ paymentRelated: true })
      ).rejects.toThrow("FORBIDDEN_NOTIFICATION_PAYMENT")
    })

    it("allows ADMIN for payment-related", async () => {
      currentUserMock.mockResolvedValue({ id: "u1", role: "ADMIN" })
      const user = await assertCanCreateNotification({ paymentRelated: true })
      expect(user.role).toBe("ADMIN")
    })

    it("allows CLERK for non-payment notification", async () => {
      currentUserMock.mockResolvedValue({ id: "u1", role: "CLERK" })
      const user = await assertCanCreateNotification()
      expect(user.role).toBe("CLERK")
    })
  })

  describe("assertCanMarkOwn", () => {
    it("allows user to mark their own", async () => {
      currentUserMock.mockResolvedValue({ id: "u1", role: "USER" })
      await expect(assertCanMarkOwn("u1")).resolves.toMatchObject({ id: "u1" })
    })

    it("rejects user marking someone else's (non-privileged)", async () => {
      currentUserMock.mockResolvedValue({ id: "u1", role: "USER" })
      await expect(assertCanMarkOwn("u2")).rejects.toThrow("FORBIDDEN_NOTIFICATION_MARK")
    })

    it("allows ADMIN to mark others", async () => {
      currentUserMock.mockResolvedValue({ id: "admin", role: "ADMIN" })
      await expect(assertCanMarkOwn("u2")).resolves.toMatchObject({ role: "ADMIN" })
    })
  })

  describe("assertCanEditOwnPreferences", () => {
    it("only requires auth", async () => {
      currentUserMock.mockResolvedValue({ id: "u1", role: "VIEWER" })
      await expect(assertCanEditOwnPreferences()).resolves.toMatchObject({
        id: "u1",
        role: "VIEWER",
      })
    })
  })
})
