import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { PageHeadingSetter } from "@/components/platform/context/page-heading-setter"
import { getDictionary } from "@/components/internationalization/dictionaries"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}

export default async function WalletLayout({ children, params }: Props) {
  const { lang } = await params
  const dict = await getDictionary(lang as "ar" | "en")
  const finance = dict.finance as Record<string, any> | undefined

  // Define wallet page navigation for customs clearance
  // NOTE: Only "Overview" is implemented; other sub-pages are planned (stubbed).
  const walletPages: PageNavItem[] = [
    { name: finance?.wallet?.nav?.overview ?? "Overview", href: `/${lang}/finance/wallet` },
    { name: finance?.wallet?.nav?.balance ?? "Balance", href: `/${lang}/finance/wallet/balance`, comingSoon: true },
    { name: finance?.wallet?.nav?.transactions ?? "Transactions", href: `/${lang}/finance/wallet/transactions`, comingSoon: true },
    { name: finance?.wallet?.nav?.topUp ?? "Top Up", href: `/${lang}/finance/wallet/top-up`, comingSoon: true },
    { name: finance?.wallet?.nav?.withdraw ?? "Withdraw", href: `/${lang}/finance/wallet/withdraw`, comingSoon: true },
    { name: finance?.wallet?.nav?.reports ?? "Reports", href: `/${lang}/finance/wallet/reports`, comingSoon: true },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={finance?.wallet?.title ?? "Wallet"} />
      <PageNav pages={walletPages} comingSoonLabel={finance?.comingSoonLabel ?? "Soon"} />
      {children}
    </div>
  )
}
