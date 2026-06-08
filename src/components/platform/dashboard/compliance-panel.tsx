import React from "react"
import Link from "next/link"
import { Icon } from "@iconify/react"
import { getComplianceReminders } from "./compliance-actions"
import type { Locale } from "@/components/internationalization"

interface CompliancePanelProps {
  locale: Locale
}

const KIND_ICON: Record<string, string> = {
  "im-expiring": "mdi:bank-outline",
  "acd-due": "mdi:file-document-alert-outline",
  "do-expiring": "mdi:truck-delivery-outline",
  "stage-sla": "mdi:timer-alert-outline",
}

function severityClasses(daysFromDeadline: number) {
  if (daysFromDeadline < 0)
    return "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900"
  if (daysFromDeadline <= 1)
    return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900"
  if (daysFromDeadline <= 3)
    return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900"
  return "bg-muted text-muted-foreground border-border"
}

export default async function CompliancePanel({ locale }: CompliancePanelProps) {
  const items = await getComplianceReminders()
  const isArabic = locale === "ar"

  if (items.length === 0) return null

  return (
    <div className="border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon icon="mdi:shield-alert-outline" width={20} className="text-amber-500" />
        <h3 className="font-semibold">
          {isArabic ? "تذكيرات الامتثال" : "Compliance Reminders"}
        </h3>
        <span className="ms-auto text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
          {items.length}
        </span>
      </div>

      <div className="space-y-3">
        {items.slice(0, 8).map((item) => (
          <Link
            key={item.id}
            href={`/${locale}${item.href}`}
            className="block p-3 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <Icon
                icon={KIND_ICON[item.kind] ?? "mdi:alert-circle-outline"}
                width={18}
                className="text-muted-foreground mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{item.title}</p>
                {item.shipmentNumber && (
                  <p className="text-xs text-muted-foreground truncate">
                    {item.shipmentNumber}
                  </p>
                )}
              </div>
              <span
                className={`shrink-0 text-xs px-2 py-0.5 rounded-full border ${severityClasses(item.daysFromDeadline)}`}
              >
                {item.daysFromDeadline < 0
                  ? isArabic
                    ? `متأخر ${Math.abs(item.daysFromDeadline)} يوم`
                    : `${Math.abs(item.daysFromDeadline)}d overdue`
                  : item.daysFromDeadline === 0
                    ? isArabic
                      ? "اليوم"
                      : "Today"
                    : isArabic
                      ? `${item.daysFromDeadline} يوم`
                      : `${item.daysFromDeadline}d`}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
