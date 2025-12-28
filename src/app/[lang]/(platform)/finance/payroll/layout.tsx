import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { PageHeadingSetter } from "@/components/platform/context/page-heading-setter"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}

export default async function PayrollLayout({ children, params }: Props) {
  const { lang } = await params
  const isRTL = lang === "ar"

  // Define payroll page navigation for customs clearance
  const payrollPages: PageNavItem[] = [
    { name: isRTL ? "نظرة عامة" : "Overview", href: `/${lang}/finance/payroll` },
    { name: isRTL ? "معالجة الرواتب" : "Payroll Processing", href: `/${lang}/finance/payroll/processing` },
    { name: isRTL ? "سجل الرواتب" : "Payroll History", href: `/${lang}/finance/payroll/history` },
    { name: isRTL ? "الخصومات" : "Deductions", href: `/${lang}/finance/payroll/deductions` },
    { name: isRTL ? "المزايا" : "Benefits", href: `/${lang}/finance/payroll/benefits` },
    { name: isRTL ? "التقارير" : "Reports", href: `/${lang}/finance/payroll/reports` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={isRTL ? "الرواتب" : "Payroll"} />
      <PageNav pages={payrollPages} />
      {children}
    </div>
  )
}
