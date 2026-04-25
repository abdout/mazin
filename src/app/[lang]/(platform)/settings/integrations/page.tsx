import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization"
import { IntegrationsContent } from "@/components/platform/settings/integrations/content"

export default async function SettingsIntegrationsPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const locale = lang as Locale
  const dict = await getDictionary(locale)

  return <IntegrationsContent dictionary={dict} locale={locale} />
}
