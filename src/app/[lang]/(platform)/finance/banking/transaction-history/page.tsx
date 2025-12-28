import { auth } from "@/auth"

import type { Locale } from "@/components/internationalization/config"
import { TransactionHistoryContent } from "@/components/platform/finance/banking/transaction-history/content"

export default async function TransactionHistoryPage({
  searchParams,
  params,
}: {
  searchParams: Promise<{ page?: string; accountId?: string }>
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const resolvedSearchParams = await searchParams
  const session = await auth()

  if (!session?.user) {
    return null // Layout handles redirect
  }

  return (
    <TransactionHistoryContent
      user={session.user}
      searchParams={resolvedSearchParams}
      dictionary={undefined}
      lang={lang as Locale}
    />
  )
}
