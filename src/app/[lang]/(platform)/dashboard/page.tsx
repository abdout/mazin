import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization"
import { auth } from "@/auth"
import { AdminDashboardClient } from "@/components/platform/dashboard/admin-client"
import {
  getQuickLookData,
  getUpcomingData,
  getFinancialChartData,
  getCashFlowData,
  getExpenseCategories,
  getTrendingStatsData,
} from "@/components/platform/dashboard/actions"
import { getWeatherData } from "@/components/platform/dashboard/weather-actions"
import type { UserRole } from "@prisma/client"

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang: langParam } = await params
  const lang = langParam as Locale
  const dict = await getDictionary(lang)
  const session = await auth()

  // Get user role, default to VIEWER
  const userRole = (session?.user?.role as UserRole) || "VIEWER"

  // Fetch all data using server actions in parallel
  const [
    quickLookData,
    upcomingData,
    financialData,
    cashFlowData,
    expenseCategories,
    trendingStats,
    weatherData,
  ] = await Promise.all([
    getQuickLookData(),
    getUpcomingData(userRole),
    getFinancialChartData(),
    getCashFlowData(),
    getExpenseCategories(),
    getTrendingStatsData(),
    getWeatherData(),
  ])

  return (
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
    />
  )
}
