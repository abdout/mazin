"use client"

/**
 * Salary Content - Stubbed Implementation
 */

import Link from "next/link"
import {
  Award,
  BarChart,
  Calculator,
  DollarSign,
  FileText,
  Settings,
  TrendingUp,
  Users,
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

export default function SalaryContent({ lang }: Props) {
  const isRTL = lang === "ar"

  // Stub data
  const activeStructuresCount = 0
  const totalStaffCount = 0
  const averageSalary = 0
  const totalMonthlySalary = 0
  const allowancesCount = 0
  const deductionsCount = 0

  return (
    <div className="space-y-6">
      {/* Financial Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isRTL ? "الرواتب الشهرية" : "Monthly Payroll"}
            </CardTitle>
            <DollarSign className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(totalMonthlySalary / 100).toLocaleString()}
            </div>
            <p className="text-muted-foreground text-xs">
              {isRTL ? "إجمالي الراتب الأساسي" : "Total basic salary"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isRTL ? "الموظفون النشطون" : "Active Staff"}
            </CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeStructuresCount}</div>
            <p className="text-muted-foreground text-xs">
              {isRTL ? "مع هياكل الرواتب" : "With salary structures"} / {totalStaffCount}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isRTL ? "متوسط الراتب" : "Average Salary"}
            </CardTitle>
            <TrendingUp className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(averageSalary / 100).toLocaleString()}
            </div>
            <p className="text-muted-foreground text-xs">
              {isRTL ? "لكل موظف" : "Per staff member"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isRTL ? "المكونات" : "Components"}
            </CardTitle>
            <Settings className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allowancesCount + deductionsCount}
            </div>
            <p className="text-muted-foreground text-xs">
              {allowancesCount} {isRTL ? "بدلات" : "allowances"}, {deductionsCount} {isRTL ? "خصومات" : "deductions"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Feature Sections */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Salary Structures */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {isRTL ? "هياكل الرواتب" : "Salary Structures"}
            </CardTitle>
            <CardDescription>
              {isRTL ? "تحديد وإدارة هياكل رواتب الموظفين" : "Define and manage staff salary structures"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href={`/${lang}/finance/salary/structures`}>
                {isRTL ? "عرض الهياكل" : "View Structures"} ({activeStructuresCount})
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full" size="sm">
              <Link href={`/${lang}/finance/salary/structures/new`}>
                {isRTL ? "إنشاء هيكل" : "Create Structure"}
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Allowances */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              {isRTL ? "البدلات" : "Allowances"}
            </CardTitle>
            <CardDescription>
              {isRTL ? "إدارة بدلات الرواتب والمكافآت" : "Manage salary allowances and bonuses"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href={`/${lang}/finance/salary/allowances`}>
                {isRTL ? "عرض البدلات" : "View Allowances"} ({allowancesCount})
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Deductions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {isRTL ? "الخصومات" : "Deductions"}
            </CardTitle>
            <CardDescription>
              {isRTL ? "إدارة خصومات الرواتب والمساهمات" : "Manage salary deductions and contributions"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href={`/${lang}/finance/salary/deductions`}>
                {isRTL ? "عرض الخصومات" : "View Deductions"} ({deductionsCount})
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Salary Calculator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              {isRTL ? "حاسبة الراتب" : "Salary Calculator"}
            </CardTitle>
            <CardDescription>
              {isRTL ? "حساب صافي الراتب مع المكونات" : "Calculate net salary with components"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href={`/${lang}/finance/salary/calculator`}>
                <Calculator className="mr-2 h-4 w-4" />
                {isRTL ? "فتح الحاسبة" : "Open Calculator"}
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Salary Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              {isRTL ? "تقارير الرواتب" : "Salary Reports"}
            </CardTitle>
            <CardDescription>
              {isRTL ? "إنشاء تحليل وتقارير الرواتب" : "Generate salary analysis and reports"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href={`/${lang}/finance/salary/reports`}>
                {isRTL ? "عرض التقارير" : "View Reports"}
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Bulk Operations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {isRTL ? "العمليات الجماعية" : "Bulk Operations"}
            </CardTitle>
            <CardDescription>
              {isRTL ? "تطبيق تغييرات الراتب على عدة موظفين" : "Apply salary changes to multiple staff"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href={`/${lang}/finance/salary/bulk/increment`}>
                {isRTL ? "زيادة جماعية" : "Bulk Increment"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
