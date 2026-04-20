import React from "react"
import Link from "next/link"
import { Icon } from "@iconify/react"
import { getDemurrageAlerts } from "./actions"
import type { Locale } from "@/components/internationalization"

interface DemurrageAlertsProps {
  locale: Locale
}

export default async function DemurrageAlerts({ locale }: DemurrageAlertsProps) {
  const alerts = await getDemurrageAlerts()
  const isArabic = locale === "ar"

  if (alerts.length === 0) return null

  return (
    <div className="border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon
          icon="mdi:alert-circle"
          width={20}
          className="text-red-500"
        />
        <h3 className="font-semibold">
          {isArabic ? "تنبيهات الأرضيات" : "Demurrage Alerts"}
        </h3>
        <span className="ms-auto text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400">
          {alerts.length}
        </span>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => (
          <Link
            key={alert.id}
            href={`/${locale}/project/${alert.projectId}/containers`}
            className="block p-3 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">
                  {alert.containerNumber}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {alert.shipmentNumber}
                </p>
              </div>
              <span
                className={`shrink-0 text-xs px-2 py-0.5 rounded-full border ${
                  alert.status === "DEMURRAGE"
                    ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900"
                    : "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900"
                }`}
              >
                {alert.status === "DEMURRAGE"
                  ? isArabic
                    ? "أرضيات"
                    : "Demurrage"
                  : isArabic
                    ? "تحذير"
                    : "Warning"}
              </span>
            </div>

            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
              {alert.daysRemaining < 0 ? (
                <span className="text-red-600 dark:text-red-400 font-medium">
                  {isArabic
                    ? `متأخر ${Math.abs(alert.daysRemaining)} يوم`
                    : `${Math.abs(alert.daysRemaining)}d overdue`}
                </span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400">
                  {isArabic
                    ? `${alert.daysRemaining} يوم متبقي`
                    : `${alert.daysRemaining}d left`}
                </span>
              )}
              {alert.accruedAmount > 0 && (
                <span className="text-red-600 dark:text-red-400 font-medium">
                  {alert.accruedAmount.toLocaleString()} {alert.currency}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
