// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import * as React from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import { Bell, BellRing } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { Dictionary } from "@/components/internationalization/types"

import {
  getBellNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "./actions"
import { NotificationCard } from "./card"
import type { NotificationDTO } from "./types"
import { NOTIFICATION_BELL_MAX_DISPLAY } from "./config"

type Locale = "ar" | "en"

interface BellIconProps {
  dictionary: Dictionary
  locale: Locale
  pollIntervalMs?: number
  initialItems?: NotificationDTO[]
  initialUnread?: number
}

export function NotificationBellIcon({
  dictionary,
  locale,
  pollIntervalMs = 60_000,
  initialItems,
  initialUnread,
}: BellIconProps) {
  const [open, setOpen] = React.useState(false)
  const [items, setItems] = React.useState<NotificationDTO[]>(initialItems ?? [])
  const [unreadCount, setUnreadCount] = React.useState<number>(initialUnread ?? 0)
  const [isLoading, setIsLoading] = React.useState(!initialItems)

  const dict = (dictionary as unknown as { notifications?: Record<string, unknown> })
    .notifications as Record<string, unknown> | undefined
  const ariaLabel =
    (dict?.a11y as Record<string, string> | undefined)?.bell ??
    dictionary.navigation.notifications ??
    "Notifications"

  const refresh = React.useCallback(async () => {
    const result = await getBellNotifications(NOTIFICATION_BELL_MAX_DISPLAY)
    if (result.ok) {
      setItems(result.data.items)
      setUnreadCount(result.data.unreadCount)
    }
    setIsLoading(false)
  }, [])

  React.useEffect(() => {
    if (!initialItems) void refresh()
  }, [initialItems, refresh])

  React.useEffect(() => {
    if (!pollIntervalMs) return
    const id = window.setInterval(() => {
      void refresh()
    }, pollIntervalMs)
    return () => window.clearInterval(id)
  }, [pollIntervalMs, refresh])

  const handleMarkRead = React.useCallback(
    async (id: string) => {
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
      )
      setUnreadCount((c) => Math.max(0, c - 1))
      const res = await markNotificationAsRead({ notificationId: id })
      if (!res.ok) await refresh()
    },
    [refresh]
  )

  const handleMarkAllRead = React.useCallback(async () => {
    setItems((prev) =>
      prev.map((n) =>
        n.readAt ? n : { ...n, readAt: new Date().toISOString() }
      )
    )
    setUnreadCount(0)
    const res = await markAllNotificationsAsRead({})
    if (!res.ok) await refresh()
  }, [refresh])

  const hasUnread = unreadCount > 0

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-7"
          aria-label={ariaLabel}
          aria-haspopup="dialog"
        >
          <motion.span
            key={hasUnread ? "ring" : "idle"}
            initial={{ rotate: 0 }}
            animate={hasUnread ? { rotate: [0, -12, 10, -8, 0] } : { rotate: 0 }}
            transition={{ duration: 0.6, repeat: hasUnread ? 1 : 0 }}
            className="flex"
          >
            {hasUnread ? (
              <BellRing className="size-5" aria-hidden />
            ) : (
              <Bell className="size-5" aria-hidden />
            )}
          </motion.span>
          <AnimatePresence>
            {hasUnread && (
              <motion.span
                key="badge"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 22 }}
                className={cn(
                  "pointer-events-none absolute -top-0.5",
                  "ltr:-right-0.5 rtl:-left-0.5",
                  "flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground"
                )}
                aria-hidden
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
          <span className="sr-only">{ariaLabel}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align={locale === "ar" ? "start" : "end"}
        side="bottom"
        className="w-80 p-0"
      >
        <div className="flex items-center justify-between border-b px-3 py-2">
          <p className="text-sm font-medium">
            {dictionary.navigation.notifications}
          </p>
          {hasUnread && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => void handleMarkAllRead()}
            >
              {(dict?.actions as Record<string, string> | undefined)?.markAllRead ??
                "Mark all read"}
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          <div className="flex flex-col gap-2 p-2">
            {isLoading ? (
              <p className="px-1 py-6 text-center text-xs text-muted-foreground">
                {dictionary.common.loading}
              </p>
            ) : items.length === 0 ? (
              <p className="px-1 py-6 text-center text-xs text-muted-foreground">
                {(dict?.empty as Record<string, string> | undefined)?.title ??
                  (locale === "ar" ? "لا توجد إشعارات" : "No notifications")}
              </p>
            ) : (
              items.map((n) => (
                <NotificationCard
                  key={n.id}
                  notification={n}
                  dictionary={dictionary}
                  locale={locale}
                  compact
                  onMarkRead={handleMarkRead}
                />
              ))
            )}
          </div>
        </ScrollArea>
        <div className="border-t px-3 py-2 text-center">
          <Button
            asChild
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs"
            onClick={() => setOpen(false)}
          >
            <Link href={`/${locale}/settings/notifications`}>
              {(dict?.actions as Record<string, string> | undefined)?.viewAll ??
                dictionary.common.viewAll ??
                "View all"}
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
