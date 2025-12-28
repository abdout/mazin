"use client"

/**
 * Transaction History Content - Stubbed Implementation
 */

import type { Locale } from "@/components/internationalization/config"

interface TransactionHistoryContentProps {
  user: {
    id?: string
    name?: string | null
    email?: string | null
  }
  searchParams: { page?: string; accountId?: string }
  dictionary?: unknown
  lang: Locale
}

export function TransactionHistoryContent({ lang }: TransactionHistoryContentProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">
          {lang === "ar" ? "سجل المعاملات" : "Transaction History"}
        </h2>
        <p className="text-muted-foreground">
          {lang === "ar"
            ? "لا توجد معاملات لعرضها. قم بربط حساب بنكي لمزامنة المعاملات."
            : "No transactions to display. Link a bank account to sync transactions."}
        </p>
        <div className="mt-6 rounded-lg border">
          <div className="p-4 text-center text-muted-foreground">
            {lang === "ar" ? "لا توجد معاملات" : "No transactions"}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TransactionHistoryContent
