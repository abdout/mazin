import { Suspense } from "react"
import { auth } from "@/auth"

import type { Locale } from "@/components/internationalization/config"
import { BankingDashboardContent } from "@/components/platform/finance/banking/dashboard/content"

export default async function BankingDashboardPage({
  searchParams,
  params,
}: {
  searchParams: Promise<{ id?: string; page?: string }>
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const resolvedSearchParams = await searchParams
  const session = await auth()

  if (!session?.user) {
    return null // Layout handles redirect
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BankingDashboardContent
        user={session.user}
        searchParams={resolvedSearchParams}
        dictionary={undefined}
        lang={lang as Locale}
      />
    </Suspense>
  )
}
