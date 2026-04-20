import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { PageHeadingSetter } from "@/components/platform/context/page-heading-setter"
import { getDictionary } from "@/components/internationalization/dictionaries"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}

export default async function TimesheetLayout({ children, params }: Props) {
  const { lang } = await params
  const dict = await getDictionary(lang as "ar" | "en")
  const finance = dict.finance as Record<string, any> | undefined

  // Define timesheet page navigation for customs clearance
  // NOTE: Only "Overview" is implemented; other sub-pages are planned (stubbed).
  const timesheetPages: PageNavItem[] = [
    { name: finance?.timesheet?.nav?.overview ?? "Overview", href: `/${lang}/finance/timesheet` },
    { name: finance?.timesheet?.nav?.entry ?? "Time Entry", href: `/${lang}/finance/timesheet/entry`, comingSoon: true },
    { name: finance?.timesheet?.nav?.approval ?? "Approval", href: `/${lang}/finance/timesheet/approval`, comingSoon: true },
    { name: finance?.timesheet?.nav?.calendar ?? "Calendar View", href: `/${lang}/finance/timesheet/calendar`, comingSoon: true },
    { name: finance?.timesheet?.nav?.reports ?? "Reports", href: `/${lang}/finance/timesheet/reports`, comingSoon: true },
    { name: finance?.timesheet?.nav?.settings ?? "Settings", href: `/${lang}/finance/timesheet/settings`, comingSoon: true },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={finance?.timesheet?.title ?? "Timesheet"} />
      <PageNav pages={timesheetPages} comingSoonLabel={finance?.comingSoonLabel ?? "Soon"} />
      {children}
    </div>
  )
}
