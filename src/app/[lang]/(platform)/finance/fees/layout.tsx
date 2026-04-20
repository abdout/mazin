import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { PageHeadingSetter } from "@/components/platform/context/page-heading-setter"
import { getDictionary } from "@/components/internationalization/dictionaries"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}

export default async function FeesLayout({ children, params }: Props) {
  const { lang } = await params
  const dict = await getDictionary(lang as "ar" | "en")
  const finance = dict.finance as Record<string, any> | undefined

  // Define service charges page navigation for customs clearance
  // NOTE: Only "Overview" is implemented; other sub-pages are planned (stubbed).
  const feesPages: PageNavItem[] = [
    { name: finance?.fees?.nav?.overview ?? "Overview", href: `/${lang}/finance/fees` },
    { name: finance?.fees?.nav?.structure ?? "Service Rates", href: `/${lang}/finance/fees/structure`, comingSoon: true },
    { name: finance?.fees?.nav?.collection ?? "Charge Collection", href: `/${lang}/finance/fees/collection`, comingSoon: true },
    { name: finance?.fees?.nav?.pending ?? "Pending Charges", href: `/${lang}/finance/fees/pending`, comingSoon: true },
    { name: finance?.fees?.nav?.discounts ?? "Discounts", href: `/${lang}/finance/fees/discounts`, comingSoon: true },
    { name: finance?.fees?.nav?.reports ?? "Reports", href: `/${lang}/finance/fees/reports`, comingSoon: true },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={finance?.fees?.title ?? "Service Charges"} />
      <PageNav pages={feesPages} comingSoonLabel={finance?.comingSoonLabel ?? "Soon"} />
      {children}
    </div>
  )
}
