"use client"

/**
 * Payroll Content - Stubbed Implementation
 */

import Link from "next/link"
import {
  Calendar,
  CircleAlert,
  CircleCheck,
  Clock,
  DollarSign,
  FileText,
  Settings,
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

import {
  DashboardGrid,
  FeatureCard,
  formatCurrency,
  StatsCard,
} from "../lib/dashboard-components"

interface Props {
  dictionary?: unknown
  lang: Locale
}

export default function PayrollContent({ lang }: Props) {
  const isRTL = lang === "ar"

  // Stub data
  const totalRunsCount = 0
  const pendingRunsCount = 0
  const completedRunsCount = 0
  const totalSlipsCount = 0
  const pendingSlipsCount = 0
  const paidSlipsCount = 0
  const monthlyPayroll = 0

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <DashboardGrid type="stats">
        <StatsCard
          title={isRTL ? "رواتب الشهر الحالي" : "Current Month Payroll"}
          value={formatCurrency(monthlyPayroll)}
          description={isRTL ? "إجمالي الرواتب الصافية" : "Total net salaries"}
          icon={DollarSign}
        />
        <StatsCard
          title={isRTL ? "دفعات الرواتب" : "Payroll Runs"}
          value={totalRunsCount}
          description={`${completedRunsCount} ${isRTL ? "مكتملة" : "completed"}`}
          icon={Calendar}
        />
        <StatsCard
          title={isRTL ? "في انتظار الموافقة" : "Pending Approval"}
          value={pendingRunsCount}
          description={`${pendingSlipsCount} ${isRTL ? "قسائم" : "slips"}`}
          icon={CircleAlert}
        />
        <StatsCard
          title={isRTL ? "المدفوع" : "Paid Out"}
          value={paidSlipsCount}
          description={`${isRTL ? "قسائم الرواتب" : "Salary slips"} / ${totalSlipsCount}`}
          icon={CircleCheck}
        />
      </DashboardGrid>

      {/* Feature Cards Grid */}
      <DashboardGrid type="features">
        <FeatureCard
          title={isRTL ? "دفعات الرواتب" : "Payroll Runs"}
          description={isRTL ? "إنشاء وإدارة دفعات معالجة الرواتب" : "Create and manage payroll processing runs"}
          icon={Calendar}
          isPrimary
          primaryAction={{
            label: isRTL ? "عرض الدفعات" : "View Runs",
            href: `/${lang}/finance/payroll/runs`,
            count: totalRunsCount,
          }}
          secondaryAction={{
            label: isRTL ? "إنشاء دفعة جديدة" : "Create New Run",
            href: `/${lang}/finance/payroll/runs/new`,
          }}
        />
        <FeatureCard
          title={isRTL ? "قسائم الرواتب" : "Salary Slips"}
          description={isRTL ? "عرض وإدارة قسائم الرواتب الفردية" : "View and manage individual salary slips"}
          icon={FileText}
          primaryAction={{
            label: isRTL ? "عرض القسائم" : "View Slips",
            href: `/${lang}/finance/payroll/slips`,
            count: totalSlipsCount,
          }}
          secondaryAction={{
            label: `${isRTL ? "مراجعة المعلقة" : "Review Pending"} (${pendingSlipsCount})`,
            href: `/${lang}/finance/payroll/slips/pending`,
          }}
        />
        <FeatureCard
          title={isRTL ? "معالجة الرواتب" : "Process Payroll"}
          description={isRTL ? "بدء معالجة الرواتب للفترة الحالية" : "Start new payroll processing for current period"}
          icon={Users}
          primaryAction={{
            label: isRTL ? "معالجة الرواتب" : "Process Payroll",
            href: `/${lang}/finance/payroll/process`,
          }}
        />
        <FeatureCard
          title={isRTL ? "قائمة الموافقات" : "Approval Queue"}
          description={isRTL ? "مراجعة والموافقة على دفعات الرواتب المعلقة" : "Review and approve pending payroll runs"}
          icon={CircleCheck}
          primaryAction={{
            label: `${isRTL ? "قائمة الموافقات" : "Approval Queue"} (${pendingRunsCount})`,
            href: `/${lang}/finance/payroll/approval`,
          }}
        />
        <FeatureCard
          title={isRTL ? "الصرف" : "Disbursement"}
          description={isRTL ? "معالجة مدفوعات الرواتب والصرف" : "Process salary payments and disbursements"}
          icon={DollarSign}
          primaryAction={{
            label: isRTL ? "صرف الرواتب" : "Disburse Salaries",
            href: `/${lang}/finance/payroll/disbursement`,
          }}
        />
        <FeatureCard
          title={isRTL ? "إعدادات الرواتب" : "Payroll Settings"}
          description={isRTL ? "تكوين معدلات الضرائب والخصومات والقواعد" : "Configure tax rates, deductions, and rules"}
          icon={Settings}
          primaryAction={{
            label: isRTL ? "إعدادات الرواتب" : "Payroll Settings",
            href: `/${lang}/finance/payroll/settings`,
          }}
        />
      </DashboardGrid>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{isRTL ? "إجراءات سريعة" : "Quick Actions"}</CardTitle>
          <CardDescription>
            {isRTL ? "العمليات الشائعة للرواتب" : "Common payroll operations"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${lang}/finance/payroll/process/current-month`}>
              <Clock className="mr-2 h-4 w-4" />
              {isRTL ? "معالجة الشهر الحالي" : "Process Current Month"}
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${lang}/finance/payroll/slips/generate`}>
              <FileText className="mr-2 h-4 w-4" />
              {isRTL ? "إنشاء القسائم" : "Generate Slips"}
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${lang}/finance/payroll/reports/summary`}>
              {isRTL ? "ملخص الرواتب" : "Payroll Summary"}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
