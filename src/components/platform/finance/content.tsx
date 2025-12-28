"use client"

/**
 * Finance Content - Stubbed Implementation
 *
 * TODO: Replace with actual dashboard components when ready
 */

import Image from "next/image"
import Link from "next/link"
import {
  Anchor,
  ChevronRight,
  CircleAlert,
  DollarSign,
  FileBarChart,
  FileText,
  TrendingUp,
  Users,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"

interface Props {
  dictionary?: unknown
  lang: Locale
}

export default function FinanceContent({ lang }: Props) {
  const isRTL = lang === "ar"

  // Stub data
  const totalRevenue = 0
  const totalExpenses = 0
  const pendingPayments = 0
  const unpaidInvoices = 0
  const invoicesCount = 0
  const clientsWithChargesCount = 0
  const employeesWithSalaryCount = 0
  const pendingPayrollCount = 0
  const reportsCount = 0

  return (
    <div className="space-y-6">
      {/* Overview Stats - Financial Health */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Bank Card with Image */}
        <div className="flex items-center justify-center">
          <Image
            src="/master-card.png"
            alt="Bank Card"
            width={1050}
            height={600}
            className="h-auto w-full max-w-md"
            priority
          />
        </div>

        {/* 2x2 Grid - Key Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">
                {isRTL ? "إجمالي الإيرادات" : "Total Revenue"}
              </CardTitle>
              <TrendingUp className="text-muted-foreground h-3.5 w-3.5" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {Math.floor(totalRevenue / 100).toLocaleString()} SDG
              </div>
              <p className="text-muted-foreground text-xs">
                {isRTL ? "مكتمل" : "Completed"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">
                {isRTL ? "إجمالي المصروفات" : "Total Expenses"}
              </CardTitle>
              <DollarSign className="text-muted-foreground h-3.5 w-3.5" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {Math.floor(totalExpenses / 100).toLocaleString()} SDG
              </div>
              <p className="text-muted-foreground text-xs">
                {isRTL ? "معتمد" : "Approved"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">
                {isRTL ? "مدفوعات معلقة" : "Pending Payments"}
              </CardTitle>
              <CircleAlert className="text-muted-foreground h-3.5 w-3.5" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {Math.floor(pendingPayments / 100).toLocaleString()} SDG
              </div>
              <p className="text-muted-foreground text-xs">
                {isRTL ? "في الانتظار" : "Awaiting"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">
                {isRTL ? "فواتير غير مدفوعة" : "Unpaid Invoices"}
              </CardTitle>
              <FileText className="text-muted-foreground h-3.5 w-3.5" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{unpaidInvoices}</div>
              <p className="text-muted-foreground text-xs">
                {isRTL ? "فواتير" : "Invoices"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts Section Placeholder */}
      <div className="space-y-4">
        <Card className="p-6">
          <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
            <p className="text-muted-foreground">
              {isRTL ? "الرسوم البيانية قادمة قريباً" : "Charts coming soon"}
            </p>
          </div>
        </Card>
      </div>

      {/* Finance Quick Look */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Invoicing */}
        <Card className="p-4">
          <CardContent className="space-y-3 p-0">
            <div className="flex items-center gap-3">
              <div className="bg-primary/15 flex h-10 w-10 items-center justify-center rounded-lg">
                <FileText className="text-primary h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground text-xs">
                  {isRTL ? "الفواتير" : "Invoicing"}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold">{invoicesCount}</p>
                  {unpaidInvoices > 0 && (
                    <span className="bg-destructive/10 text-destructive rounded px-1.5 py-0 text-[10px]">
                      {unpaidInvoices} {isRTL ? "غير مدفوع" : "unpaid"}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Link
              href={`/${lang}/finance/invoice`}
              className="text-primary inline-flex items-center text-xs hover:underline"
            >
              {isRTL ? "عرض الكل" : "View All"}{" "}
              <ChevronRight className="ml-1 h-3 w-3 rtl:mr-1 rtl:rotate-180" />
            </Link>
          </CardContent>
        </Card>

        {/* Service Charges */}
        <Card className="p-4">
          <CardContent className="space-y-3 p-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15">
                <Anchor className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground text-xs">
                  {isRTL ? "رسوم الخدمة" : "Service Charges"}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold">
                    {clientsWithChargesCount}
                  </p>
                  <span className="bg-muted text-muted-foreground rounded px-1.5 py-0 text-[10px]">
                    {isRTL ? "عملاء" : "clients"}
                  </span>
                </div>
              </div>
            </div>
            <Link
              href={`/${lang}/finance/fees`}
              className="text-primary inline-flex items-center text-xs hover:underline"
            >
              {isRTL ? "عرض الرسوم" : "View Charges"}{" "}
              <ChevronRight className="ml-1 h-3 w-3 rtl:mr-1 rtl:rotate-180" />
            </Link>
          </CardContent>
        </Card>

        {/* Payroll */}
        <Card className="p-4">
          <CardContent className="space-y-3 p-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/15">
                <Users className="h-5 w-5 text-orange-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground text-xs">
                  {isRTL ? "الرواتب" : "Payroll"}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold">
                    {employeesWithSalaryCount}
                  </p>
                  {pendingPayrollCount > 0 && (
                    <span className="rounded bg-amber-500/10 px-1.5 py-0 text-[10px] text-amber-600">
                      {pendingPayrollCount} {isRTL ? "معلق" : "pending"}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Link
              href={`/${lang}/finance/payroll`}
              className="text-primary inline-flex items-center text-xs hover:underline"
            >
              {isRTL ? "عرض الرواتب" : "View Payroll"}{" "}
              <ChevronRight className="ml-1 h-3 w-3 rtl:mr-1 rtl:rotate-180" />
            </Link>
          </CardContent>
        </Card>

        {/* Reports */}
        <Card className="p-4">
          <CardContent className="space-y-3 p-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/15">
                <FileBarChart className="h-5 w-5 text-blue-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground text-xs">
                  {isRTL ? "التقارير" : "Reports"}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold">{reportsCount}</p>
                  <span className="bg-muted text-muted-foreground rounded px-1.5 py-0 text-[10px]">
                    {isRTL ? "منشأ" : "generated"}
                  </span>
                </div>
              </div>
            </div>
            <Link
              href={`/${lang}/finance/reports`}
              className="text-primary inline-flex items-center text-xs hover:underline"
            >
              {isRTL ? "عرض التقارير" : "View Reports"}{" "}
              <ChevronRight className="ml-1 h-3 w-3 rtl:mr-1 rtl:rotate-180" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href={`/${lang}/finance/invoice/new`}>
          <Card className="group hover:border-primary/30 cursor-pointer p-4 transition-all duration-300 hover:shadow-md">
            <CardContent className="p-0">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 text-primary group-hover:bg-primary/20 rounded-lg p-2 transition-colors">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {isRTL ? "إنشاء فاتورة" : "Create Invoice"}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {isRTL ? "فوترة العملاء" : "Bill clients"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/${lang}/finance/payroll/process`}>
          <Card className="group hover:border-primary/30 cursor-pointer p-4 transition-all duration-300 hover:shadow-md">
            <CardContent className="p-0">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-orange-500/10 p-2 text-orange-500 transition-colors group-hover:bg-orange-500/20">
                  <Users className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {isRTL ? "معالجة الرواتب" : "Process Payroll"}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {isRTL ? "رواتب شهرية" : "Monthly payroll"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/${lang}/finance/expenses`}>
          <Card className="group hover:border-primary/30 cursor-pointer p-4 transition-all duration-300 hover:shadow-md">
            <CardContent className="p-0">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-500/10 p-2 text-amber-500 transition-colors group-hover:bg-amber-500/20">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {isRTL ? "تتبع المصروفات" : "Track Expenses"}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {isRTL ? "اعتماد وتصنيف" : "Approve & categorize"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/${lang}/finance/reports/generate`}>
          <Card className="group hover:border-primary/30 cursor-pointer p-4 transition-all duration-300 hover:shadow-md">
            <CardContent className="p-0">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-500/10 p-2 text-blue-500 transition-colors group-hover:bg-blue-500/20">
                  <FileBarChart className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {isRTL ? "إنشاء تقرير" : "Generate Report"}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {isRTL ? "أرباح وخسائر، ميزانية" : "P&L, Balance Sheet"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
