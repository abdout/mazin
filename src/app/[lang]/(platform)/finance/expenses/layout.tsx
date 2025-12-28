import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { PageHeadingSetter } from "@/components/platform/context/page-heading-setter"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}

export default async function ExpensesLayout({ children, params }: Props) {
  const { lang } = await params
  const isRTL = lang === "ar"

  // Define expenses page navigation for customs clearance
  const expensesPages: PageNavItem[] = [
    { name: isRTL ? "نظرة عامة" : "Overview", href: `/${lang}/finance/expenses` },
    { name: isRTL ? "تقديم مصروف" : "Submit Expense", href: `/${lang}/finance/expenses/submit` },
    { name: isRTL ? "بانتظار الموافقة" : "Pending Approval", href: `/${lang}/finance/expenses/pending` },
    { name: isRTL ? "المعتمدة" : "Approved", href: `/${lang}/finance/expenses/approved` },
    { name: isRTL ? "التقارير" : "Reports", href: `/${lang}/finance/expenses/reports` },
    { name: isRTL ? "الفئات" : "Categories", href: `/${lang}/finance/expenses/categories` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={isRTL ? "المصروفات" : "Expenses"} />
      <PageNav pages={expensesPages} />
      {children}
    </div>
  )
}
