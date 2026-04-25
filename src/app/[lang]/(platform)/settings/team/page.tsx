import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization"
import { TeamContent } from "@/components/platform/settings/team/content"

export default async function SettingsTeamPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const locale = lang as Locale
  const dict = await getDictionary(locale)

  return <TeamContent dictionary={dict} locale={locale} />
}
