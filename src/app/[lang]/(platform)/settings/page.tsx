import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization"

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang: langParam } = await params
  const lang = langParam as Locale
  const dict = await getDictionary(lang)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{dict.settings.title}</h1>

      <div className="text-muted-foreground">
        Settings page content coming soon...
      </div>
    </div>
  )
}
