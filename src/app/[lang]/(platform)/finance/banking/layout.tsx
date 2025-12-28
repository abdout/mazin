import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { PageHeadingSetter } from "@/components/platform/context/page-heading-setter"

interface BankingLayoutProps {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}

export default async function BankingLayout({
  children,
  params,
}: Readonly<BankingLayoutProps>) {
  const { lang } = await params
  const isRTL = lang === "ar"
  const session = await auth()

  if (!session?.user) {
    redirect(`/${lang}/login`)
  }

  // Define banking page navigation for customs clearance
  const bankingPages: PageNavItem[] = [
    {
      name: isRTL ? "لوحة التحكم" : "Dashboard",
      href: `/${lang}/finance/banking`,
    },
    {
      name: isRTL ? "حساباتي البنكية" : "My Banks",
      href: `/${lang}/finance/banking/my-banks`,
    },
    {
      name: isRTL ? "تحويل الأموال" : "Payment Transfer",
      href: `/${lang}/finance/banking/payment-transfer`,
    },
    {
      name: isRTL ? "سجل المعاملات" : "Transaction History",
      href: `/${lang}/finance/banking/transaction-history`,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={isRTL ? "الخدمات المصرفية" : "Banking"} />
      <PageNav pages={bankingPages} />

      {children}
    </div>
  )
}
