import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization"
import { ProfileContent } from "@/components/platform/settings/profile/content"

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const locale = lang as Locale
  const dict = await getDictionary(locale)

  return <ProfileContent dictionary={dict} locale={locale} />
}
