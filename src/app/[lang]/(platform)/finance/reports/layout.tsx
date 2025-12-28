import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { PageHeadingSetter } from "@/components/platform/context/page-heading-setter"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}

export default async function ReportsLayout({ children, params }: Props) {
  const { lang } = await params
  const isRTL = lang === "ar"

  // Define reports page navigation for customs clearance
  const reportsPages: PageNavItem[] = [
    { name: isRTL ? "نظرة عامة" : "Overview", href: `/${lang}/finance/reports` },
    { name: isRTL ? "القوائم المالية" : "Financial Statements", href: `/${lang}/finance/reports/financial` },
    { name: isRTL ? "التدفق النقدي" : "Cash Flow", href: `/${lang}/finance/reports/cashflow` },
    { name: isRTL ? "الأرباح والخسائر" : "Profit & Loss", href: `/${lang}/finance/reports/profitloss` },
    { name: isRTL ? "الميزانية العمومية" : "Balance Sheet", href: `/${lang}/finance/reports/balance-sheet` },
    { name: isRTL ? "تقارير مخصصة" : "Custom Reports", href: `/${lang}/finance/reports/custom` },
    { name: isRTL ? "جدولة التقارير" : "Schedule Reports", href: `/${lang}/finance/reports/schedule` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={isRTL ? "التقارير" : "Reports"} />
      <PageNav pages={reportsPages} />
      {children}
    </div>
  )
}
