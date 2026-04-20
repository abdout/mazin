// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Session-less notification dispatcher.
 *
 * Background jobs / cron / webhooks call this helper to emit a notification
 * to either a user or a client. It honours `NotificationPreference` (the
 * channel matrix + quiet hours) and creates one Notification row per
 * resolved channel.
 *
 * For non-IN_APP channels it delegates to the existing service at
 * `@/lib/services/notification` so dispatch stays a single choke-point.
 */

import { Prisma } from "@prisma/client"
import type {
  NotificationChannel,
  NotificationPriority,
  NotificationType,
} from "@prisma/client"

import { db } from "@/lib/db"

import {
  DEFAULT_CLIENT_MATRIX,
  DEFAULT_PREFERENCES,
  NOTIFICATION_TYPES,
} from "@/components/platform/notifications/config"
import type {
  DispatchResult,
  PreferenceMatrix,
} from "@/components/platform/notifications/types"

export interface DispatchNotificationInput {
  userId?: string
  clientId?: string
  type: NotificationType
  title: string
  body: string
  priority?: NotificationPriority
  channels?: NotificationChannel[]
  metadata?: Record<string, unknown>
  projectId?: string
  taskId?: string
  shipmentId?: string
  invoiceId?: string
  /**
   * When true, ignore the recipient's quiet hours. Use for time-critical
   * SYSTEM_ALERT / PAYMENT_OVERDUE events.
   */
  overrideQuietHours?: boolean
}

export async function dispatchNotification(
  input: DispatchNotificationInput
): Promise<DispatchResult> {
  if (!input.userId && !input.clientId) {
    throw new Error("dispatchNotification: one of userId or clientId required")
  }
  if (input.userId && input.clientId) {
    throw new Error("dispatchNotification: cannot target both userId and clientId")
  }

  // Resolve recipient role + preferences -----------------------------------
  const pref = await resolvePreferences({
    userId: input.userId,
    clientId: input.clientId,
  })

  if (!input.overrideQuietHours && isInsideQuietHours(pref)) {
    return { createdIds: [], skipped: 1 }
  }

  // Figure out which channels to fire --------------------------------------
  const matrix = pref.matrix
  const requested = input.channels ?? matrix[input.type] ?? ["IN_APP"]
  const channels = dedupe(requested).filter((c) => channelAllowed(c, matrix, input.type))

  if (channels.length === 0) {
    return { createdIds: [], skipped: 1 }
  }

  // Group all rows under a shared dispatchId for correlation ---------------
  const dispatchId = randomDispatchId()
  const metadata = {
    ...(input.metadata ?? {}),
    dispatchId,
  }

  const createdIds: string[] = []
  for (const channel of channels) {
    const row = await db.notification.create({
      data: {
        userId: input.userId ?? null,
        clientId: input.clientId ?? null,
        type: input.type,
        priority: input.priority ?? "normal",
        title: input.title,
        message: input.body,
        channel,
        status: channel === "IN_APP" ? "SENT" : "PENDING",
        sentAt: channel === "IN_APP" ? new Date() : null,
        metadata: metadata as Prisma.InputJsonValue,
        projectId: input.projectId ?? null,
        taskId: input.taskId ?? null,
        shipmentId: input.shipmentId ?? null,
        invoiceId: input.invoiceId ?? null,
      },
      select: { id: true },
    })
    createdIds.push(row.id)

    if (channel !== "IN_APP") {
      // Fire-and-forget out-of-app delivery — delegate to existing service.
      void deliverExternal({ channel, notificationId: row.id, input })
    }
  }

  return { createdIds, skipped: 0 }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
type ResolvedPreference = {
  matrix: PreferenceMatrix
  quietHoursStart: number | null
  quietHoursEnd: number | null
  whatsappNumber: string | null
}

async function resolvePreferences(target: {
  userId?: string
  clientId?: string
}): Promise<ResolvedPreference> {
  if (target.userId) {
    const [user, row] = await Promise.all([
      db.user.findUnique({ where: { id: target.userId }, select: { role: true } }),
      db.notificationPreference.findUnique({ where: { userId: target.userId } }),
    ])
    const role = user?.role ?? "USER"
    const base = DEFAULT_PREFERENCES[role] ?? DEFAULT_PREFERENCES["USER"]!
    const stored = normalizeMatrix(row?.preferences)
    return {
      matrix: mergeMatrix(stored, base),
      quietHoursStart: row?.quietHoursStart ?? null,
      quietHoursEnd: row?.quietHoursEnd ?? null,
      whatsappNumber: row?.whatsappNumber ?? null,
    }
  }

  // Client branch
  const row = await db.notificationPreference.findUnique({
    where: { clientId: target.clientId! },
  })
  const stored = normalizeMatrix(row?.preferences)
  return {
    matrix: mergeMatrix(stored, DEFAULT_CLIENT_MATRIX),
    quietHoursStart: row?.quietHoursStart ?? null,
    quietHoursEnd: row?.quietHoursEnd ?? null,
    whatsappNumber: row?.whatsappNumber ?? null,
  }
}

function normalizeMatrix(raw: Prisma.JsonValue | undefined): PreferenceMatrix {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {}
  const out: PreferenceMatrix = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!NOTIFICATION_TYPES.includes(key as NotificationType)) continue
    if (!Array.isArray(value)) continue
    out[key as NotificationType] = value.filter(
      (v): v is NotificationChannel => typeof v === "string"
    ) as NotificationChannel[]
  }
  return out
}

function mergeMatrix(a: PreferenceMatrix, b: PreferenceMatrix): PreferenceMatrix {
  const out: PreferenceMatrix = {}
  for (const type of NOTIFICATION_TYPES) {
    out[type] = a[type] ?? b[type] ?? ["IN_APP"]
  }
  return out
}

function channelAllowed(
  channel: NotificationChannel,
  matrix: PreferenceMatrix,
  type: NotificationType
): boolean {
  const allowed = matrix[type]
  if (!allowed) return channel === "IN_APP"
  return allowed.includes(channel)
}

function dedupe<T>(list: T[]): T[] {
  return Array.from(new Set(list))
}

function isInsideQuietHours(pref: ResolvedPreference): boolean {
  if (pref.quietHoursStart === null || pref.quietHoursEnd === null) return false
  const now = new Date().getHours()
  const start = pref.quietHoursStart
  const end = pref.quietHoursEnd
  // Window may wrap past midnight.
  if (start === end) return false
  if (start < end) return now >= start && now < end
  return now >= start || now < end
}

function randomDispatchId(): string {
  return `dsp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
}

async function deliverExternal(ctx: {
  channel: NotificationChannel
  notificationId: string
  input: DispatchNotificationInput
}): Promise<void> {
  try {
    // Minimal wire-up — the rich per-template logic lives in the existing
    // `@/lib/services/notification` service, which already handles WhatsApp
    // templates, phone resolution and email fall-back.
    const { createNotification } = await import("@/lib/services/notification")
    const { channel, input } = ctx
    await createNotification({
      type: input.type,
      title: input.title,
      message: input.body,
      channels: [channel],
      userId: input.userId,
      clientId: input.clientId,
      projectId: input.projectId,
      taskId: input.taskId,
      shipmentId: input.shipmentId,
      invoiceId: input.invoiceId,
      metadata: input.metadata,
    })
    await db.notification.update({
      where: { id: ctx.notificationId },
      data: { status: "SENT", sentAt: new Date() },
    })
  } catch (err) {
    await db.notification.update({
      where: { id: ctx.notificationId },
      data: {
        status: "FAILED",
        error: err instanceof Error ? err.message : String(err),
      },
    })
  }
}
