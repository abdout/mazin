import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization"
import { MarketingContent } from "@/components/marketing/content"

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang: langParam } = await params
  const lang = langParam as Locale
  const dict = await getDictionary(lang)

  return <MarketingContent dictionary={dict} lang={lang} />
}
