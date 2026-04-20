// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

import { NOTIFICATION_CHANNELS, NOTIFICATION_TYPES } from "./config"

// NotificationType / Channel / Priority enums tied to the Prisma generated types.
// We avoid z.nativeEnum so the schema stays tree-shakable on the client.
export const notificationTypeSchema = z.enum(
  NOTIFICATION_TYPES as [string, ...string[]]
)

export const notificationChannelSchema = z.enum(
  NOTIFICATION_CHANNELS as [string, ...string[]]
)

export const notificationPrioritySchema = z.enum(["low", "normal", "high", "urgent"])

// ---------------------------------------------------------------------------
// Create notification
// ---------------------------------------------------------------------------
export const createNotificationSchema = z
  .object({
    userId: z.string().min(1).optional(),
    clientId: z.string().min(1).optional(),
    type: notificationTypeSchema,
    priority: notificationPrioritySchema.optional().default("normal"),
    title: z.string().min(1, "Title required").max(255),
    message: z.string().min(1, "Message required").max(5000),
    metadata: z.record(z.string(), z.unknown()).optional(),
    channel: notificationChannelSchema.optional().default("IN_APP"),
    projectId: z.string().optional(),
    taskId: z.string().optional(),
    shipmentId: z.string().optional(),
    invoiceId: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    // Exactly one of userId or clientId must be provided
    const targets = [val.userId, val.clientId].filter(Boolean)
    if (targets.length !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Exactly one of userId or clientId is required",
        path: ["userId"],
      })
    }
  })

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>

// ---------------------------------------------------------------------------
// Mark read / delete
// ---------------------------------------------------------------------------
export const markNotificationReadSchema = z.object({
  notificationId: z.string().min(1),
})

export const markAllNotificationsReadSchema = z.object({})

export const deleteNotificationSchema = z.object({
  notificationId: z.string().min(1),
})

// ---------------------------------------------------------------------------
// Preferences
// ---------------------------------------------------------------------------
// Preference matrix is a Record<NotificationType, NotificationChannel[]> stored
// on NotificationPreference.preferences (JSON column). We keep that shape here.
export const preferenceMatrixSchema = z.record(
  notificationTypeSchema,
  z.array(notificationChannelSchema)
)

export const updateNotificationPreferencesSchema = z
  .object({
    preferences: preferenceMatrixSchema,
    quietHoursStart: z.number().int().min(0).max(23).nullable().optional(),
    quietHoursEnd: z.number().int().min(0).max(23).nullable().optional(),
    whatsappNumber: z.string().max(32).nullable().optional(),
  })
  .superRefine((val, ctx) => {
    if (
      val.quietHoursStart !== null &&
      val.quietHoursStart !== undefined &&
      val.quietHoursEnd !== null &&
      val.quietHoursEnd !== undefined
    ) {
      if (val.quietHoursStart === val.quietHoursEnd) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Quiet hours start and end must differ",
          path: ["quietHoursStart"],
        })
      }
    }
  })

export type UpdateNotificationPreferencesInput = z.infer<
  typeof updateNotificationPreferencesSchema
>

// ---------------------------------------------------------------------------
// List / pagination filters
// ---------------------------------------------------------------------------
export const notificationListSchema = z.object({
  limit: z.number().int().positive().max(100).default(20),
  cursor: z.string().optional(),
  filter: z.enum(["all", "unread"]).default("all"),
  type: notificationTypeSchema.optional(),
})

export type NotificationListInput = z.infer<typeof notificationListSchema>
