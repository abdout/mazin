// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { LucideIcon } from "lucide-react"
import type {
  NotificationChannel,
  NotificationPriority,
  NotificationType,
} from "@prisma/client"

import type { PreferenceMatrix } from "./types"
import {
  AlertTriangle,
  Anchor,
  Bell,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  Clock,
  CreditCard,
  FileText,
  Hourglass,
  Mail,
  MessageSquare,
  Package,
  PackageCheck,
  PackageX,
  Ship,
  Smartphone,
  Truck,
  Users,
} from "lucide-react"

// Notification type → icon + default flag whether the type demands user action.
// Icons use semantic tokens; color styling happens at render time.
export const NOTIFICATION_TYPE_CONFIG: Record<
  NotificationType,
  { icon: LucideIcon; requiresAction: boolean }
> = {
  // Task notifications
  TASK_ASSIGNED: { icon: ClipboardList, requiresAction: true },
  TASK_DUE_SOON: { icon: Clock, requiresAction: true },
  TASK_OVERDUE: { icon: AlertTriangle, requiresAction: true },
  TASK_COMPLETED: { icon: CheckCircle2, requiresAction: false },

  // Stage notifications
  STAGE_ATTENTION_NEEDED: { icon: CircleAlert, requiresAction: true },
  STAGE_COMPLETED: { icon: CheckCircle2, requiresAction: false },

  // Shipment milestones
  SHIPMENT_CREATED: { icon: Package, requiresAction: false },
  SHIPMENT_ARRIVAL: { icon: Anchor, requiresAction: false },
  SHIPMENT_CLEARED: { icon: PackageCheck, requiresAction: false },
  SHIPMENT_RELEASED: { icon: Ship, requiresAction: false },
  SHIPMENT_DELIVERED: { icon: Truck, requiresAction: false },

  // Payment notifications
  PAYMENT_REQUEST: { icon: CreditCard, requiresAction: true },
  PAYMENT_RECEIVED: { icon: CheckCircle2, requiresAction: false },
  PAYMENT_OVERDUE: { icon: Hourglass, requiresAction: true },

  // System
  SYSTEM_ALERT: { icon: Bell, requiresAction: true },
}

export const PRIORITY_CONFIG: Record<
  NotificationPriority,
  { badgeVariant: "default" | "secondary" | "destructive" | "outline" }
> = {
  low: { badgeVariant: "secondary" },
  normal: { badgeVariant: "default" },
  high: { badgeVariant: "outline" },
  urgent: { badgeVariant: "destructive" },
}

export const CHANNEL_ICONS: Record<NotificationChannel, LucideIcon> = {
  IN_APP: Bell,
  EMAIL: Mail,
  WHATSAPP: MessageSquare,
  SMS: Smartphone,
}

// Channels that are actually wired up. Anything not `enabled` renders but is
// greyed out in the preference matrix.
export const CHANNEL_CONFIG: Record<NotificationChannel, { enabled: boolean }> = {
  IN_APP: { enabled: true },
  EMAIL: { enabled: true },
  WHATSAPP: { enabled: true },
  SMS: { enabled: false },
}

// Enum list order — used to render type rows in the preferences matrix and to
// iterate filter buttons. Keep this stable across releases.
export const NOTIFICATION_TYPES: NotificationType[] = [
  "TASK_ASSIGNED",
  "TASK_DUE_SOON",
  "TASK_OVERDUE",
  "TASK_COMPLETED",
  "STAGE_ATTENTION_NEEDED",
  "STAGE_COMPLETED",
  "SHIPMENT_CREATED",
  "SHIPMENT_ARRIVAL",
  "SHIPMENT_CLEARED",
  "SHIPMENT_RELEASED",
  "SHIPMENT_DELIVERED",
  "PAYMENT_REQUEST",
  "PAYMENT_RECEIVED",
  "PAYMENT_OVERDUE",
  "SYSTEM_ALERT",
]

export const NOTIFICATION_CHANNELS: NotificationChannel[] = [
  "IN_APP",
  "EMAIL",
  "WHATSAPP",
  "SMS",
]

// Pagination and bell limits
export const NOTIFICATIONS_PER_PAGE = 20
export const NOTIFICATION_BELL_MAX_DISPLAY = 5

// Default quiet hours window (10 PM → 8 AM)
export const DEFAULT_QUIET_HOURS = { start: 22, end: 8 }

// Default channel preferences per role. Mazin roles: ADMIN, MANAGER, CLERK,
// VIEWER (client recipients are handled separately — see DEFAULT_CLIENT_MATRIX).
function allChannels(): NotificationChannel[] {
  return ["IN_APP", "EMAIL"]
}

function clerkChannels(): NotificationChannel[] {
  return ["IN_APP"]
}

export const DEFAULT_PREFERENCES: Record<string, PreferenceMatrix> = {
  ADMIN: buildMatrix(allChannels()),
  MANAGER: buildMatrix(allChannels()),
  CLERK: buildMatrix(clerkChannels()),
  VIEWER: buildMatrix(["IN_APP"]),
  USER: buildMatrix(clerkChannels()),
}

export const DEFAULT_CLIENT_MATRIX: PreferenceMatrix = {
  SHIPMENT_CREATED: ["IN_APP", "WHATSAPP"],
  SHIPMENT_ARRIVAL: ["IN_APP", "WHATSAPP"],
  SHIPMENT_CLEARED: ["IN_APP", "WHATSAPP"],
  SHIPMENT_RELEASED: ["IN_APP", "WHATSAPP"],
  SHIPMENT_DELIVERED: ["IN_APP", "WHATSAPP"],
  PAYMENT_REQUEST: ["IN_APP", "WHATSAPP", "EMAIL"],
  PAYMENT_RECEIVED: ["IN_APP", "WHATSAPP"],
  PAYMENT_OVERDUE: ["IN_APP", "WHATSAPP", "EMAIL"],
  SYSTEM_ALERT: ["IN_APP"],
}

function buildMatrix(channels: NotificationChannel[]): PreferenceMatrix {
  const result: PreferenceMatrix = {}
  for (const type of NOTIFICATION_TYPES) {
    result[type] = channels
  }
  return result
}

// Map NotificationType to dictionary key under `notifications.types.*`
export const TYPE_DICT_KEY: Record<NotificationType, string> = {
  TASK_ASSIGNED: "TASK_ASSIGNED",
  TASK_DUE_SOON: "TASK_DUE_SOON",
  TASK_OVERDUE: "TASK_OVERDUE",
  TASK_COMPLETED: "TASK_COMPLETED",
  STAGE_ATTENTION_NEEDED: "STAGE_ATTENTION_NEEDED",
  STAGE_COMPLETED: "STAGE_COMPLETED",
  SHIPMENT_CREATED: "SHIPMENT_CREATED",
  SHIPMENT_ARRIVAL: "SHIPMENT_ARRIVAL",
  SHIPMENT_CLEARED: "SHIPMENT_CLEARED",
  SHIPMENT_RELEASED: "SHIPMENT_RELEASED",
  SHIPMENT_DELIVERED: "SHIPMENT_DELIVERED",
  PAYMENT_REQUEST: "PAYMENT_REQUEST",
  PAYMENT_RECEIVED: "PAYMENT_RECEIVED",
  PAYMENT_OVERDUE: "PAYMENT_OVERDUE",
  SYSTEM_ALERT: "SYSTEM_ALERT",
}

// Used only for imports that want an iterable of distinct icons
export const DEFAULT_ICON = Bell
export const USERS_ICON = Users
export const FILE_ICON = FileText
export const PACKAGE_X_ICON = PackageX
