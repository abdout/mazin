// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

export { NotificationBellIcon } from "./bell-icon"
export { NotificationCenter } from "./center"
export { NotificationCard } from "./card"
export { NotificationPreferencesForm } from "./preferences-form"
export { NotificationsContent } from "./content"

export {
  NOTIFICATION_TYPES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_TYPE_CONFIG,
  CHANNEL_ICONS,
  CHANNEL_CONFIG,
  PRIORITY_CONFIG,
  DEFAULT_PREFERENCES,
  DEFAULT_CLIENT_MATRIX,
  DEFAULT_QUIET_HOURS,
  NOTIFICATION_BELL_MAX_DISPLAY,
  NOTIFICATIONS_PER_PAGE,
  TYPE_DICT_KEY,
} from "./config"

export type {
  NotificationDTO,
  NotificationPreferenceDTO,
  NotificationWithRelations,
  PreferenceMatrix,
  DispatchResult,
} from "./types"

export type {
  CreateNotificationInput,
  NotificationListInput,
  UpdateNotificationPreferencesInput,
} from "./validation"

export {
  createNotification,
  deleteNotification,
  fetchPreferences,
  getBellNotifications,
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  updateNotificationPreferences,
} from "./actions"
