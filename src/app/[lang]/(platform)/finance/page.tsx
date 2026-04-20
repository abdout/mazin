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

  // Define finance page navigation (primary links shown in nav, secondary hidden)
  const financePages: PageNavItem[] = [
    // Primary navigation (7 most important features)
    { name: d?.navigation?.overview ?? "", href: `/${lang}/finance` },
    {
      name: d?.navigation?.invoice ?? "",
      href: `/${lang}/finance/invoice`,
    },
    {
      name: d?.navigation?.banking ?? "",
      href: `/${lang}/finance/banking`,
    },
    { name: d?.navigation?.fees ?? "", href: `/${lang}/finance/fees` },
    {
      name: d?.navigation?.salary ?? "",
      href: `/${lang}/finance/salary`,
    },
    {
      name: d?.navigation?.payroll ?? "",
      href: `/${lang}/finance/payroll`,
    },
    {
      name: d?.navigation?.reports ?? "",
      href: `/${lang}/finance/reports`,
    },

    // Secondary navigation (hidden from nav, shown in content)
    {
      name: d?.navigation?.receipt ?? "",
      href: `/${lang}/finance/receipt`,
      hidden: true,
    },
    {
      name: d?.navigation?.timesheet ?? "",
      href: `/${lang}/finance/timesheet`,
      hidden: true,
    },
    {
      name: d?.navigation?.wallet ?? "",
      href: `/${lang}/finance/wallet`,
      hidden: true,
    },
    {
      name: d?.navigation?.budget ?? "",
      href: `/${lang}/finance/budget`,
      hidden: true,
    },
    {
      name: d?.navigation?.expenses ?? "",
      href: `/${lang}/finance/expenses`,
      hidden: true,
    },
    {
      name: d?.navigation?.accounts ?? "",
      href: `/${lang}/finance/accounts`,
      hidden: true,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.title ?? ""} />
      <PageNav pages={financePages} />
      <FinanceContent dictionary={dictionary} lang={lang} />
    </div>
  )
}
