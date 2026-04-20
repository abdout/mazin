// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Dictionary } from "@/components/internationalization/types"

import {
  deleteNotification,
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "./actions"
import { NotificationCard } from "./card"
import type { NotificationDTO } from "./types"

type Locale = "ar" | "en"
type Filter = "all" | "unread"

interface CenterProps {
  dictionary: Dictionary
  locale: Locale
  initialItems: NotificationDTO[]
  initialUnreadCount: number
  initialNextCursor: string | null
}

const PRIORITY_RANK: Record<NotificationDTO["priority"], number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
}

function sortItems(items: NotificationDTO[]): NotificationDTO[] {
  return [...items].sort((a, b) => {
    const p = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
    if (p !== 0) return p
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}

function formatDayKey(iso: string, locale: Locale): string {
  const d = new Date(iso)
  const today = new Date()
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate())
  const msPerDay = 86_400_000
  const diffDays = Math.round(
    (startOf(today).getTime() - startOf(d).getTime()) / msPerDay
  )
  if (diffDays === 0) return locale === "ar" ? "اليوم" : "Today"
  if (diffDays === 1) return locale === "ar" ? "أمس" : "Yesterday"
  if (diffDays < 7) return locale === "ar" ? "هذا الأسبوع" : "This week"
  return locale === "ar" ? "أقدم" : "Earlier"
}

function groupByDay(
  items: NotificationDTO[],
  locale: Locale
): Array<{ key: string; items: NotificationDTO[] }> {
  const groups = new Map<string, NotificationDTO[]>()
  const order: string[] = []
  for (const item of items) {
    const key = formatDayKey(item.createdAt, locale)
    if (!groups.has(key)) {
      groups.set(key, [])
      order.push(key)
    }
    groups.get(key)!.push(item)
  }
  return order.map((key) => ({ key, items: groups.get(key)! }))
}

export function NotificationCenter({
  dictionary,
  locale,
  initialItems,
  initialUnreadCount,
  initialNextCursor,
}: CenterProps) {
  const [filter, setFilter] = React.useState<Filter>("all")
  const [items, setItems] = React.useState<NotificationDTO[]>(initialItems)
  const [unreadCount, setUnreadCount] = React.useState<number>(initialUnreadCount)
  const [cursor, setCursor] = React.useState<string | null>(initialNextCursor)
  const [loading, setLoading] = React.useState(false)
  const [selected, setSelected] = React.useState<Set<string>>(new Set())

  const dict = (dictionary as unknown as { notifications?: Record<string, unknown> })
    .notifications as Record<string, unknown> | undefined

  const filtered = React.useMemo(() => {
    const pool = filter === "unread" ? items.filter((n) => !n.readAt) : items
    return sortItems(pool)
  }, [items, filter])
  const grouped = React.useMemo(() => groupByDay(filtered, locale), [filtered, locale])

  const loadMore = React.useCallback(async () => {
    if (!cursor || loading) return
    setLoading(true)
    const res = await listNotifications({ cursor, filter, limit: 20 })
    setLoading(false)
    if (res.ok) {
      setItems((prev) => mergeUnique(prev, res.data.items))
      setCursor(res.data.nextCursor)
    }
  }, [cursor, filter, loading])

  const handleToggleSelect = React.useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleSelectAllVisible = React.useCallback(() => {
    setSelected(new Set(filtered.map((n) => n.id)))
  }, [filtered])

  const clearSelection = React.useCallback(() => setSelected(new Set()), [])

  const handleBulkMarkRead = React.useCallback(async () => {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    setItems((prev) =>
      prev.map((n) =>
        ids.includes(n.id) ? { ...n, readAt: new Date().toISOString() } : n
      )
    )
    setUnreadCount((c) =>
      Math.max(
        0,
        c -
          ids.filter((id) => {
            const target = items.find((x) => x.id === id)
            return target && !target.readAt
          }).length
      )
    )
    clearSelection()
    for (const id of ids) {
      await markNotificationAsRead({ notificationId: id })
    }
  }, [selected, items, clearSelection])

  const handleBulkDelete = React.useCallback(async () => {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    setItems((prev) => prev.filter((n) => !ids.includes(n.id)))
    clearSelection()
    for (const id of ids) {
      await deleteNotification({ notificationId: id })
    }
  }, [selected, clearSelection])

  const handleSingleMarkRead = React.useCallback(
    async (id: string) => {
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
      )
      setUnreadCount((c) => {
        const target = items.find((x) => x.id === id)
        return target && !target.readAt ? Math.max(0, c - 1) : c
      })
      await markNotificationAsRead({ notificationId: id })
    },
    [items]
  )

  const handleSingleDelete = React.useCallback(async (id: string) => {
    setItems((prev) => prev.filter((n) => n.id !== id))
    await deleteNotification({ notificationId: id })
  }, [])

  const handleMarkAllRead = React.useCallback(async () => {
    setItems((prev) =>
      prev.map((n) => (n.readAt ? n : { ...n, readAt: new Date().toISOString() }))
    )
    setUnreadCount(0)
    await markAllNotificationsAsRead({})
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">
            {dictionary.navigation.notifications}
          </h1>
          <p className="text-sm text-muted-foreground">
            {(dict?.page as Record<string, string> | undefined)?.subtitle ??
              (locale === "ar"
                ? "إدارة إشعاراتك وتفضيلات القناة"
                : "Manage your notifications and channel preferences")}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleMarkAllRead()}
          >
            {(dict?.actions as Record<string, string> | undefined)?.markAllRead ??
              "Mark all read"}
          </Button>
        )}
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <div className="flex items-center justify-between gap-2">
          <TabsList>
            <TabsTrigger value="all">
              {dictionary.common.all}
              <Badge variant="secondary" className="ms-2">
                {items.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="unread">
              {(dict?.filters as Record<string, string> | undefined)?.unread ??
                (locale === "ar" ? "غير مقروءة" : "Unread")}
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ms-2">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {selected.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {selected.size}{" "}
                {(dict?.bulk as Record<string, string> | undefined)?.selected ??
                  (locale === "ar" ? "محدد" : "selected")}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleBulkMarkRead()}
              >
                {(dict?.actions as Record<string, string> | undefined)?.markRead ??
                  "Mark read"}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => void handleBulkDelete()}
              >
                {dictionary.common.delete}
              </Button>
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                {dictionary.common.cancel}
              </Button>
            </div>
          )}
          {selected.size === 0 && filtered.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleSelectAllVisible}>
              {(dict?.bulk as Record<string, string> | undefined)?.selectAll ??
                (locale === "ar" ? "تحديد الكل" : "Select all")}
            </Button>
          )}
        </div>

        <TabsContent value={filter} className="mt-4">
          {grouped.length === 0 ? (
            <div className="rounded-md border bg-muted/30 p-10 text-center">
              <p className="text-sm text-muted-foreground">
                {(dict?.empty as Record<string, string> | undefined)?.title ??
                  (locale === "ar" ? "لا توجد إشعارات" : "No notifications")}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {grouped.map((group) => (
                <section key={group.key} className="space-y-2">
                  <h2 className="text-xs font-medium uppercase text-muted-foreground">
                    {group.key}
                  </h2>
                  <div className="flex flex-col gap-2">
                    {group.items.map((n) => (
                      <NotificationCard
                        key={n.id}
                        notification={n}
                        dictionary={dictionary}
                        locale={locale}
                        selected={selected.has(n.id)}
                        onToggleSelect={handleToggleSelect}
                        onMarkRead={handleSingleMarkRead}
                        onDelete={handleSingleDelete}
                      />
                    ))}
                  </div>
                </section>
              ))}
              {cursor && (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={loading}
                    onClick={() => void loadMore()}
                  >
                    {loading
                      ? dictionary.common.loading
                      : (dict?.actions as Record<string, string> | undefined)?.loadMore ??
                        (locale === "ar" ? "تحميل المزيد" : "Load more")}
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function mergeUnique(
  a: NotificationDTO[],
  b: NotificationDTO[]
): NotificationDTO[] {
  const seen = new Set(a.map((x) => x.id))
  return [...a, ...b.filter((x) => !seen.has(x.id))]
}
