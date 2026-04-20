import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { PageHeadingSetter } from "@/components/platform/context/page-heading-setter"
import { getDictionary } from "@/components/internationalization/dictionaries"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}

export default async function AccountsLayout({ children, params }: Props) {
  const { lang } = await params
  const dict = await getDictionary(lang as "ar" | "en")
  const finance = dict.finance as Record<string, any> | undefined

  // Define accounts page navigation for customs clearance
  // NOTE: Only "Overview" is implemented; other sub-pages are planned (stubbed).
  const accountsPages: PageNavItem[] = [
    { name: finance?.accounts?.nav?.overview ?? "Overview", href: `/${lang}/finance/accounts` },
    { name: finance?.accounts?.nav?.chart ?? "Chart of Accounts", href: `/${lang}/finance/accounts/chart`, comingSoon: true },
    { name: finance?.accounts?.nav?.journal ?? "Journal Entries", href: `/${lang}/finance/accounts/journal`, comingSoon: true },
    { name: finance?.accounts?.nav?.ledger ?? "General Ledger", href: `/${lang}/finance/accounts/ledger`, comingSoon: true },
    { name: finance?.accounts?.nav?.reconciliation ?? "Reconciliation", href: `/${lang}/finance/accounts/reconciliation`, comingSoon: true },
    { name: finance?.accounts?.nav?.settings ?? "Settings", href: `/${lang}/finance/accounts/settings`, comingSoon: true },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={finance?.accounts?.title ?? "Accounts"} />
      <PageNav pages={accountsPages} comingSoonLabel={finance?.comingSoonLabel ?? "Soon"} />
      {children}
    </div>
  )
}
