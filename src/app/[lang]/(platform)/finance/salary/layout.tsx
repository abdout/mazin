import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { PageHeadingSetter } from "@/components/platform/context/page-heading-setter"
import { getDictionary } from "@/components/internationalization/dictionaries"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}

export default async function SalaryLayout({ children, params }: Props) {
  const { lang } = await params
  const dict = await getDictionary(lang as "ar" | "en")
  const finance = dict.finance as Record<string, any> | undefined

  // Define salary page navigation for customs clearance
  // NOTE: Only "Overview" is implemented; other sub-pages are planned (stubbed).
  const salaryPages: PageNavItem[] = [
    { name: finance?.salary?.nav?.overview ?? "Overview", href: `/${lang}/finance/salary` },
    { name: finance?.salary?.nav?.structure ?? "Salary Structure", href: `/${lang}/finance/salary/structure`, comingSoon: true },
    { name: finance?.salary?.nav?.slips ?? "Salary Slips", href: `/${lang}/finance/salary/slips`, comingSoon: true },
    { name: finance?.salary?.nav?.increments ?? "Increments", href: `/${lang}/finance/salary/increments`, comingSoon: true },
    { name: finance?.salary?.nav?.advances ?? "Advances", href: `/${lang}/finance/salary/advances`, comingSoon: true },
    { name: finance?.salary?.nav?.reports ?? "Reports", href: `/${lang}/finance/salary/reports`, comingSoon: true },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={finance?.salary?.title ?? "Salary"} />
      <PageNav pages={salaryPages} comingSoonLabel={finance?.comingSoonLabel ?? "Soon"} />
      {children}
    </div>
  )
}
