import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization"
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
    { name: dict.invoices.nav?.invoices || "Invoices", href: `/${locale}/invoices` },
    { name: dict.invoices.nav?.settings || "Settings", href: `/${locale}/invoices/settings` },
    { name: dict.invoices.nav?.templates || "Templates", href: `/${locale}/invoices/templates` },
  ]

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <PageHeading title={dict.invoices.title} />
        <PageNav pages={navItems} className="mt-4" />
      </div>
      <div className="px-4 lg:px-6">
        <InvoiceTable data={invoices} dictionary={dict} locale={locale} />
      </div>
    </div>
  )
}
