import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { PageHeadingSetter } from "@/components/platform/context/page-heading-setter"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}

export default async function TimesheetLayout({ children, params }: Props) {
  const { lang } = await params
  const isRTL = lang === "ar"

  // Define timesheet page navigation for customs clearance
  const timesheetPages: PageNavItem[] = [
    { name: isRTL ? "نظرة عامة" : "Overview", href: `/${lang}/finance/timesheet` },
    { name: isRTL ? "إدخال الوقت" : "Time Entry", href: `/${lang}/finance/timesheet/entry` },
    { name: isRTL ? "الموافقة" : "Approval", href: `/${lang}/finance/timesheet/approval` },
    { name: isRTL ? "عرض التقويم" : "Calendar View", href: `/${lang}/finance/timesheet/calendar` },
    { name: isRTL ? "التقارير" : "Reports", href: `/${lang}/finance/timesheet/reports` },
    { name: isRTL ? "الإعدادات" : "Settings", href: `/${lang}/finance/timesheet/settings` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={isRTL ? "جدول الدوام" : "Timesheet"} />
      <PageNav pages={timesheetPages} />
      {children}
    </div>
  )
}
