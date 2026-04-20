/**
 * Receipt Detail Page
 * Follows Hogwarts page pattern - server component that fetches single receipt
 */

import { notFound } from "next/navigation"

import { getReceiptById } from "@/components/platform/finance/receipt/actions"
import { ReceiptDetail } from "@/components/platform/finance/receipt/receipt-detail"
import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization"

export const metadata = {
  title: "Receipt Details | Expense Tracker",
}

interface Props {
  params: Promise<{ id: string; lang: string }>
}

export default async function ReceiptDetailPage({ params }: Props) {
  const { id, lang } = await params
  const locale = lang as Locale
  const dict = await getDictionary(locale)

  // Fetch receipt on the server
  const result = await getReceiptById(id)

  if (!result.success || !result.data) {
    notFound()
  }

  return (
    <div className="py-8">
      <ReceiptDetail receipt={result.data} locale={locale} dict={dict} />
    </div>
  )
}
