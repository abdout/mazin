import { Suspense } from "react"

import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization"
import PageHeading from "@/components/atom/page-heading"
import {
  clientSearchParamsCache,
  getClients,
  getClientStatusCounts,
  ClientsTable,
  ClientsTableSkeleton,
} from "@/components/platform/customer/_table"

interface CustomerPageProps {
  params: Promise<{ lang: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function CustomerPage({
  params,
  searchParams,
}: CustomerPageProps) {
  const { lang } = await params
  const locale = lang as Locale
  const dict = await getDictionary(locale)

  // Parse search params for table state
  const search = clientSearchParamsCache.parse(await searchParams)

  // Fetch data in parallel
  const promises = Promise.all([
    getClients(search),
    getClientStatusCounts(),
  ])

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <PageHeading title={dict.customer?.title || "Customers"} />
      </div>
      <div className="px-4 lg:px-6">
        <Suspense fallback={<ClientsTableSkeleton />}>
          <ClientsTable
            promises={promises}
            dictionary={dict}
            locale={locale}
          />
        </Suspense>
      </div>
    </div>
  )
}
