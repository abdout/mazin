"use client"

/**
 * Expenses Content - Stubbed Implementation
 */

import {
  CircleAlert,
  CircleCheck,
  DollarSign,
  FolderOpen,
  Receipt,
  TrendingUp,
} from "lucide-react"

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

export default function ExpensesContent({ lang }: Props) {
  const isRTL = lang === "ar"

  // Stub data
  const categoriesCount = 0
  const expensesCount = 0
  const pendingExpensesCount = 0
  const totalExpenses = 0

  return (
    <div className="space-y-6">
      <DashboardGrid type="stats">
        <StatsCard
          title={isRTL ? "إجمالي المصروفات" : "Total Expenses"}
          value={formatCurrency(totalExpenses)}
          description={isRTL ? "المصروفات المعتمدة" : "Approved expenses"}
          icon={DollarSign}
        />
        <StatsCard
          title={isRTL ? "في الانتظار" : "Pending"}
          value={pendingExpensesCount}
          description={isRTL ? "في انتظار الموافقة" : "Awaiting approval"}
          icon={CircleAlert}
        />
        <StatsCard
          title={isRTL ? "جميع المصروفات" : "All Expenses"}
          value={expensesCount}
          description={isRTL ? "إجمالي المقدم" : "Total submitted"}
          icon={Receipt}
        />
        <StatsCard
          title={isRTL ? "الفئات" : "Categories"}
          value={categoriesCount}
          description={isRTL ? "أنواع المصروفات" : "Expense types"}
          icon={FolderOpen}
        />
      </DashboardGrid>

      <DashboardGrid type="features">
        <FeatureCard
          title={isRTL ? "جميع المصروفات" : "All Expenses"}
          description={isRTL ? "عرض وإدارة طلبات المصروفات" : "View and manage expense submissions"}
          icon={Receipt}
          isPrimary
          primaryAction={{
            label: isRTL ? "عرض المصروفات" : "View Expenses",
            href: `/${lang}/finance/expenses/all`,
            count: expensesCount,
          }}
          secondaryAction={{
            label: isRTL ? "تقديم مصروف" : "Submit Expense",
            href: `/${lang}/finance/expenses/new`,
          }}
        />
        <FeatureCard
          title={isRTL ? "سير عمل الموافقة" : "Approval Workflow"}
          description={isRTL ? "مراجعة والموافقة على طلبات المصروفات" : "Review and approve expense requests"}
          icon={CircleCheck}
          primaryAction={{
            label: isRTL ? "في انتظار الموافقة" : "Pending Approval",
            href: `/${lang}/finance/expenses/approval`,
            count: pendingExpensesCount,
          }}
        />
        <FeatureCard
          title={isRTL ? "فئات المصروفات" : "Expense Categories"}
          description={isRTL ? "إدارة فئات وأنواع المصروفات" : "Manage expense categories and types"}
          icon={FolderOpen}
          primaryAction={{
            label: isRTL ? "عرض الفئات" : "View Categories",
            href: `/${lang}/finance/expenses/categories`,
          }}
        />
        <FeatureCard
          title={isRTL ? "تقارير المصروفات" : "Expense Reports"}
          description={isRTL ? "إنشاء تقارير تحليل المصروفات" : "Generate expense analysis reports"}
          icon={TrendingUp}
          primaryAction={{
            label: isRTL ? "عرض التقارير" : "View Reports",
            href: `/${lang}/finance/expenses/reports`,
          }}
        />
      </DashboardGrid>
    </div>
  )
}
