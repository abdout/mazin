import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization"
import { OrganizationContent } from "@/components/platform/settings/organization/content"

export default async function OrganizationPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const locale = lang as Locale
  const dict = await getDictionary(locale)

  return <OrganizationContent dictionary={dict} locale={locale} />
}
