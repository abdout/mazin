// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type {
  Notification,
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
  NotificationType,
} from "@prisma/client"

// DTO returned to the client. Dates are serialized to ISO strings so they are
// transport-safe from server components to client components.
export type NotificationDTO = {
  id: string
  userId: string | null
  clientId: string | null
  type: NotificationType
  priority: NotificationPriority
  title: string
  message: string
  metadata: Record<string, unknown> | null
  channel: NotificationChannel
  status: NotificationStatus
  readAt: string | null
  sentAt: string | null
  error: string | null
  projectId: string | null
  taskId: string | null
  shipmentId: string | null
  invoiceId: string | null
  createdAt: string
  updatedAt: string
}

// Channel × Type preference matrix (Mazin stores this as JSON on
// NotificationPreference.preferences).
export type PreferenceMatrix = Partial<Record<NotificationType, NotificationChannel[]>>

export type NotificationPreferenceDTO = {
  id: string
  userId: string | null
  clientId: string | null
  preferences: PreferenceMatrix
  whatsappNumber: string | null
  whatsappVerified: boolean
  quietHoursStart: number | null
  quietHoursEnd: number | null
  createdAt: string
  updatedAt: string
}

// Convenience: raw Prisma row with relations (server-only).
export type NotificationWithRelations = Notification & {
  user?: { id: string; name: string | null; email: string } | null
  client?: { id: string; name: string } | null
}

export type DispatchResult = { createdIds: string[]; skipped: number }
