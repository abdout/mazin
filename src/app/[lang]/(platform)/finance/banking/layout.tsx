import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization"
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
  const locale = lang as Locale
  const dict = await getDictionary(locale)
  const session = await auth()

  if (!session?.user) {
    redirect(`/${locale}/login`)
  }

  const t = dict.finance?.navigation ?? {}

  // Define banking page navigation for customs clearance
  const bankingPages: PageNavItem[] = [
    {
      name: t.dashboard ?? (locale === "ar" ? "لوحة التحكم" : "Dashboard"),
      href: `/${locale}/finance/banking`,
    },
    {
      name: t.myBanks ?? (locale === "ar" ? "حساباتي البنكية" : "My Banks"),
      href: `/${locale}/finance/banking/my-banks`,
    },
    {
      name: t.paymentTransfer ?? (locale === "ar" ? "تحويل الأموال" : "Payment Transfer"),
      href: `/${locale}/finance/banking/payment-transfer`,
    },
    {
      name: t.transactionHistory ?? (locale === "ar" ? "سجل المعاملات" : "Transaction History"),
      href: `/${locale}/finance/banking/transaction-history`,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={dict.finance?.banking ?? (locale === "ar" ? "الخدمات المصرفية" : "Banking")} />
      <PageNav pages={bankingPages} />

      {children}
    </div>
  )
}
