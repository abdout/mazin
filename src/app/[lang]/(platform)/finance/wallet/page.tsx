import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import WalletContent from "@/components/platform/finance/wallet/content"

export const metadata = { title: "Finance — Client wallets" }

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <WalletContent dictionary={dictionary} lang={lang} />
}
