import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { PageHeadingSetter } from "@/components/platform/context/page-heading-setter"
import { getDictionary } from "@/components/internationalization/dictionaries"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}

export default async function ReceiptLayout({ children, params }: Props) {
  const { lang } = await params
  const dict = await getDictionary(lang as "ar" | "en")
  const finance = dict.finance as Record<string, any> | undefined

  // Define receipt page navigation for customs clearance
  // NOTE: Overview and Manage Plans are implemented; other sub-pages are planned (stubbed).
  const receiptPages: PageNavItem[] = [
    { name: finance?.receipt?.nav?.overview ?? "Overview", href: `/${lang}/finance/receipt` },
    { name: finance?.receipt?.nav?.generate ?? "Generate Receipt", href: `/${lang}/finance/receipt/generate`, comingSoon: true },
    { name: finance?.receipt?.nav?.history ?? "Receipt History", href: `/${lang}/finance/receipt/history`, comingSoon: true },
    { name: finance?.receipt?.nav?.templates ?? "Templates", href: `/${lang}/finance/receipt/templates`, comingSoon: true },
    { name: finance?.receipt?.nav?.managePlan ?? "Manage Plans", href: `/${lang}/finance/receipt/manage-plan` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={finance?.receipt?.title ?? "Receipts"} />
      <PageNav pages={receiptPages} comingSoonLabel={finance?.comingSoonLabel ?? "Soon"} />
      {children}
    </div>
  )
}
