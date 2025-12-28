"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { IconBell, IconCheck, IconClock, IconPackage, IconCash, IconChecks } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { Notification, NotificationType } from "@prisma/client"
import type { Dictionary } from "@/components/internationalization/types"

interface NotificationCenterProps {
  notifications: Notification[]
  dictionary: Dictionary
  locale: string
  onMarkRead?: (id: string) => Promise<void>
  onMarkAllRead?: () => Promise<void>
}

const NOTIFICATION_ICONS: Partial<Record<NotificationType, typeof IconBell>> = {
  TASK_ASSIGNED: IconCheck,
  TASK_DUE_SOON: IconClock,
  PAYMENT_REQUEST: IconCash,
  SHIPMENT_ARRIVAL: IconPackage,
  SHIPMENT_RELEASED: IconPackage,
  SHIPMENT_DELIVERED: IconPackage,
}

export function NotificationCenter({
  notifications,
  dictionary,
  locale,
  onMarkRead,
  onMarkAllRead,
}: NotificationCenterProps) {
  const router = useRouter()
  const unreadCount = notifications.filter((n) => !n.readAt).length

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.readAt && onMarkRead) {
      await onMarkRead(notification.id)
    }

    // Navigate to related page
    if (notification.taskId) {
      router.push(`/${locale}/task/${notification.taskId}`)
    } else if (notification.shipmentId) {
      router.push(`/${locale}/shipment/${notification.shipmentId}`)
    } else if (notification.invoiceId) {
      router.push(`/${locale}/invoice/${notification.invoiceId}`)
    } else if (notification.projectId) {
      router.push(`/${locale}/project/${notification.projectId}`)
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return locale === "ar" ? "الآن" : "Just now"
    if (minutes < 60) return locale === "ar" ? `منذ ${minutes} دقيقة` : `${minutes}m ago`
    if (hours < 24) return locale === "ar" ? `منذ ${hours} ساعة` : `${hours}h ago`
    return locale === "ar" ? `منذ ${days} يوم` : `${days}d ago`
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <IconBell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -end-1 -top-1 h-5 min-w-[1.25rem] px-1 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">
            {locale === "ar" ? "الإشعارات" : "Notifications"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>{locale === "ar" ? "الإشعارات" : "Notifications"}</span>
          {unreadCount > 0 && onMarkAllRead && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto py-1 text-xs"
              onClick={onMarkAllRead}
            >
              <IconChecks className="me-1 h-3 w-3" />
              {locale === "ar" ? "تحديد الكل كمقروء" : "Mark all read"}
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {locale === "ar" ? "لا توجد إشعارات" : "No notifications"}
            </div>
          ) : (
            notifications.map((notification) => {
              const Icon = NOTIFICATION_ICONS[notification.type] || IconBell
              const isUnread = !notification.readAt

              return (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    "flex cursor-pointer gap-3 p-3",
                    isUnread && "bg-muted/50"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      isUnread
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p
                      className={cn(
                        "text-sm leading-none",
                        isUnread && "font-medium"
                      )}
                    >
                      {notification.title}
                    </p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(notification.createdAt)}
                    </p>
                  </div>
                  {isUnread && (
                    <div className="flex h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                </DropdownMenuItem>
              )
            })
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="justify-center text-sm font-medium"
              onClick={() => router.push(`/${locale}/notifications`)}
            >
              {locale === "ar" ? "عرض الكل" : "View all"}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
