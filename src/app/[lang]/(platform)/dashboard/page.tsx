import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization"
import { AdminDashboardClient } from "@/components/platform/dashboard/admin-client"
import DemurrageAlerts from "@/components/platform/dashboard/demurrage-alerts"
import CompliancePanel from "@/components/platform/dashboard/compliance-panel"
import TodayCockpit from "@/components/platform/dashboard/today-cockpit"
import {
  getQuickLookData,
  getUpcomingData,
  getFinancialChartData,
  getCashFlowData,
  getExpenseCategories,
  getTrendingStatsData,
  getRecentTransactions,
} from "@/components/platform/dashboard/actions"
import { getWeatherData } from "@/components/platform/dashboard/weather-actions"

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang: langParam } = await params
  const lang = langParam as Locale
  const dict = await getDictionary(lang)

  // `getUpcomingData` resolves the role from the session itself — we don't
  // pass it in. Trusting the client to declare its role was an IDOR.
  const [
    quickLookData,
    upcomingData,
    financialData,
    cashFlowData,
    expenseCategories,
    trendingStats,
    weatherData,
    recentTransactions,
  ] = await Promise.all([
    getQuickLookData(),
    getUpcomingData(),
    getFinancialChartData(),
    getCashFlowData(),
    getExpenseCategories(),
    getTrendingStatsData(),
    getWeatherData(),
    getRecentTransactions(8),
  ])

  return (
    <>
      <TodayCockpit locale={lang} />
      <div className="grid gap-4 md:grid-cols-2">
        <DemurrageAlerts locale={lang} />
        <CompliancePanel locale={lang} />
      </div>
      <AdminDashboardClient
        dictionary={dict}
        locale={lang}
        quickLookData={quickLookData}
        upcomingData={upcomingData}
        financialData={financialData}
        cashFlowData={cashFlowData}
        expenseCategories={expenseCategories}
        trendingStats={trendingStats}
        weatherData={weatherData}
        recentTransactions={recentTransactions}
      />
    </>
  )
}
