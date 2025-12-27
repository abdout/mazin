import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization"
import { auth } from "@/auth"
import { AdminDashboardClient } from "@/components/platform/dashboard/admin-client"
import { getQuickLookData, getUpcomingData } from "@/components/platform/dashboard/actions"
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

  // Fetch data using server actions
  const [quickLookData, upcomingData] = await Promise.all([
    getQuickLookData(),
    getUpcomingData(userRole),
  ])

  return (
    <AdminDashboardClient
      dictionary={dict}
      locale={lang}
      quickLookData={quickLookData}
      upcomingData={upcomingData}
    />
  )
}
