"use client"

/**
 * Fees Content - Stubbed Implementation
 */

import Link from "next/link"
import {
  Award,
  CircleAlert,
  CreditCard,
  DollarSign,
  TrendingUp,
  TriangleAlert,
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

export default function FeesContent({ lang }: Props) {
  const isRTL = lang === "ar"

  // Stub data
  const feeStructuresCount = 0
  const totalFeesCollected = 0
  const pendingPayments = 0
  const overduePayments = 0
  const scholarshipsCount = 0
  const finesCount = 0
  const activeAssignmentsCount = 0

  return (
    <div className="space-y-6">
      {/* Financial Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isRTL ? "الرسوم المحصلة" : "Fees Collected"}
            </CardTitle>
            <DollarSign className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(totalFeesCollected / 100).toLocaleString()}
            </div>
            <p className="text-muted-foreground text-xs">
              {isRTL ? "المدفوعات المكتملة" : "Completed payments"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isRTL ? "المدفوعات المعلقة" : "Pending Payments"}
            </CardTitle>
            <CircleAlert className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(pendingPayments / 100).toLocaleString()}
            </div>
            <p className="text-muted-foreground text-xs">
              {activeAssignmentsCount} {isRTL ? "تخصيصات" : "assignments"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isRTL ? "المدفوعات المتأخرة" : "Overdue Payments"}
            </CardTitle>
            <TriangleAlert className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(overduePayments / 100).toLocaleString()}
            </div>
            <p className="text-muted-foreground text-xs">
              {isRTL ? "يتطلب إجراء" : "Requires action"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isRTL ? "المنح النشطة" : "Active Scholarships"}
            </CardTitle>
            <Award className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scholarshipsCount}</div>
            <p className="text-muted-foreground text-xs">
              {isRTL ? "البرامج المتاحة" : "Available programs"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Fee Structures */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {isRTL ? "هياكل الرسوم" : "Fee Structures"}
            </CardTitle>
            <CardDescription>
              {isRTL ? "تحديد وإدارة أنواع ومبالغ الرسوم" : "Define and manage fee types and amounts"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href={`/${lang}/finance/fees/structures`}>
                {isRTL ? "عرض الهياكل" : "View Structures"} ({feeStructuresCount})
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full" size="sm">
              <Link href={`/${lang}/finance/fees/structures/new`}>
                {isRTL ? "إنشاء هيكل جديد" : "Create New Structure"}
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Payment Tracking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {isRTL ? "تتبع المدفوعات" : "Payment Tracking"}
            </CardTitle>
            <CardDescription>
              {isRTL ? "تسجيل وتتبع مدفوعات الرسوم" : "Record and track fee payments"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href={`/${lang}/finance/fees/payments`}>
                {isRTL ? "عرض المدفوعات" : "View Payments"}
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full" size="sm">
              <Link href={`/${lang}/finance/fees/payments/record`}>
                {isRTL ? "تسجيل دفعة" : "Record Payment"}
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {isRTL ? "تخصيص الرسوم" : "Fee Assignments"}
            </CardTitle>
            <CardDescription>
              {isRTL ? "تخصيص الرسوم وتتبع الحالة" : "Assign fees and track status"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href={`/${lang}/finance/fees/assignments`}>
                {isRTL ? "عرض التخصيصات" : "View Assignments"}
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Scholarships */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              {isRTL ? "المنح" : "Scholarships"}
            </CardTitle>
            <CardDescription>
              {isRTL ? "إدارة برامج المنح والطلبات" : "Manage scholarship programs and applications"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href={`/${lang}/finance/fees/scholarships`}>
                {isRTL ? "عرض المنح" : "View Scholarships"} ({scholarshipsCount})
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Fines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TriangleAlert className="h-5 w-5" />
              {isRTL ? "الغرامات والعقوبات" : "Fines & Penalties"}
            </CardTitle>
            <CardDescription>
              {isRTL ? "تتبع وإدارة الغرامات والعقوبات" : "Track and manage fines and penalties"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href={`/${lang}/finance/fees/fines`}>
                {isRTL ? "عرض الغرامات" : "View Fines"} ({finesCount})
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {isRTL ? "تقارير الرسوم" : "Fee Reports"}
            </CardTitle>
            <CardDescription>
              {isRTL ? "إنشاء تقارير جمع وتحليل الرسوم" : "Generate fee collection and analysis reports"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href={`/${lang}/finance/fees/reports`}>
                {isRTL ? "عرض التقارير" : "View Reports"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
