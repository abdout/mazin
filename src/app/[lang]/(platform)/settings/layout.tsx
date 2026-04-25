import type { ReactNode } from "react"

import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization"
import { SettingsTabsNav } from "@/components/platform/settings/tabs-nav"

export default async function SettingsLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const locale = lang as Locale
  const dict = await getDictionary(locale)

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <header className="px-4 lg:px-6">
        <h1 className="text-2xl font-bold">
          {dict.settings?.title ?? (locale === "ar" ? "الإعدادات" : "Settings")}
        </h1>
        {dict.settings?.subtitle ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {dict.settings.subtitle}
          </p>
        ) : null}
      </header>
      <div className="px-4 lg:px-6">
        <SettingsTabsNav locale={locale} dictionary={dict} />
      </div>
      <div className="px-4 lg:px-6">{children}</div>
    </div>
  )
}
