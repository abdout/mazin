"use client"

/**
 * Payment Transfer Content - Stubbed Implementation
 */

import type { Locale } from "@/components/internationalization/config"

interface PaymentTransferContentProps {
  user: {
    id?: string
    name?: string | null
    email?: string | null
  }
  dictionary?: unknown
  lang: Locale
}

export default function PaymentTransferContent({ lang }: PaymentTransferContentProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">
          {lang === "ar" ? "تحويل الأموال" : "Payment Transfer"}
        </h2>
        <p className="text-muted-foreground">
          {lang === "ar"
            ? "يتطلب تحويل الأموال ربط حساب بنكي أولاً."
            : "Payment transfer requires linking a bank account first."}
        </p>
        <div className="mt-6 rounded-lg border-2 border-dashed p-8 text-center">
          <p className="text-muted-foreground">
            {lang === "ar"
              ? "لا توجد حسابات بنكية مرتبطة"
              : "No bank accounts linked"}
          </p>
        </div>
      </div>
    </div>
  )
}
