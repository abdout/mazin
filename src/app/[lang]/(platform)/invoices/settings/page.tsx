import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization"
import { getCompanySettings } from "@/actions/invoice"
import PageHeading from "@/components/atom/page-heading"
import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { SettingsDisplay } from "@/components/platform/invoice/settings-display"

export default async function InvoiceSettingsPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const locale = lang as Locale
  const dict = await getDictionary(locale)
  const settings = await getCompanySettings()

  const navItems: PageNavItem[] = [
    { name: dict.invoices.nav?.invoices || "Invoices", href: `/${locale}/invoices` },
    { name: dict.invoices.nav?.settings || "Settings", href: `/${locale}/invoices/settings` },
    { name: dict.invoices.nav?.templates || "Templates", href: `/${locale}/invoices/templates` },
  ]

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <PageHeading title={dict.invoices.settingsPage?.title || "Invoice Settings"} />
        <PageNav pages={navItems} className="mt-4" />
      </div>
      <div className="px-4 lg:px-6">
        <SettingsDisplay settings={settings} dictionary={dict} locale={locale} />
      </div>
    </div>
  )
}
