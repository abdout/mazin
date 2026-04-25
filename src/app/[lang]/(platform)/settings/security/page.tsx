import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization"
import { SecurityContent } from "@/components/platform/settings/security/content"

export default async function SettingsSecurityPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const locale = lang as Locale
  const dict = await getDictionary(locale)

  return <SecurityContent dictionary={dict} locale={locale} />
}
