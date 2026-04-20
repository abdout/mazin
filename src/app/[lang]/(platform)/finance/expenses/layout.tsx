import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { PageHeadingSetter } from "@/components/platform/context/page-heading-setter"
import { getDictionary } from "@/components/internationalization/dictionaries"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}

export default async function ExpensesLayout({ children, params }: Props) {
  const { lang } = await params
  const dict = await getDictionary(lang as "ar" | "en")
  const finance = dict.finance as Record<string, any> | undefined

  // Define expenses page navigation for customs clearance
  // NOTE: Only "Overview" is implemented; other sub-pages are planned (stubbed).
  const expensesPages: PageNavItem[] = [
    { name: finance?.expenses?.nav?.overview ?? "Overview", href: `/${lang}/finance/expenses` },
    { name: finance?.expenses?.nav?.submit ?? "Submit Expense", href: `/${lang}/finance/expenses/submit`, comingSoon: true },
    { name: finance?.expenses?.nav?.pending ?? "Pending Approval", href: `/${lang}/finance/expenses/pending`, comingSoon: true },
    { name: finance?.expenses?.nav?.approved ?? "Approved", href: `/${lang}/finance/expenses/approved`, comingSoon: true },
    { name: finance?.expenses?.nav?.reports ?? "Reports", href: `/${lang}/finance/expenses/reports`, comingSoon: true },
    { name: finance?.expenses?.nav?.categories ?? "Categories", href: `/${lang}/finance/expenses/categories`, comingSoon: true },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={finance?.expenses?.title ?? "Expenses"} />
      <PageNav pages={expensesPages} comingSoonLabel={finance?.comingSoonLabel ?? "Soon"} />
      {children}
    </div>
  )
}
