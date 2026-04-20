// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import * as React from "react"
import Link from "next/link"
import { Bell } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import type { Dictionary } from "@/components/internationalization/types"

import { NOTIFICATION_TYPE_CONFIG, TYPE_DICT_KEY } from "./config"
import type { NotificationDTO } from "./types"

type Locale = "ar" | "en"

interface NotificationCardProps {
  notification: NotificationDTO
  dictionary: Dictionary
  locale: Locale
  selected?: boolean
  onToggleSelect?: (id: string) => void
  onMarkRead?: (id: string) => void
  onDelete?: (id: string) => void
  compact?: boolean
}

function resolveDeepLink(
  n: NotificationDTO,
  locale: Locale
): { href: string; label: string } | null {
  if (n.taskId) return { href: `/${locale}/task/${n.taskId}`, label: "task" }
  if (n.shipmentId) return { href: `/${locale}/shipments/${n.shipmentId}`, label: "shipment" }
  if (n.invoiceId) return { href: `/${locale}/invoice/${n.invoiceId}`, label: "invoice" }
  if (n.projectId) return { href: `/${locale}/project/${n.projectId}`, label: "project" }
  return null
}

function formatRelative(iso: string, locale: Locale): string {
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diff = Math.max(0, now - then)
  const minutes = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)
  if (minutes < 1) return locale === "ar" ? "الآن" : "Just now"
  if (minutes < 60) return locale === "ar" ? `منذ ${minutes} د` : `${minutes}m`
  if (hours < 24) return locale === "ar" ? `منذ ${hours} س` : `${hours}h`
  return locale === "ar" ? `منذ ${days} ي` : `${days}d`
}

export function NotificationCard({
  notification,
  dictionary,
  locale,
  selected,
  onToggleSelect,
  onMarkRead,
  onDelete,
  compact = false,
}: NotificationCardProps) {
  const isUnread = !notification.readAt
  const typeConfig = NOTIFICATION_TYPE_CONFIG[notification.type]
  const Icon = typeConfig?.icon ?? Bell
  const deepLink = resolveDeepLink(notification, locale)
  const typeKey = TYPE_DICT_KEY[notification.type]
  const notifDict = (dictionary as unknown as { notifications?: Record<string, unknown> })
    .notifications as Record<string, Record<string, string> | string> | undefined
  const typeLabel =
    (notifDict?.types as Record<string, string> | undefined)?.[typeKey] ??
    notification.type.replace(/_/g, " ")
  const priorityClass = priorityBorder(notification.priority)

  return (
    <div
      className={cn(
        "group relative flex gap-3 rounded-md border bg-card p-3 transition-colors",
        isUnread && "bg-muted/40",
        selected && "ring-2 ring-primary/40",
        "ltr:border-l-4 rtl:border-r-4",
        priorityClass,
        compact && "p-2"
      )}
      data-unread={isUnread ? "true" : "false"}
      data-priority={notification.priority}
    >
      {onToggleSelect && !compact && (
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggleSelect(notification.id)}
          className="mt-1"
          aria-label={
            typeof notifDict?.a11y === "object"
              ? (notifDict.a11y as Record<string, string>)?.select
              : "Select"
          }
        />
      )}

      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full",
          isUnread ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
      </div>

      <div className="flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className={cn("text-sm leading-tight", isUnread && "font-medium")}>
              {notification.title}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{typeLabel}</p>
          </div>
          <time
            className="shrink-0 text-[10px] uppercase text-muted-foreground"
            dateTime={notification.createdAt}
          >
            {formatRelative(notification.createdAt, locale)}
          </time>
        </div>

        <p
          className={cn(
            "text-xs text-muted-foreground",
            compact ? "line-clamp-2" : "line-clamp-3"
          )}
        >
          {notification.message}
        </p>

        {!compact && (
          <div className="flex items-center gap-2 pt-1">
            {deepLink && (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => onMarkRead?.(notification.id)}
              >
                <Link href={deepLink.href}>
                  {(dictionary.common.view ?? "View")}
                </Link>
              </Button>
            )}
            {isUnread && onMarkRead && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => onMarkRead(notification.id)}
              >
                {typeof notifDict?.actions === "object"
                  ? (notifDict.actions as Record<string, string>)?.markRead ?? "Mark read"
                  : "Mark read"}
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                onClick={() => onDelete(notification.id)}
              >
                {dictionary.common.delete}
              </Button>
            )}
          </div>
        )}
      </div>

      {isUnread && (
        <span
          aria-hidden
          className="absolute end-3 top-3 size-2 rounded-full bg-primary"
        />
      )}
    </div>
  )
}

function priorityBorder(priority: NotificationDTO["priority"]): string {
  switch (priority) {
    case "urgent":
      return "border-destructive"
    case "high":
      return "border-amber-500"
    case "low":
      return "border-muted"
    case "normal":
    default:
      return "border-primary/50"
  }
}
