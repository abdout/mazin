import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { PageHeadingSetter } from "@/components/platform/context/page-heading-setter"
import { getDictionary } from "@/components/internationalization/dictionaries"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}

export default async function PayrollLayout({ children, params }: Props) {
  const { lang } = await params
  const dict = await getDictionary(lang as "ar" | "en")
  const finance = dict.finance as Record<string, any> | undefined

  // Define payroll page navigation for customs clearance
  // NOTE: Only "Overview" is implemented; other sub-pages are planned (stubbed).
  const payrollPages: PageNavItem[] = [
    { name: finance?.payroll?.nav?.overview ?? "Overview", href: `/${lang}/finance/payroll` },
    { name: finance?.payroll?.nav?.processing ?? "Payroll Processing", href: `/${lang}/finance/payroll/processing`, comingSoon: true },
    { name: finance?.payroll?.nav?.history ?? "Payroll History", href: `/${lang}/finance/payroll/history`, comingSoon: true },
    { name: finance?.payroll?.nav?.deductions ?? "Deductions", href: `/${lang}/finance/payroll/deductions`, comingSoon: true },
    { name: finance?.payroll?.nav?.benefits ?? "Benefits", href: `/${lang}/finance/payroll/benefits`, comingSoon: true },
    { name: finance?.payroll?.nav?.reports ?? "Reports", href: `/${lang}/finance/payroll/reports`, comingSoon: true },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={finance?.payroll?.title ?? "Payroll"} />
      <PageNav pages={payrollPages} comingSoonLabel={finance?.comingSoonLabel ?? "Soon"} />
      {children}
    </div>
  )
}
