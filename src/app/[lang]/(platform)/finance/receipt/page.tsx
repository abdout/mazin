import type { Locale } from "@/components/internationalization"
import { getReceipts } from "@/components/platform/finance/receipt/actions"
import { ReceiptsContent } from "@/components/platform/finance/receipt/content"

export const metadata = {
  title: "Receipts | Mazin",
  description:
    "Manage and track expense receipts with AI-powered extraction",
}

export default async function ReceiptsPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const locale = (lang === "en" ? "en" : "ar") as Locale

  const result = await getReceipts({ limit: 50 })
  const initialReceipts =
    result.success && result.data ? result.data.receipts : []

  return (
    <div className="py-8">
      <ReceiptsContent initialReceipts={initialReceipts} locale={locale} />
    </div>
  )
}
