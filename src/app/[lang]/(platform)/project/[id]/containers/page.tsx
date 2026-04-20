import React from 'react'
import { Icon } from '@iconify/react'
import { getDictionary } from '@/components/internationalization/dictionaries'
import type { Locale } from '@/components/internationalization'
import type { Dictionary } from '@/components/internationalization/types'
import { getProject } from '@/components/platform/project/actions'
import { getContainers } from '@/actions/container'
import type { ContainerStatus } from '@prisma/client'

interface PageProps {
  params: Promise<{ id: string; lang: string }>
}

type StatusStyles = {
  badge: string
  dot: string
  label: string
}

function getStatusStyles(
  status: ContainerStatus,
  dict: Dictionary,
): StatusStyles {
  const s = dict.project?.containers?.statuses
  switch (status) {
    case 'PENDING_ARRIVAL':
      return {
        badge:
          'bg-slate-100 dark:bg-slate-950/40 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-900',
        dot: 'bg-slate-500',
        label: s?.pending ?? 'Pending',
      }
    case 'FREE':
      return {
        badge:
          'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900',
        dot: 'bg-green-500',
        label: s?.free ?? 'Free',
      }
    case 'WARNING':
      return {
        badge:
          'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900',
        dot: 'bg-amber-500',
        label: s?.warning ?? 'Warning',
      }
    case 'DEMURRAGE':
      return {
        badge:
          'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900',
        dot: 'bg-red-500',
        label: s?.demurrage ?? 'Demurrage',
      }
    case 'RELEASED':
      return {
        badge:
          'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900',
        dot: 'bg-blue-500',
        label: s?.released ?? 'Released',
      }
    case 'RETURNED':
      return {
        badge:
          'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900',
        dot: 'bg-purple-500',
        label: s?.returned ?? 'Returned',
      }
    default:
      return {
        badge:
          'bg-muted text-muted-foreground border-border',
        dot: 'bg-muted-foreground',
        label: String(status),
      }
  }
}

function formatDate(date: Date | null, locale: Locale): string {
  if (!date) return '—'
  try {
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date))
  } catch {
    return new Date(date).toISOString().slice(0, 10)
  }
}

function formatCurrency(value: number, locale: Locale): string {
  try {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar' : 'en', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `$${value.toFixed(0)}`
  }
}

function formatDaysRemaining(
  days: number,
  dict: Dictionary,
  locale: Locale,
): string {
  const u = dict.project?.containers?.units
  if (locale === 'ar') {
    const template = u?.daysRemaining ?? '{count} يوم'
    return template.replace('{count}', String(days))
  }
  const template = u?.daysRemaining ?? '{count}d'
  return template.replace('{count}', String(days))
}

function formatDaysOverdue(
  days: number,
  dict: Dictionary,
  locale: Locale,
): string {
  const u = dict.project?.containers?.units
  if (locale === 'ar') {
    const template = u?.daysOverdueAr ?? 'متأخر {count} يوم'
    return template.replace('{count}', String(days))
  }
  const template = u?.daysOverdue ?? '{count}d overdue'
  return template.replace('{count}', String(days))
}

export default async function ProjectContainers({ params }: PageProps) {
  const { id, lang } = await params
  const locale = lang as Locale
  const dir = locale === 'ar' ? 'rtl' : 'ltr'
  const dict = await getDictionary(locale)
  const containersDict = dict.project?.containers

  const projectResult = await getProject(id)

  // Project not found or not authorized
  if (!projectResult.success || !projectResult.project) {
    return (
      <div className="container mx-auto px-4 py-6" dir={dir}>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">
            {containersDict?.title ?? 'Container Tracking'}
          </h1>
        </div>
        <div className="border rounded-xl p-8 text-center">
          <Icon
            icon="mdi:alert-circle-outline"
            width={48}
            className="mx-auto mb-3 text-muted-foreground opacity-60"
          />
          <p className="text-muted-foreground">
            {containersDict?.projectNotFound ?? 'Project not found'}
          </p>
        </div>
      </div>
    )
  }

  const project = projectResult.project
  const shipment = project.shipment

  // Project has no shipment yet
  if (!shipment) {
    return (
      <div className="container mx-auto px-4 py-6" dir={dir}>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">
            {containersDict?.title ?? 'Container Tracking'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {containersDict?.description ??
              'Monitor container status and demurrage free time'}
          </p>
        </div>
        <div className="border rounded-xl p-10 text-center">
          <Icon
            icon="mdi:ferry"
            width={56}
            className="mx-auto mb-4 text-muted-foreground opacity-50"
          />
          <p className="font-medium">
            {containersDict?.noShipmentLinked ??
              'No shipment linked to this project'}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {containersDict?.noShipmentHint ??
              'Containers will appear here once a shipment is created'}
          </p>
        </div>
      </div>
    )
  }

  // Fetch containers for this shipment
  const containers = await getContainers(shipment.id)

  // Compute summary counts
  const total = containers.length
  const freeCount = containers.filter(
    (c) => c.status === 'FREE' || c.status === 'PENDING_ARRIVAL'
  ).length
  const warningCount = containers.filter(
    (c) => c.status === 'WARNING'
  ).length
  const demurrageCount = containers.filter(
    (c) => c.status === 'DEMURRAGE'
  ).length

  // Enrich containers with computed fields
  const now = new Date()
  const enriched = containers.map((c) => {
    const freeTimeExpiry = c.freeTimeExpiry ? new Date(c.freeTimeExpiry) : null
    let daysRemaining: number | null = null
    let daysOverdue = 0
    let demurrageAmount = 0

    if (freeTimeExpiry) {
      const msPerDay = 1000 * 60 * 60 * 24
      const diffMs = freeTimeExpiry.getTime() - now.getTime()
      const diffDays = Math.ceil(diffMs / msPerDay)
      daysRemaining = diffDays
      if (diffDays < 0) {
        daysOverdue = Math.abs(diffDays)
        demurrageAmount = daysOverdue * (c.demurrageRate || 0)
      }
    }

    return {
      ...c,
      daysRemaining,
      daysOverdue,
      demurrageAmount,
    }
  })

  const cols = containersDict?.columns

  return (
    <div className="container mx-auto px-4 py-6" dir={dir}>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">
          {containersDict?.title ?? 'Container Tracking'}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {containersDict?.description ??
            'Monitor container status and demurrage free time'}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="p-4 border rounded-xl">
          <p className="text-sm text-muted-foreground">
            {containersDict?.totalContainers ?? 'Total Containers'}
          </p>
          <p className="text-2xl font-semibold mt-1">{total}</p>
        </div>
        <div className="p-4 border rounded-xl border-green-200 bg-green-50 dark:bg-green-950/20">
          <p className="text-sm text-green-700 dark:text-green-400">
            {containersDict?.freeTime ?? 'Free Time'}
          </p>
          <p className="text-2xl font-semibold mt-1 text-green-700 dark:text-green-400">
            {freeCount}
          </p>
        </div>
        <div className="p-4 border rounded-xl border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            {containersDict?.warning ?? 'Warning'}
          </p>
          <p className="text-2xl font-semibold mt-1 text-amber-700 dark:text-amber-400">
            {warningCount}
          </p>
        </div>
        <div className="p-4 border rounded-xl border-red-200 bg-red-50 dark:bg-red-950/20">
          <p className="text-sm text-red-700 dark:text-red-400">
            {containersDict?.demurrage ?? 'Demurrage'}
          </p>
          <p className="text-2xl font-semibold mt-1 text-red-700 dark:text-red-400">
            {demurrageCount}
          </p>
        </div>
      </div>

      {/* Container list */}
      <div className="mt-8 border rounded-xl p-6">
        <h2 className="text-lg font-medium mb-4">
          {containersDict?.containerList ?? 'Container List'}
        </h2>

        {enriched.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Icon
              icon="mdi:package-variant"
              width={48}
              className="mx-auto mb-3 opacity-40"
            />
            <p>{containersDict?.noContainers ?? 'No containers added'}</p>
            <p className="text-sm mt-1">
              {containersDict?.noContainersHint ??
                'Container numbers will appear here once added to the shipment'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-start font-medium py-2 pe-4">
                      {cols?.containerNo ?? 'Container No'}
                    </th>
                    <th className="text-start font-medium py-2 px-4">
                      {cols?.size ?? 'Size'}
                    </th>
                    <th className="text-start font-medium py-2 px-4">
                      {cols?.status ?? 'Status'}
                    </th>
                    <th className="text-start font-medium py-2 px-4">
                      {cols?.daysRemaining ?? 'Days Remaining'}
                    </th>
                    <th className="text-start font-medium py-2 px-4">
                      {cols?.dailyRate ?? 'Daily Rate'}
                    </th>
                    <th className="text-start font-medium py-2 px-4">
                      {cols?.arrivalDate ?? 'Arrival Date'}
                    </th>
                    <th className="text-start font-medium py-2 ps-4">
                      {cols?.accrued ?? 'Accrued'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {enriched.map((c) => {
                    const styles = getStatusStyles(c.status, dict)
                    const sizeLabel = c.size === 'TWENTY_FT' ? "20'" : "40'"
                    return (
                      <tr
                        key={c.id}
                        className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-3 pe-4 font-medium">
                          {c.containerNumber}
                        </td>
                        <td className="py-3 px-4">{sizeLabel}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border ${styles.badge}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${styles.dot}`}
                            />
                            {styles.label}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {c.daysRemaining === null ? (
                            <span className="text-muted-foreground">—</span>
                          ) : c.daysRemaining < 0 ? (
                            <span className="text-red-600 dark:text-red-400">
                              {formatDaysOverdue(c.daysOverdue, dict, locale)}
                            </span>
                          ) : (
                            <span>
                              {formatDaysRemaining(c.daysRemaining, dict, locale)}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {c.demurrageRate
                            ? `${formatCurrency(c.demurrageRate, locale)}/d`
                            : '—'}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {formatDate(c.arrivalDate, locale)}
                        </td>
                        <td className="py-3 ps-4">
                          {c.demurrageAmount > 0 ? (
                            <span className="font-medium text-red-600 dark:text-red-400">
                              {formatCurrency(c.demurrageAmount, locale)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {enriched.map((c) => {
                const styles = getStatusStyles(c.status, dict)
                const sizeLabel = c.size === 'TWENTY_FT' ? "20'" : "40'"
                return (
                  <div
                    key={c.id}
                    className="border rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{c.containerNumber}</span>
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border ${styles.badge}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${styles.dot}`}
                        />
                        {styles.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {cols?.size ?? 'Size'}
                        </p>
                        <p>{sizeLabel}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {cols?.daysRemaining ?? 'Days Remaining'}
                        </p>
                        <p>
                          {c.daysRemaining === null
                            ? '—'
                            : c.daysRemaining < 0
                            ? formatDaysOverdue(c.daysOverdue, dict, locale)
                            : formatDaysRemaining(c.daysRemaining, dict, locale)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {cols?.dailyRate ?? 'Daily Rate'}
                        </p>
                        <p>
                          {c.demurrageRate
                            ? `${formatCurrency(c.demurrageRate, locale)}/d`
                            : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {cols?.arrivalDate ?? 'Arrival Date'}
                        </p>
                        <p>{formatDate(c.arrivalDate, locale)}</p>
                      </div>
                    </div>
                    {c.demurrageAmount > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                          {cols?.accruedDemurrage ?? 'Accrued Demurrage'}
                        </p>
                        <p className="font-medium text-red-600 dark:text-red-400">
                          {formatCurrency(c.demurrageAmount, locale)}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Info banner */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl">
        <div className="flex gap-3">
          <Icon
            icon="mdi:information"
            width={20}
            className="text-blue-600 mt-0.5 shrink-0"
          />
          <div>
            <p className="font-medium text-blue-800 dark:text-blue-200">
              {containersDict?.demurragePreventionTitle ??
                'Demurrage Prevention'}
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              {containersDict?.demurragePreventionNote ??
                'Free time is typically 14 days from vessel arrival. Alerts will be sent at 7, 3, and 1 day before expiry.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
