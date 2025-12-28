import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { PageHeadingSetter } from "@/components/platform/context/page-heading-setter"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}

export default async function ReceiptLayout({ children, params }: Props) {
  const { lang } = await params
  const isRTL = lang === "ar"

  // Define receipt page navigation for customs clearance
  const receiptPages: PageNavItem[] = [
    { name: isRTL ? "نظرة عامة" : "Overview", href: `/${lang}/finance/receipt` },
    { name: isRTL ? "إنشاء إيصال" : "Generate Receipt", href: `/${lang}/finance/receipt/generate` },
    { name: isRTL ? "سجل الإيصالات" : "Receipt History", href: `/${lang}/finance/receipt/history` },
    { name: isRTL ? "القوالب" : "Templates", href: `/${lang}/finance/receipt/templates` },
    { name: isRTL ? "إدارة الخطط" : "Manage Plans", href: `/${lang}/finance/receipt/manage-plan` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={isRTL ? "الإيصالات" : "Receipts"} />
      <PageNav pages={receiptPages} />
      {children}
    </div>
  )
}
