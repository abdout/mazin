// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Dictionary } from "@/components/internationalization/types"

import { requireAuthedUser } from "./authorization"
import { getNotificationsList, getPreferencesForUser } from "./queries"
import { NotificationCenter } from "./center"
import { NotificationPreferencesForm } from "./preferences-form"

type Locale = "ar" | "en"

interface NotificationsContentProps {
  dictionary: Dictionary
  locale: Locale
}

// Renders the full /settings/notifications experience as a server component
// so both the list and the preferences form are hydrated with fresh data.
export async function NotificationsContent({
  dictionary,
  locale,
}: NotificationsContentProps) {
  const user = await requireAuthedUser()
  const [list, preferences] = await Promise.all([
    getNotificationsList(user.id, { limit: 20, filter: "all" }),
    getPreferencesForUser(user.id, user.role),
  ])

  return (
    <div className="flex flex-col gap-8">
      <NotificationCenter
        dictionary={dictionary}
        locale={locale}
        initialItems={list.items}
        initialUnreadCount={list.unreadCount}
        initialNextCursor={list.nextCursor}
      />
      {preferences && (
        <NotificationPreferencesForm
          initial={preferences}
          dictionary={dictionary}
          locale={locale}
        />
      )}
    </div>
  )
}
