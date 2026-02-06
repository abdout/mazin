"use server"

import { auth } from "@/auth"
import {
  markNotificationRead,
  markAllNotificationsRead,
  getUserNotifications,
} from "@/lib/services/notification"

export async function markRead(notificationId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  await markNotificationRead(notificationId)
  return { success: true }
}

export async function markAllRead() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  await markAllNotificationsRead(session.user.id)
  return { success: true }
}

export async function getNotifications(limit = 50) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const notifications = await getUserNotifications(session.user.id, limit)
  return notifications
}
