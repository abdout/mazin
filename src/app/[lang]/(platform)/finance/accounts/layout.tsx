import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { PageHeadingSetter } from "@/components/platform/context/page-heading-setter"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}

export default async function AccountsLayout({ children, params }: Props) {
  const { lang } = await params
  const isRTL = lang === "ar"

  // Define accounts page navigation for customs clearance
  const accountsPages: PageNavItem[] = [
    { name: isRTL ? "نظرة عامة" : "Overview", href: `/${lang}/finance/accounts` },
    { name: isRTL ? "دليل الحسابات" : "Chart of Accounts", href: `/${lang}/finance/accounts/chart` },
    { name: isRTL ? "قيود اليومية" : "Journal Entries", href: `/${lang}/finance/accounts/journal` },
    { name: isRTL ? "دفتر الأستاذ" : "General Ledger", href: `/${lang}/finance/accounts/ledger` },
    { name: isRTL ? "المطابقة" : "Reconciliation", href: `/${lang}/finance/accounts/reconciliation` },
    { name: isRTL ? "الإعدادات" : "Settings", href: `/${lang}/finance/accounts/settings` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={isRTL ? "الحسابات" : "Accounts"} />
      <PageNav pages={accountsPages} />
      {children}
    </div>
  )
}
