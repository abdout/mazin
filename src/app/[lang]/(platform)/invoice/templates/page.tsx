import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization"
import { getCompanySettings } from "@/actions/invoice"
import PageHeading from "@/components/atom/page-heading"
import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { TemplatePreview } from "@/components/platform/invoice/template-preview"

export default async function InvoiceTemplatesPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const locale = lang as Locale
  const dict = await getDictionary(locale)
  const settings = await getCompanySettings()

  const navItems: PageNavItem[] = [
    { name: dict.invoices.nav?.invoices || "Invoices", href: `/${locale}/invoice` },
    { name: dict.invoices.nav?.settings || "Settings", href: `/${locale}/invoice/settings` },
    { name: dict.invoices.nav?.templates || "Templates", href: `/${locale}/invoice/templates` },
  ]

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <PageHeading title={dict.invoices.templatesPage?.title || "Invoice Templates"} />
        <PageNav pages={navItems} className="mt-4" />
      </div>
      <div className="px-4 lg:px-6">
        <TemplatePreview settings={settings} dictionary={dict} locale={locale} />
      </div>
    </div>
  )
}
