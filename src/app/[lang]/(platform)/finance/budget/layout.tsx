import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { PageHeadingSetter } from "@/components/platform/context/page-heading-setter"
import { getDictionary } from "@/components/internationalization/dictionaries"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}

export default async function BudgetLayout({ children, params }: Props) {
  const { lang } = await params
  const dict = await getDictionary(lang as "ar" | "en")
  const finance = dict.finance as Record<string, any> | undefined

  // Define budget page navigation for customs clearance
  // NOTE: Only "Overview" is implemented; other sub-pages are planned (stubbed).
  const budgetPages: PageNavItem[] = [
    { name: finance?.budget?.nav?.overview ?? "Overview", href: `/${lang}/finance/budget` },
    { name: finance?.budget?.nav?.planning ?? "Budget Planning", href: `/${lang}/finance/budget/planning`, comingSoon: true },
    { name: finance?.budget?.nav?.tracking ?? "Budget Tracking", href: `/${lang}/finance/budget/tracking`, comingSoon: true },
    { name: finance?.budget?.nav?.variance ?? "Variance Analysis", href: `/${lang}/finance/budget/variance`, comingSoon: true },
    { name: finance?.budget?.nav?.forecasting ?? "Forecasting", href: `/${lang}/finance/budget/forecasting`, comingSoon: true },
    { name: finance?.budget?.nav?.approval ?? "Approval Workflow", href: `/${lang}/finance/budget/approval`, comingSoon: true },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={finance?.budget?.title ?? "Budget"} />
      <PageNav pages={budgetPages} comingSoonLabel={finance?.comingSoonLabel ?? "Soon"} />
      {children}
    </div>
  )
}
