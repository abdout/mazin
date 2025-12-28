"use client"

/**
 * Banking Dashboard Content - Stubbed Implementation
 *
 * TODO: This component requires:
 * 1. Prisma schema with BankAccount, Transaction models
 * 2. Plaid API integration
 * 3. Tenant context with companyId
 */

import type { Locale } from "@/components/internationalization/config"

interface BankingDashboardContentProps {
  user: {
    id?: string
    name?: string | null
    email?: string | null
  }
  searchParams: { id?: string; page?: string }
  dictionary?: unknown
  lang: Locale
}

export function BankingDashboardContent({
  user,
  searchParams,
  lang,
}: BankingDashboardContentProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">
          {lang === "ar" ? "لوحة تحكم الخدمات المصرفية" : "Banking Dashboard"}
        </h2>
        <p className="text-muted-foreground">
          {lang === "ar"
            ? "قم بإعداد تكامل الخدمات المصرفية لعرض حساباتك ومعاملاتك."
            : "Set up banking integration to view your accounts and transactions."}
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <h3 className="font-medium">
              {lang === "ar" ? "إجمالي البنوك" : "Total Banks"}
            </h3>
            <p className="text-2xl font-bold">0</p>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="font-medium">
              {lang === "ar" ? "إجمالي الرصيد" : "Total Balance"}
            </h3>
            <p className="text-2xl font-bold">$0.00</p>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="font-medium">
              {lang === "ar" ? "المعاملات الأخيرة" : "Recent Transactions"}
            </h3>
            <p className="text-2xl font-bold">0</p>
          </div>
        </div>
      </div>
      <div className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          {lang === "ar"
            ? "ملاحظة: يتطلب تكامل البنوك إعداد Plaid API. اتصل بالمسؤول لتكوين هذه الميزة."
            : "Note: Banking integration requires Plaid API setup. Contact administrator to configure this feature."}
        </p>
      </div>
    </div>
  )
}

export default BankingDashboardContent
