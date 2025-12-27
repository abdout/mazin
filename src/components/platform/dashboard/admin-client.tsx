"use client"

import { SectionCards } from "./section-cards"
import { QuickActions } from "./quick-actions"
import { Upcoming } from "./upcoming"
import type { QuickLookData, UpcomingData } from "./actions"
import type { Dictionary, Locale } from "@/components/internationalization"

/**
 * AdminDashboardClient
 * Client-side orchestration component for the dashboard
 * - Receives server-fetched data as props
 * - Renders SectionCards, QuickActions, and Upcoming components
 */

interface AdminDashboardClientProps {
  dictionary: Dictionary
  locale: Locale
  quickLookData: QuickLookData
  upcomingData: UpcomingData
}

export function AdminDashboardClient({
  dictionary,
  locale,
  quickLookData,
  upcomingData,
}: AdminDashboardClientProps) {
  // Transform quickLookData into stats format for SectionCards
  const stats = {
    totalShipments: { value: quickLookData.totalShipments, trend: 12 },
    inTransit: { value: quickLookData.inTransit, trend: 5 },
    pendingCustoms: { value: quickLookData.pendingCustoms, trend: -3 },
    unpaidInvoices: {
      value: `SDG ${quickLookData.unpaidTotal.toLocaleString()}`,
      trend: 8,
    },
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      {/* Stats Cards */}
      <SectionCards dictionary={dictionary} stats={stats} />

      {/* Quick Actions + Upcoming */}
      <div className="flex flex-col gap-4 px-4 lg:flex-row lg:items-start lg:px-6">
        <div className="flex-1">
          <QuickActions dictionary={dictionary} locale={locale} />
        </div>
        <Upcoming data={upcomingData} locale={locale} />
      </div>
    </div>
  )
}
