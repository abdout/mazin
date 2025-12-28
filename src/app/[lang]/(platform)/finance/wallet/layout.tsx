import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { PageHeadingSetter } from "@/components/platform/context/page-heading-setter"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}

export default async function WalletLayout({ children, params }: Props) {
  const { lang } = await params
  const isRTL = lang === "ar"

  // Define wallet page navigation for customs clearance
  const walletPages: PageNavItem[] = [
    { name: isRTL ? "نظرة عامة" : "Overview", href: `/${lang}/finance/wallet` },
    { name: isRTL ? "الرصيد" : "Balance", href: `/${lang}/finance/wallet/balance` },
    { name: isRTL ? "المعاملات" : "Transactions", href: `/${lang}/finance/wallet/transactions` },
    { name: isRTL ? "شحن الرصيد" : "Top Up", href: `/${lang}/finance/wallet/top-up` },
    { name: isRTL ? "سحب" : "Withdraw", href: `/${lang}/finance/wallet/withdraw` },
    { name: isRTL ? "التقارير" : "Reports", href: `/${lang}/finance/wallet/reports` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={isRTL ? "المحفظة" : "Wallet"} />
      <PageNav pages={walletPages} />
      {children}
    </div>
  )
}
