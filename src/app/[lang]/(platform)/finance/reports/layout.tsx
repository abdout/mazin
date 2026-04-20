import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { PageHeadingSetter } from "@/components/platform/context/page-heading-setter"
import { getDictionary } from "@/components/internationalization/dictionaries"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}

export default async function ReportsLayout({ children, params }: Props) {
  const { lang } = await params
  const dict = await getDictionary(lang as "ar" | "en")
  const finance = dict.finance as Record<string, any> | undefined

  // Define reports page navigation for customs clearance
  // NOTE: Only "Overview" is implemented; other sub-pages are planned (stubbed).
  const reportsPages: PageNavItem[] = [
    { name: finance?.reports?.nav?.overview ?? "Overview", href: `/${lang}/finance/reports` },
    { name: finance?.reports?.nav?.financial ?? "Financial Statements", href: `/${lang}/finance/reports/financial`, comingSoon: true },
    { name: finance?.reports?.nav?.cashflow ?? "Cash Flow", href: `/${lang}/finance/reports/cashflow`, comingSoon: true },
    { name: finance?.reports?.nav?.profitloss ?? "Profit & Loss", href: `/${lang}/finance/reports/profitloss`, comingSoon: true },
    { name: finance?.reports?.nav?.balanceSheet ?? "Balance Sheet", href: `/${lang}/finance/reports/balance-sheet`, comingSoon: true },
    { name: finance?.reports?.nav?.custom ?? "Custom Reports", href: `/${lang}/finance/reports/custom`, comingSoon: true },
    { name: finance?.reports?.nav?.schedule ?? "Schedule Reports", href: `/${lang}/finance/reports/schedule`, comingSoon: true },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={finance?.reports?.title ?? "Reports"} />
      <PageNav pages={reportsPages} comingSoonLabel={finance?.comingSoonLabel ?? "Soon"} />
      {children}
    </div>
  )
}
