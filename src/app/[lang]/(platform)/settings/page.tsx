import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization"
import PageHeading from "@/components/atom/page-heading"

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const locale = lang as Locale
  const dict = await getDictionary(locale)

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <PageHeading title={dict.settings?.title || "Settings"} />
      </div>
      <div className="px-4 lg:px-6">
        <div className="text-muted-foreground">
          Settings page content coming soon...
        </div>
      </div>
    </div>
  )
}
