import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import FeesContent from "@/components/platform/finance/fees/content"

export const metadata = { title: "Finance — Fee templates" }

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <FeesContent dictionary={dictionary} lang={lang} />
}
