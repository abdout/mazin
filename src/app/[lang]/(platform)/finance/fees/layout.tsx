import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { PageHeadingSetter } from "@/components/platform/context/page-heading-setter"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}

export default async function FeesLayout({ children, params }: Props) {
  const { lang } = await params
  const isRTL = lang === "ar"

  // Define service charges page navigation for customs clearance
  const feesPages: PageNavItem[] = [
    { name: isRTL ? "نظرة عامة" : "Overview", href: `/${lang}/finance/fees` },
    { name: isRTL ? "هيكل الرسوم" : "Service Rates", href: `/${lang}/finance/fees/structure` },
    { name: isRTL ? "تحصيل الرسوم" : "Charge Collection", href: `/${lang}/finance/fees/collection` },
    { name: isRTL ? "رسوم معلقة" : "Pending Charges", href: `/${lang}/finance/fees/pending` },
    { name: isRTL ? "الخصومات" : "Discounts", href: `/${lang}/finance/fees/discounts` },
    { name: isRTL ? "التقارير" : "Reports", href: `/${lang}/finance/fees/reports` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={isRTL ? "رسوم الخدمات" : "Service Charges"} />
      <PageNav pages={feesPages} />
      {children}
    </div>
  )
}
