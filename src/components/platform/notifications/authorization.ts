// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { UserRole } from "@prisma/client"

import { currentUser } from "@/components/auth/auth"

// ---------------------------------------------------------------------------
// Mazin notification RBAC
// ---------------------------------------------------------------------------
// Mazin has four roles: ADMIN, MANAGER, CLERK, VIEWER (USER is the
// on-boarding / marketing-only role with no platform access).
//
// Rules:
//   * ADMIN, MANAGER — can originate notifications for anyone (team + clients)
//   * CLERK           — can originate task/stage notifications (not payments)
//   * VIEWER, USER    — cannot originate notifications
//   * Everyone        — can always mark their OWN notifications as read/unread
//
// Ownership is enforced in queries/actions. This module only returns boolean
// capability checks + asserts-or-throws helpers for server actions.

const PRIVILEGED_ROLES: UserRole[] = ["ADMIN", "MANAGER"]
const ALLOWED_ORIGINATOR_ROLES: UserRole[] = ["ADMIN", "MANAGER", "CLERK"]

export function canOriginateNotification(role: UserRole | null | undefined): boolean {
  if (!role) return false
  return ALLOWED_ORIGINATOR_ROLES.includes(role)
}

export function canOriginatePaymentNotification(
  role: UserRole | null | undefined
): boolean {
  if (!role) return false
  // Payment notifications touch finance data — gated to privileged roles
  return PRIVILEGED_ROLES.includes(role)
}

export function canManageAllNotifications(role: UserRole | null | undefined): boolean {
  if (!role) return false
  return PRIVILEGED_ROLES.includes(role)
}

// ---------------------------------------------------------------------------
// Server-action guards
// ---------------------------------------------------------------------------
type AuthedUser = { id: string; role: UserRole }

export async function requireAuthedUser(): Promise<AuthedUser> {
  const user = await currentUser()
  if (!user?.id) {
    throw new Error("UNAUTHENTICATED")
  }
  return { id: user.id, role: (user.role ?? "USER") as UserRole }
}

export async function assertCanCreateNotification(opts?: {
  paymentRelated?: boolean
}): Promise<AuthedUser> {
  const user = await requireAuthedUser()
  if (!canOriginateNotification(user.role)) {
    throw new Error("FORBIDDEN_NOTIFICATION_CREATE")
  }
  if (opts?.paymentRelated && !canOriginatePaymentNotification(user.role)) {
    throw new Error("FORBIDDEN_NOTIFICATION_PAYMENT")
  }
  return user
}

// Mark-as-read / delete are own-only: the action layer must assert that the
// target notification belongs to `user.id`. This helper is the cheap check.
export async function assertCanMarkOwn(notificationUserId: string | null): Promise<AuthedUser> {
  const user = await requireAuthedUser()
  if (notificationUserId !== user.id && !canManageAllNotifications(user.role)) {
    throw new Error("FORBIDDEN_NOTIFICATION_MARK")
  }
  return user
}

// Preference writes are always own-only.
export async function assertCanEditOwnPreferences(): Promise<AuthedUser> {
  return requireAuthedUser()
}
