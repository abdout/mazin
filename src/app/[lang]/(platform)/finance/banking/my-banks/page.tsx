import { auth } from "@/auth"

import type { Locale } from "@/components/internationalization/config"
import MyBanksContent from "@/components/platform/finance/banking/my-banks/content"

export default async function MyBanksPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const session = await auth()

  if (!session?.user) {
    return null // Layout handles redirect
  }

  return (
    <MyBanksContent
      user={session.user}
      dictionary={undefined}
      lang={lang as Locale}
    />
  )
}
