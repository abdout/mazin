import React from "react"
import Link from "next/link"
import { Icon } from "@iconify/react"
import {
  getStuckShipments,
  getUnpaidPayees,
  getOpenLeads,
} from "./cockpit-actions"
import type { Locale } from "@/components/internationalization"

interface TodayCockpitProps {
  locale: Locale
}

/**
 * Single-screen "what needs my attention right now" cockpit.
 * Card-only — empty cards are hidden so the screen never pads with zeros.
 */
export default async function TodayCockpit({ locale }: TodayCockpitProps) {
  const [stuck, unpaid, leads] = await Promise.all([
    getStuckShipments(),
    getUnpaidPayees(),
    getOpenLeads(),
  ])
  const isArabic = locale === "ar"

  const hasAnything = stuck.length > 0 || unpaid.length > 0 || leads.length > 0
  if (!hasAnything) return null

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stuck.length > 0 && (
        <div className="border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Icon icon="mdi:timer-alert-outline" width={20} className="text-amber-500" />
            <h3 className="font-semibold">
              {isArabic ? "شحنات متعثرة" : "Stuck shipments"}
            </h3>
            <span className="ms-auto text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
              {stuck.length}
            </span>
          </div>
          <ul className="space-y-2">
            {stuck.map((s) => (
              <li key={s.shipmentId + s.stageType}>
                <Link
                  href={`/${locale}${s.href}`}
                  className="flex justify-between items-center px-2 py-1.5 rounded-md hover:bg-muted/50"
                >
                  <span className="text-sm font-medium truncate">
                    {s.shipmentNumber}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {s.stageType} · +{s.hoursOver}h
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {unpaid.length > 0 && (
        <div className="border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Icon icon="mdi:cash-clock" width={20} className="text-rose-500" />
            <h3 className="font-semibold">
              {isArabic ? "دفعات مستحقة" : "Payments due"}
            </h3>
            <span className="ms-auto text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
              {unpaid.length}
            </span>
          </div>
          <ul className="space-y-2">
            {unpaid.slice(0, 6).map((p) => (
              <li key={p.paymentId}>
                <Link
                  href={`/${locale}${p.href}`}
                  className="flex justify-between items-center px-2 py-1.5 rounded-md hover:bg-muted/50"
                >
                  <span className="text-sm font-medium truncate">
                    {p.shipmentNumber} · {p.payee}
                  </span>
                  <span
                    className={`text-xs ${
                      p.daysOverdue > 0
                        ? "text-rose-600 dark:text-rose-400 font-medium"
                        : "text-muted-foreground"
                    }`}
                  >
                    {p.amount.toLocaleString()} {p.currency}
                    {p.daysOverdue > 0 ? ` · +${p.daysOverdue}d` : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {leads.length > 0 && (
        <div className="border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Icon icon="mdi:account-plus-outline" width={20} className="text-emerald-500" />
            <h3 className="font-semibold">
              {isArabic ? "عملاء جدد" : "New leads"}
            </h3>
            <span className="ms-auto text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
              {leads.length}
            </span>
          </div>
          <ul className="space-y-2">
            {leads.map((l) => (
              <li key={l.clientId}>
                <Link
                  href={`/${locale}${l.href}`}
                  className="flex justify-between items-center px-2 py-1.5 rounded-md hover:bg-muted/50"
                >
                  <span className="text-sm font-medium truncate">
                    {l.companyName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {l.daysSinceContact}d
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
