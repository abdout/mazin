import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/platform/context/page-heading-setter"
import FinanceContent from "@/components/platform/finance/content"

export const metadata = { title: "Finance" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.finance
  const isRTL = lang === "ar"

  // Define finance page navigation (primary links shown in nav, secondary hidden)
  const financePages: PageNavItem[] = [
    // Primary navigation (most important features for customs clearance)
    {
      name: isRTL ? "نظرة عامة" : "Overview",
      href: `/${lang}/finance`,
    },
    {
      name: isRTL ? "الفواتير" : "Invoices",
      href: `/${lang}/finance/invoice`,
    },
    {
      name: isRTL ? "البنوك" : "Banking",
      href: `/${lang}/finance/banking`,
    },
    {
      name: isRTL ? "الرسوم" : "Charges",
      href: `/${lang}/finance/fees`,
    },
    {
      name: isRTL ? "المصروفات" : "Expenses",
      href: `/${lang}/finance/expenses`,
    },
    {
      name: isRTL ? "الرواتب" : "Payroll",
      href: `/${lang}/finance/payroll`,
    },
    {
      name: isRTL ? "التقارير" : "Reports",
      href: `/${lang}/finance/reports`,
    },

    // Secondary navigation (hidden from nav, shown in content)
    {
      name: isRTL ? "الإيصالات" : "Receipts",
      href: `/${lang}/finance/receipt`,
      hidden: true,
    },
    {
      name: isRTL ? "الحضور" : "Timesheet",
      href: `/${lang}/finance/timesheet`,
      hidden: true,
    },
    {
      name: isRTL ? "المحفظة" : "Wallet",
      href: `/${lang}/finance/wallet`,
      hidden: true,
    },
    {
      name: isRTL ? "الميزانية" : "Budget",
      href: `/${lang}/finance/budget`,
      hidden: true,
    },
    {
      name: isRTL ? "هياكل الرواتب" : "Salary",
      href: `/${lang}/finance/salary`,
      hidden: true,
    },
    {
      name: isRTL ? "الحسابات" : "Accounts",
      href: `/${lang}/finance/accounts`,
      hidden: true,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={isRTL ? "المالية" : "Finance"} />
      <PageNav pages={financePages} />
      <FinanceContent dictionary={dictionary} lang={lang} />
    </div>
  )
}
