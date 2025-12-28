"use client"

/**
 * My Banks Content - Stubbed Implementation
 */

import type { Locale } from "@/components/internationalization/config"

interface MyBanksContentProps {
  user: {
    id?: string
    name?: string | null
    email?: string | null
  }
  dictionary?: unknown
  lang: Locale
}

export default function MyBanksContent({ user, lang }: MyBanksContentProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">
          {lang === "ar" ? "حساباتي البنكية" : "My Banks"}
        </h2>
        <p className="text-muted-foreground">
          {lang === "ar"
            ? "لم يتم ربط أي حسابات بنكية بعد. قم بربط حسابك البنكي لبدء إدارة معاملاتك."
            : "No bank accounts linked yet. Link your bank account to start managing your transactions."}
        </p>
        <div className="mt-6 flex justify-center">
          <button
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            disabled
          >
            {lang === "ar" ? "ربط حساب بنكي" : "Link Bank Account"}
          </button>
        </div>
        <p className="mt-4 text-xs text-center text-muted-foreground">
          {lang === "ar"
            ? "يتطلب ربط البنوك إعداد Plaid API"
            : "Bank linking requires Plaid API setup"}
        </p>
      </div>
    </div>
  )
}
