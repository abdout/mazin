"use client"

import { QuickActions } from "./quick-actions"
import { Upcoming } from "./upcoming"
import { RevenueChart, CashFlowChart, ExpenseChart } from "./charts"
import { TrendingStats } from "@/components/platform/shared/stats"
import type {
  QuickLookData,
  UpcomingData,
  FinancialChartData,
  CashFlowData,
  ExpenseCategory,
  TrendingStatsData,
} from "./actions"
import type { Dictionary, Locale } from "@/components/internationalization"
import type { TrendingStatItem } from "@/components/platform/shared/stats"

/**
 * AdminDashboardClient
 * Client-side orchestration component for the dashboard
 * - Receives server-fetched data as props
 * - Renders Upcoming (flip card), QuickActions, TrendingStats, and Charts
 */

interface AdminDashboardClientProps {
  dictionary: Dictionary
  locale: Locale
  quickLookData: QuickLookData
  upcomingData: UpcomingData
  financialData: FinancialChartData
  cashFlowData: CashFlowData
  expenseCategories: ExpenseCategory[]
  trendingStats: TrendingStatsData
}

export function AdminDashboardClient({
  dictionary,
  locale,
  quickLookData,
  upcomingData,
  financialData,
  cashFlowData,
  expenseCategories,
  trendingStats,
}: AdminDashboardClientProps) {
  // Transform trendingStats into TrendingStatItem array
  const trendingItems: TrendingStatItem[] = [
    {
      label: "Total Shipments",
      value: trendingStats.totalShipments.value,
      change: trendingStats.totalShipments.change,
      changeType: trendingStats.totalShipments.changeType,
    },
    {
      label: "Total Revenue",
      value: `SDG ${trendingStats.totalRevenue.value.toLocaleString()}`,
      change: trendingStats.totalRevenue.change,
      changeType: trendingStats.totalRevenue.changeType,
    },
    {
      label: "Pending Declarations",
      value: trendingStats.pendingDeclarations.value,
      change: trendingStats.pendingDeclarations.change,
      changeType: trendingStats.pendingDeclarations.changeType,
    },
    {
      label: "Completion Rate",
      value: `${trendingStats.completionRate.value}%`,
      change: trendingStats.completionRate.change,
      changeType: trendingStats.completionRate.changeType,
    },
  ]

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      {/* 1. Flip Card (full width at top) */}
      <div className="px-4 lg:px-6">
        <Upcoming data={upcomingData} locale={locale} />
      </div>

      {/* 2. Quick Actions */}
      <div className="px-4 lg:px-6">
        <QuickActions dictionary={dictionary} locale={locale} />
      </div>

      {/* 3. Trending Stats (badges variant) */}
      <div className="px-4 lg:px-6">
        <TrendingStats items={trendingItems} variant="badges" />
      </div>

      {/* 4. Charts Grid - Revenue + Cash Flow */}
      <div className="grid gap-4 px-4 lg:grid-cols-2 lg:px-6">
        <RevenueChart
          revenueData={financialData.revenueData}
          expenseData={financialData.expenseData}
          profitData={financialData.profitData}
          labels={financialData.labels}
        />
        <CashFlowChart
          inflowData={cashFlowData.inflowData}
          outflowData={cashFlowData.outflowData}
          balanceData={cashFlowData.balanceData}
        />
      </div>

      {/* 5. Expense Chart (full width) */}
      <div className="px-4 lg:px-6">
        <ExpenseChart expenseCategories={expenseCategories} />
      </div>
    </div>
  )
}
