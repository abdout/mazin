// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use server"

import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"

import { db } from "@/lib/db"

import {
  assertCanCreateNotification,
  assertCanEditOwnPreferences,
  requireAuthedUser,
} from "./authorization"
import {
  getNotificationsList,
  getPreferencesForUser,
  getRecentNotifications,
  getUnreadCount,
} from "./queries"
import type {
  NotificationDTO,
  NotificationPreferenceDTO,
  PreferenceMatrix,
} from "./types"
import type { NotificationType } from "@prisma/client"
import {
  createNotificationSchema,
  deleteNotificationSchema,
  markAllNotificationsReadSchema,
  markNotificationReadSchema,
  notificationListSchema,
  updateNotificationPreferencesSchema,
} from "./validation"

// ---------------------------------------------------------------------------
// Shared result shape
// ---------------------------------------------------------------------------
export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string; issues?: Record<string, string[]> }

function fail(error: string, issues?: Record<string, string[]>): ActionResult<never> {
  return { ok: false, error, ...(issues ? { issues } : {}) }
}

// ---------------------------------------------------------------------------
// Query actions
// ---------------------------------------------------------------------------
export async function listNotifications(
  rawInput: unknown
): Promise<ActionResult<Awaited<ReturnType<typeof getNotificationsList>>>> {
  try {
    const user = await requireAuthedUser()
    const parsed = notificationListSchema.safeParse(rawInput ?? {})
    if (!parsed.success) return fail("INVALID_INPUT", parsed.error.flatten().fieldErrors as Record<string, string[]>)
    const data = await getNotificationsList(user.id, {
      ...parsed.data,
      type: parsed.data.type as NotificationType | undefined,
    })
    return { ok: true, data }
  } catch (err) {
    return fail(err instanceof Error ? err.message : "UNKNOWN_ERROR")
  }
}

export async function getBellNotifications(
  limit = 5
): Promise<ActionResult<{ items: NotificationDTO[]; unreadCount: number }>> {
  try {
    const user = await requireAuthedUser()
    const [items, unreadCount] = await Promise.all([
      getRecentNotifications(user.id, limit),
      getUnreadCount(user.id),
    ])
    return { ok: true, data: { items, unreadCount } }
  } catch (err) {
    return fail(err instanceof Error ? err.message : "UNKNOWN_ERROR")
  }
}

export async function fetchPreferences(): Promise<ActionResult<NotificationPreferenceDTO>> {
  try {
    const user = await requireAuthedUser()
    const dto = await getPreferencesForUser(user.id, user.role)
    if (!dto) return fail("NOT_FOUND")
    return { ok: true, data: dto }
  } catch (err) {
    return fail(err instanceof Error ? err.message : "UNKNOWN_ERROR")
  }
}

// ---------------------------------------------------------------------------
// Mutations — create
// ---------------------------------------------------------------------------
export async function createNotification(
  rawInput: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    const parsed = createNotificationSchema.safeParse(rawInput)
    if (!parsed.success) return fail("INVALID_INPUT", parsed.error.flatten().fieldErrors as Record<string, string[]>)

    const paymentRelated = parsed.data.type.startsWith("PAYMENT_")
    await assertCanCreateNotification({ paymentRelated })

    const created = await db.notification.create({
      data: {
        userId: parsed.data.userId ?? null,
        clientId: parsed.data.clientId ?? null,
        type: parsed.data.type as NotificationDTO["type"],
        priority: parsed.data.priority as NotificationDTO["priority"],
        title: parsed.data.title,
        message: parsed.data.message,
        channel: parsed.data.channel as NotificationDTO["channel"],
        status: "PENDING",
        metadata: parsed.data.metadata
          ? (parsed.data.metadata as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        projectId: parsed.data.projectId ?? null,
        taskId: parsed.data.taskId ?? null,
        shipmentId: parsed.data.shipmentId ?? null,
        invoiceId: parsed.data.invoiceId ?? null,
      },
      select: { id: true },
    })

    revalidatePath("/")
    return { ok: true, data: { id: created.id } }
  } catch (err) {
    return fail(err instanceof Error ? err.message : "UNKNOWN_ERROR")
  }
}

// ---------------------------------------------------------------------------
// Mutations — mark read
// ---------------------------------------------------------------------------
export async function markNotificationAsRead(
  rawInput: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireAuthedUser()
    const parsed = markNotificationReadSchema.safeParse(rawInput)
    if (!parsed.success) return fail("INVALID_INPUT", parsed.error.flatten().fieldErrors as Record<string, string[]>)

    const target = await db.notification.findUnique({
      where: { id: parsed.data.notificationId },
      select: { id: true, userId: true },
    })
    if (!target) return fail("NOT_FOUND")
    if (target.userId !== user.id) return fail("FORBIDDEN")

    await db.notification.update({
      where: { id: target.id },
      data: { readAt: new Date(), status: "READ" },
    })
    revalidatePath("/")
    return { ok: true, data: { id: target.id } }
  } catch (err) {
    return fail(err instanceof Error ? err.message : "UNKNOWN_ERROR")
  }
}

export async function markAllNotificationsAsRead(
  rawInput?: unknown
): Promise<ActionResult<{ count: number }>> {
  try {
    const user = await requireAuthedUser()
    markAllNotificationsReadSchema.parse(rawInput ?? {})

    const result = await db.notification.updateMany({
      where: { userId: user.id, readAt: null },
      data: { readAt: new Date(), status: "READ" },
    })
    revalidatePath("/")
    return { ok: true, data: { count: result.count } }
  } catch (err) {
    return fail(err instanceof Error ? err.message : "UNKNOWN_ERROR")
  }
}

// ---------------------------------------------------------------------------
// Mutations — delete
// ---------------------------------------------------------------------------
export async function deleteNotification(
  rawInput: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireAuthedUser()
    const parsed = deleteNotificationSchema.safeParse(rawInput)
    if (!parsed.success) return fail("INVALID_INPUT", parsed.error.flatten().fieldErrors as Record<string, string[]>)

    const target = await db.notification.findUnique({
      where: { id: parsed.data.notificationId },
      select: { id: true, userId: true },
    })
    if (!target) return fail("NOT_FOUND")
    if (target.userId !== user.id) return fail("FORBIDDEN")

    await db.notification.delete({ where: { id: target.id } })
    revalidatePath("/")
    return { ok: true, data: { id: target.id } }
  } catch (err) {
    return fail(err instanceof Error ? err.message : "UNKNOWN_ERROR")
  }
}

// ---------------------------------------------------------------------------
// Mutations — preferences
// ---------------------------------------------------------------------------
export async function updateNotificationPreferences(
  rawInput: unknown
): Promise<ActionResult<NotificationPreferenceDTO>> {
  try {
    const user = await assertCanEditOwnPreferences()
    const parsed = updateNotificationPreferencesSchema.safeParse(rawInput)
    if (!parsed.success) return fail("INVALID_INPUT", parsed.error.flatten().fieldErrors as Record<string, string[]>)

    const saved = await db.notificationPreference.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        preferences: parsed.data.preferences as unknown as Prisma.InputJsonValue,
        quietHoursStart: parsed.data.quietHoursStart ?? null,
        quietHoursEnd: parsed.data.quietHoursEnd ?? null,
        whatsappNumber: parsed.data.whatsappNumber ?? null,
      },
      update: {
        preferences: parsed.data.preferences as unknown as Prisma.InputJsonValue,
        quietHoursStart: parsed.data.quietHoursStart ?? null,
        quietHoursEnd: parsed.data.quietHoursEnd ?? null,
        whatsappNumber: parsed.data.whatsappNumber ?? null,
      },
    })

    revalidatePath("/settings/notifications", "page")
    return {
      ok: true,
      data: {
        id: saved.id,
        userId: saved.userId,
        clientId: saved.clientId,
        preferences: parsed.data.preferences as PreferenceMatrix,
        whatsappNumber: saved.whatsappNumber,
        whatsappVerified: saved.whatsappVerified,
        quietHoursStart: saved.quietHoursStart,
        quietHoursEnd: saved.quietHoursEnd,
        createdAt: saved.createdAt.toISOString(),
        updatedAt: saved.updatedAt.toISOString(),
      },
    }
  } catch (err) {
    return fail(err instanceof Error ? err.message : "UNKNOWN_ERROR")
  }
}
