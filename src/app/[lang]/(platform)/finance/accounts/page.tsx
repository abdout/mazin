import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import AccountsContent from "@/components/platform/finance/accounts/content"

export const metadata = { title: "Finance — Bank accounts" }

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <AccountsContent dictionary={dictionary} lang={lang} />
}
