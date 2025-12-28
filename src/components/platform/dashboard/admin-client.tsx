"use client"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { QuickActions } from "./quick-actions"
import { Upcoming } from "./upcoming"
import { Weather } from "./weather"
import { QuickLook } from "./quick-look"
import { FinanceOverview } from "./finance-overview"
import type {
  QuickLookData,
  UpcomingData,
  FinancialChartData,
  CashFlowData,
  ExpenseCategory,
  TrendingStatsData,
} from "./actions"
import type { Dictionary, Locale } from "@/components/internationalization"
import type { WeatherData } from "./weather"

/**
 * AdminDashboardClient - Hogwarts Edition
 * Elegant admin dashboard with magical styling
 *
 * Layout:
 * 1. Section 1: Upcoming + Weather (side by side)
 * 2. Section 2: Quick Look (4 stat cards)
 * 3. Section 3: Quick Actions (4 action buttons)
 * 4. Section 4: Finance Overview (charts)
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
  weatherData?: WeatherData | null
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
  weatherData,
}: AdminDashboardClientProps) {
  return (
    <div className="flex flex-col gap-6 py-4 md:py-6">
      {/* ============================================
          SECTION 1: Upcoming + Weather
          Two elegant cards side by side
          ============================================ */}
      <section className="px-4 lg:px-6">
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Upcoming Card - Takes 2 columns */}
          <div className="lg:col-span-2 min-h-[280px]">
            <Upcoming data={upcomingData} locale={locale} />
          </div>

          {/* Weather Card */}
          <Card
            className={cn(
              "min-h-[280px]",
              "bg-gradient-to-br from-sky-50/80 via-blue-50/60 to-indigo-50/40",
              "dark:from-slate-900/80 dark:via-blue-950/60 dark:to-indigo-950/40",
              "border border-blue-200/50 dark:border-blue-900/40",
              "shadow-sm transition-all duration-500",
              "hover:shadow-lg hover:shadow-blue-500/10 dark:hover:shadow-blue-500/5"
            )}
          >
            <CardContent className="p-5">
              <Weather
                current={weatherData?.current}
                forecast={weatherData?.forecast}
                location={weatherData?.location}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ============================================
          SECTION 2: Quick Look
          4 elegant stat cards with house colors
          ============================================ */}
      <section className="px-4 lg:px-6">
        <QuickLook stats={trendingStats} />
      </section>

      {/* ============================================
          SECTION 3: Quick Actions
          4 action buttons with magical styling
          ============================================ */}
      <section className="px-4 lg:px-6">
        <QuickActions dictionary={dictionary} locale={locale} />
      </section>

      {/* ============================================
          SECTION 4: Finance Overview
          Revenue, Cash Flow, and Expense charts
          ============================================ */}
      <section className="px-4 lg:px-6">
        <FinanceOverview
          financialData={financialData}
          cashFlowData={cashFlowData}
          expenseCategories={expenseCategories}
        />
      </section>
    </div>
  )
}
