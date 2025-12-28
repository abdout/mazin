import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { PageHeadingSetter } from "@/components/platform/context/page-heading-setter"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}

export default async function BudgetLayout({ children, params }: Props) {
  const { lang } = await params
  const isRTL = lang === "ar"

  // Define budget page navigation for customs clearance
  const budgetPages: PageNavItem[] = [
    { name: isRTL ? "نظرة عامة" : "Overview", href: `/${lang}/finance/budget` },
    { name: isRTL ? "تخطيط الميزانية" : "Budget Planning", href: `/${lang}/finance/budget/planning` },
    { name: isRTL ? "تتبع الميزانية" : "Budget Tracking", href: `/${lang}/finance/budget/tracking` },
    { name: isRTL ? "تحليل الفروقات" : "Variance Analysis", href: `/${lang}/finance/budget/variance` },
    { name: isRTL ? "التوقعات" : "Forecasting", href: `/${lang}/finance/budget/forecasting` },
    { name: isRTL ? "سير الموافقة" : "Approval Workflow", href: `/${lang}/finance/budget/approval` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={isRTL ? "الميزانية" : "Budget"} />
      <PageNav pages={budgetPages} />
      {children}
    </div>
  )
}
