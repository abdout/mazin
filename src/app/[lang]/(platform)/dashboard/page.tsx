import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization"
import { AdminDashboardClient } from "@/components/platform/dashboard/admin-client"
import DemurrageAlerts from "@/components/platform/dashboard/demurrage-alerts"
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
      <DemurrageAlerts locale={lang} />
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
