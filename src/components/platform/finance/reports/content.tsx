"use client"

/**
 * Reports Content - Stubbed Implementation
 */

import Link from "next/link"
import {
  BarChart,
  Calendar,
  Download,
  FileBarChart,
  PieChart,
  TrendingUp,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"

interface Props {
  dictionary?: unknown
  lang: Locale
}

export default function ReportsContent({ lang }: Props) {
  const isRTL = lang === "ar"

  // Stub data
  const reportsCount = 0
  const generatedReportsCount = 0

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isRTL ? "التقارير المولدة" : "Generated Reports"}
            </CardTitle>
            <FileBarChart className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{generatedReportsCount}</div>
            <p className="text-muted-foreground text-xs">
              {reportsCount} {isRTL ? "إجمالي" : "total"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isRTL ? "أنواع التقارير" : "Report Types"}
            </CardTitle>
            <BarChart className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-muted-foreground text-xs">
              {isRTL ? "التقارير المتاحة" : "Available reports"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isRTL ? "المجدولة" : "Scheduled"}
            </CardTitle>
            <Calendar className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-muted-foreground text-xs">
              {isRTL ? "التقارير الآلية" : "Automated reports"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isRTL ? "التصدير" : "Exports"}
            </CardTitle>
            <Download className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-muted-foreground text-xs">PDF, Excel, CSV</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="text-primary h-5 w-5" />
              {isRTL ? "بيان الأرباح والخسائر" : "Profit & Loss Statement"}
            </CardTitle>
            <CardDescription>
              {isRTL ? "بيان الدخل يوضح الإيرادات والمصروفات" : "Income statement showing revenue and expenses"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href={`/${lang}/finance/reports/profit-loss`}>
                {isRTL ? "إنشاء التقرير" : "Generate Report"}
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full" size="sm">
              <Link href={`/${lang}/finance/reports/profit-loss/history`}>
                {isRTL ? "عرض السجل" : "View History"}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              {isRTL ? "الميزانية العمومية" : "Balance Sheet"}
            </CardTitle>
            <CardDescription>
              {isRTL ? "بيان الأصول والخصوم وحقوق الملكية" : "Assets, liabilities, and equity statement"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href={`/${lang}/finance/reports/balance-sheet`}>
                {isRTL ? "إنشاء التقرير" : "Generate Report"}
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full" size="sm">
              <Link href={`/${lang}/finance/reports/balance-sheet/comparative`}>
                {isRTL ? "مقارنة" : "Comparative"}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {isRTL ? "بيان التدفق النقدي" : "Cash Flow Statement"}
            </CardTitle>
            <CardDescription>
              {isRTL ? "التدفقات النقدية التشغيلية والاستثمارية والتمويلية" : "Operating, investing, and financing cash flows"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href={`/${lang}/finance/reports/cash-flow`}>
                {isRTL ? "إنشاء التقرير" : "Generate Report"}
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full" size="sm">
              <Link href={`/${lang}/finance/reports/cash-flow/projection`}>
                {isRTL ? "التوقعات" : "Projection"}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              {isRTL ? "ميزان المراجعة" : "Trial Balance"}
            </CardTitle>
            <CardDescription>
              {isRTL ? "قائمة جميع الحسابات مع أرصدة المدين والدائن" : "List of all accounts with debit/credit balances"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href={`/${lang}/finance/reports/trial-balance`}>
                {isRTL ? "إنشاء التقرير" : "Generate Report"}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              {isRTL ? "تحليل الإيرادات" : "Revenue Analysis"}
            </CardTitle>
            <CardDescription>
              {isRTL ? "تفصيل مفصل لمصادر الإيرادات" : "Detailed breakdown of revenue sources"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href={`/${lang}/finance/reports/revenue`}>
                {isRTL ? "إنشاء التقرير" : "Generate Report"}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {isRTL ? "تحليل المصروفات" : "Expense Analysis"}
            </CardTitle>
            <CardDescription>
              {isRTL ? "تفصيل مفصل لفئات المصروفات" : "Detailed breakdown of expense categories"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href={`/${lang}/finance/reports/expense`}>
                {isRTL ? "إنشاء التقرير" : "Generate Report"}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {isRTL ? "تقارير مخصصة" : "Custom Reports"}
            </CardTitle>
            <CardDescription>
              {isRTL ? "إنشاء تقارير مالية مخصصة" : "Build custom financial reports"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href={`/${lang}/finance/reports/custom`}>
                {isRTL ? "إنشاء تقرير مخصص" : "Create Custom"}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileBarChart className="h-5 w-5" />
              {isRTL ? "جميع التقارير" : "All Reports"}
            </CardTitle>
            <CardDescription>
              {isRTL ? "عرض وإدارة جميع التقارير المولدة" : "View and manage all generated reports"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href={`/${lang}/finance/reports/all`}>
                {isRTL ? "عرض الكل" : "View All"} ({reportsCount})
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
