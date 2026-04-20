// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Prisma } from "@prisma/client"

import { db } from "@/lib/db"

import type {
  NotificationDTO,
  NotificationPreferenceDTO,
  PreferenceMatrix,
} from "./types"
import {
  DEFAULT_CLIENT_MATRIX,
  DEFAULT_PREFERENCES,
  NOTIFICATION_TYPES,
} from "./config"

// ---------------------------------------------------------------------------
// Serializers — Prisma row → transport-safe DTO
// ---------------------------------------------------------------------------
export function toNotificationDTO(row: {
  id: string
  userId: string | null
  clientId: string | null
  type: NotificationDTO["type"]
  priority: NotificationDTO["priority"]
  title: string
  message: string
  metadata: Prisma.JsonValue | null
  channel: NotificationDTO["channel"]
  status: NotificationDTO["status"]
  readAt: Date | null
  sentAt: Date | null
  error: string | null
  projectId: string | null
  taskId: string | null
  shipmentId: string | null
  invoiceId: string | null
  createdAt: Date
  updatedAt: Date
}): NotificationDTO {
  return {
    id: row.id,
    userId: row.userId,
    clientId: row.clientId,
    type: row.type,
    priority: row.priority,
    title: row.title,
    message: row.message,
    metadata:
      row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : null,
    channel: row.channel,
    status: row.status,
    readAt: row.readAt?.toISOString() ?? null,
    sentAt: row.sentAt?.toISOString() ?? null,
    error: row.error,
    projectId: row.projectId,
    taskId: row.taskId,
    shipmentId: row.shipmentId,
    invoiceId: row.invoiceId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

// ---------------------------------------------------------------------------
// List / pagination
// ---------------------------------------------------------------------------
export type NotificationListResult = {
  items: NotificationDTO[]
  nextCursor: string | null
  unreadCount: number
}

export async function getNotificationsList(
  userId: string,
  opts: {
    limit?: number
    cursor?: string
    filter?: "all" | "unread"
    type?: NotificationDTO["type"]
  } = {}
): Promise<NotificationListResult> {
  const limit = Math.min(opts.limit ?? 20, 100)
  const where: Prisma.NotificationWhereInput = {
    userId,
    status: { not: "FAILED" },
    ...(opts.filter === "unread" ? { readAt: null } : {}),
    ...(opts.type ? { type: opts.type } : {}),
  }

  const [rows, unreadCount] = await Promise.all([
    db.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(opts.cursor
        ? { skip: 1, cursor: { id: opts.cursor } }
        : {}),
    }),
    db.notification.count({
      where: { userId, readAt: null, status: { not: "FAILED" } },
    }),
  ])

  const hasMore = rows.length > limit
  const items = (hasMore ? rows.slice(0, limit) : rows).map(toNotificationDTO)
  const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]!.id : null

  return { items, nextCursor, unreadCount }
}

export async function getUnreadCount(userId: string): Promise<number> {
  return db.notification.count({
    where: { userId, readAt: null, status: { not: "FAILED" } },
  })
}

export async function getRecentNotifications(
  userId: string,
  take = 5
): Promise<NotificationDTO[]> {
  const rows = await db.notification.findMany({
    where: { userId, status: { not: "FAILED" } },
    orderBy: { createdAt: "desc" },
    take,
  })
  return rows.map(toNotificationDTO)
}

// ---------------------------------------------------------------------------
// Preferences
// ---------------------------------------------------------------------------
function toPreferenceDTO(row: {
  id: string
  userId: string | null
  clientId: string | null
  preferences: Prisma.JsonValue
  whatsappNumber: string | null
  whatsappVerified: boolean
  quietHoursStart: number | null
  quietHoursEnd: number | null
  createdAt: Date
  updatedAt: Date
}): NotificationPreferenceDTO {
  const matrix: PreferenceMatrix = {}
  if (row.preferences && typeof row.preferences === "object" && !Array.isArray(row.preferences)) {
    for (const key of Object.keys(row.preferences)) {
      const value = (row.preferences as Record<string, unknown>)[key]
      if (Array.isArray(value)) {
        matrix[key as keyof PreferenceMatrix] = value.filter(
          (v): v is NotificationDTO["channel"] => typeof v === "string"
        ) as PreferenceMatrix[keyof PreferenceMatrix]
      }
    }
  }
  return {
    id: row.id,
    userId: row.userId,
    clientId: row.clientId,
    preferences: matrix,
    whatsappNumber: row.whatsappNumber,
    whatsappVerified: row.whatsappVerified,
    quietHoursStart: row.quietHoursStart,
    quietHoursEnd: row.quietHoursEnd,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export async function getPreferencesForUser(
  userId: string,
  role: string = "USER"
): Promise<NotificationPreferenceDTO | null> {
  const row = await db.notificationPreference.findUnique({ where: { userId } })
  if (!row) {
    // Return a synthetic DTO using role-based defaults so the form renders.
    const fallback = DEFAULT_PREFERENCES[role] ?? DEFAULT_PREFERENCES["USER"]!
    return {
      id: "",
      userId,
      clientId: null,
      preferences: fallback,
      whatsappNumber: null,
      whatsappVerified: false,
      quietHoursStart: null,
      quietHoursEnd: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }
  return toPreferenceDTO(row)
}

export async function getPreferencesForClient(
  clientId: string
): Promise<NotificationPreferenceDTO | null> {
  const row = await db.notificationPreference.findUnique({ where: { clientId } })
  if (!row) {
    return {
      id: "",
      userId: null,
      clientId,
      preferences: DEFAULT_CLIENT_MATRIX,
      whatsappNumber: null,
      whatsappVerified: false,
      quietHoursStart: null,
      quietHoursEnd: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }
  return toPreferenceDTO(row)
}

// Returns a merged preference matrix where any missing type falls back to the
// role default. The dispatcher uses this to decide whether a notification
// should be created for a given channel.
export function mergeWithRoleDefaults(
  matrix: PreferenceMatrix,
  role: string = "USER"
): PreferenceMatrix {
  const defaults = DEFAULT_PREFERENCES[role] ?? DEFAULT_PREFERENCES["USER"]!
  const out: PreferenceMatrix = {}
  for (const type of NOTIFICATION_TYPES) {
    out[type] = matrix[type] ?? defaults[type] ?? ["IN_APP"]
  }
  return out
}

export function mergeWithClientDefaults(matrix: PreferenceMatrix): PreferenceMatrix {
  const out: PreferenceMatrix = {}
  for (const type of NOTIFICATION_TYPES) {
    out[type] = matrix[type] ?? DEFAULT_CLIENT_MATRIX[type] ?? ["IN_APP"]
  }
  return out
}
