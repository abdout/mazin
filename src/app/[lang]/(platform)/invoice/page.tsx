import { Suspense } from "react"

import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization"
import PageHeading from "@/components/atom/page-heading"
import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { db } from "@/lib/db"
import { auth } from "@/auth"
import {
  invoiceSearchParamsCache,
  getInvoices,
  getInvoiceStatusCounts,
  getInvoiceTotalRange,
  InvoicesTable,
  InvoicesTableSkeleton,
} from "@/components/platform/invoice/_table"

interface InvoicesPageProps {
  params: Promise<{ lang: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function InvoicesPage({
  params,
  searchParams,
}: InvoicesPageProps) {
  const { lang } = await params
  const locale = lang as Locale
  const dict = await getDictionary(locale)
  const session = await auth()

  // Parse search params for table state
  const search = invoiceSearchParamsCache.parse(await searchParams)

  // Fetch shipments for modal form
  const shipments = await db.shipment.findMany({
    where: { userId: session?.user?.id },
    orderBy: { createdAt: "desc" },
  })

  // Fetch table data in parallel
  const promises = Promise.all([
    getInvoices(search),
    getInvoiceStatusCounts(),
    getInvoiceTotalRange(),
  ])

  const navItems: PageNavItem[] = [
    { name: dict.invoices.nav?.invoices || "Invoices", href: `/${locale}/invoice` },
    { name: dict.invoices.nav?.settings || "Settings", href: `/${locale}/invoice/settings` },
    { name: dict.invoices.nav?.templates || "Templates", href: `/${locale}/invoice/templates` },
  ]

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <PageHeading title={dict.invoices.title} />
        <PageNav pages={navItems} className="mt-4" />
      </div>
      <div className="px-4 lg:px-6">
        <Suspense fallback={<InvoicesTableSkeleton />}>
          <InvoicesTable
            promises={promises}
            dictionary={dict}
            locale={locale}
            shipments={shipments}
          />
        </Suspense>
      </div>
    </div>
  )
}
