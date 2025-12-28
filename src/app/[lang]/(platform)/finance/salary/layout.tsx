import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { PageHeadingSetter } from "@/components/platform/context/page-heading-setter"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}

export default async function SalaryLayout({ children, params }: Props) {
  const { lang } = await params
  const isRTL = lang === "ar"

  // Define salary page navigation for customs clearance
  const salaryPages: PageNavItem[] = [
    { name: isRTL ? "نظرة عامة" : "Overview", href: `/${lang}/finance/salary` },
    { name: isRTL ? "هيكل الرواتب" : "Salary Structure", href: `/${lang}/finance/salary/structure` },
    { name: isRTL ? "قسائم الرواتب" : "Salary Slips", href: `/${lang}/finance/salary/slips` },
    { name: isRTL ? "الزيادات" : "Increments", href: `/${lang}/finance/salary/increments` },
    { name: isRTL ? "السلف" : "Advances", href: `/${lang}/finance/salary/advances` },
    { name: isRTL ? "التقارير" : "Reports", href: `/${lang}/finance/salary/reports` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={isRTL ? "الرواتب" : "Salary"} />
      <PageNav pages={salaryPages} />
      {children}
    </div>
  )
}
