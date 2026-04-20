// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization"
import { NotificationsContent } from "@/components/platform/notifications"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  return {
    title: lang === "ar" ? "الإشعارات" : "Notifications",
  }
}

export default async function NotificationSettingsPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const locale = lang as Locale
  const dict = await getDictionary(locale)

  return (
    <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 md:py-6">
      <NotificationsContent dictionary={dict} locale={locale} />
    </div>
  )
}
