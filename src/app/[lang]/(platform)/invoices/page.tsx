import Link from "next/link"
import { IconPlus } from "@tabler/icons-react"

import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization"
import { Button } from "@/components/ui/button"
import { getInvoices } from "@/actions/invoice"
import { InvoiceTable } from "@/components/platform/invoice/invoice-table"
import PageHeading from "@/components/atom/page-heading"
import { PageNav, type PageNavItem } from "@/components/atom/page-nav"

export default async function InvoicesPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const locale = lang as Locale
  const dict = await getDictionary(locale)
  const invoices = await getInvoices()

  const navItems: PageNavItem[] = [
    { name: dict.invoices.title, href: `/${locale}/invoices` },
  ]

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <div className="flex items-start justify-between">
          <PageHeading
            title={dict.invoices.title}
            description={dict.invoices.description || "Manage and track your invoices"}
          />
          <Button asChild className="shrink-0">
            <Link href={`/${locale}/invoices/new`}>
              <IconPlus className="size-4" />
              {dict.invoices.newInvoice || "New Invoice"}
            </Link>
          </Button>
        </div>
        <PageNav pages={navItems} className="mt-4" />
      </div>
      <div className="px-4 lg:px-6">
        <InvoiceTable data={invoices} dictionary={dict} locale={locale} />
      </div>
    </div>
  )
}
