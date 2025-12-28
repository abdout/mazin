"use client"

/**
 * Budget Content - Stubbed Implementation
 */

import {
  BarChart,
  CircleCheck,
  DollarSign,
  PieChart,
  TrendingUp,
  TriangleAlert,
} from "lucide-react"

import type { Locale } from "@/components/internationalization/config"

import {
  DashboardGrid,
  FeatureCard,
  formatCurrency,
  formatPercentage,
  StatsCard,
} from "../lib/dashboard-components"

interface Props {
  dictionary?: unknown
  lang: Locale
}

export default function BudgetContent({ lang }: Props) {
  const isRTL = lang === "ar"

  // Stub data
  const budgetsCount = 0
  const allocationsCount = 0
  const totalBudget = 0
  const totalSpent = 0
  const variance = totalBudget - totalSpent
  const utilizationRate = 0

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <DashboardGrid type="stats">
        <StatsCard
          title={isRTL ? "إجمالي الميزانية" : "Total Budget"}
          value={formatCurrency(totalBudget)}
          description={isRTL ? "الميزانية المخصصة" : "Allocated budget"}
          icon={DollarSign}
        />
        <StatsCard
          title={isRTL ? "المصروف" : "Spent"}
          value={formatCurrency(totalSpent)}
          description={`${formatPercentage(utilizationRate)} ${isRTL ? "الاستخدام" : "utilization"}`}
          icon={TrendingUp}
        />
        <StatsCard
          title={isRTL ? "المتبقي" : "Remaining"}
          value={formatCurrency(variance)}
          description={isRTL ? "الميزانية المتاحة" : "Available budget"}
          icon={CircleCheck}
        />
        <StatsCard
          title={isRTL ? "التخصيصات" : "Allocations"}
          value={allocationsCount}
          description={`${budgetsCount} ${isRTL ? "ميزانيات نشطة" : "active budgets"}`}
          icon={PieChart}
        />
      </DashboardGrid>

      {/* Feature Cards Grid */}
      <DashboardGrid type="features">
        <FeatureCard
          title={isRTL ? "الميزانيات" : "Budgets"}
          description={isRTL ? "إنشاء وإدارة الميزانيات" : "Create and manage budgets"}
          icon={PieChart}
          isPrimary
          primaryAction={{
            label: isRTL ? "عرض الميزانيات" : "View Budgets",
            href: `/${lang}/finance/budget/all`,
            count: budgetsCount,
          }}
          secondaryAction={{
            label: isRTL ? "إنشاء ميزانية" : "Create Budget",
            href: `/${lang}/finance/budget/new`,
          }}
        />
        <FeatureCard
          title={isRTL ? "تخصيصات الميزانية" : "Budget Allocations"}
          description={isRTL ? "تخصيص الميزانية حسب القسم أو الفئة" : "Allocate budget by department or category"}
          icon={DollarSign}
          primaryAction={{
            label: isRTL ? "عرض التخصيصات" : "View Allocations",
            href: `/${lang}/finance/budget/allocations`,
          }}
          secondaryAction={{
            label: isRTL ? "تخصيص الأموال" : "Allocate Funds",
            href: `/${lang}/finance/budget/allocations/new`,
          }}
        />
        <FeatureCard
          title={isRTL ? "تتبع الإنفاق" : "Spending Tracking"}
          description={isRTL ? "مراقبة استخدام الميزانية والإنفاق" : "Monitor budget utilization and spending"}
          icon={TrendingUp}
          primaryAction={{
            label: isRTL ? "تتبع الإنفاق" : "Track Spending",
            href: `/${lang}/finance/budget/tracking`,
          }}
        />
        <FeatureCard
          title={isRTL ? "تحليل التباين" : "Variance Analysis"}
          description={isRTL ? "تحليل الميزانية مقابل الإنفاق الفعلي" : "Analyze budget vs actual spending"}
          icon={TriangleAlert}
          primaryAction={{
            label: isRTL ? "تقرير التباين" : "Variance Report",
            href: `/${lang}/finance/budget/variance`,
          }}
        />
        <FeatureCard
          title={isRTL ? "تقارير الميزانية" : "Budget Reports"}
          description={isRTL ? "إنشاء تقارير تحليل الميزانية" : "Generate budget analysis reports"}
          icon={BarChart}
          primaryAction={{
            label: isRTL ? "عرض التقارير" : "View Reports",
            href: `/${lang}/finance/budget/reports`,
          }}
        />
        <FeatureCard
          title={isRTL ? "موافقة الميزانية" : "Budget Approval"}
          description={isRTL ? "مراجعة والموافقة على طلبات الميزانية" : "Review and approve budget requests"}
          icon={CircleCheck}
          primaryAction={{
            label: isRTL ? "في انتظار الموافقة" : "Pending Approval",
            href: `/${lang}/finance/budget/approval`,
          }}
        />
      </DashboardGrid>
    </div>
  )
}
