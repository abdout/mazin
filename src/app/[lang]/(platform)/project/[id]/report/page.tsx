import React from 'react'
import { db } from '@/lib/db'
import { auth } from '@/auth'
import { getDictionary } from '@/components/internationalization/dictionaries'
import type { Locale } from '@/components/internationalization'
import ReportPrintButton from '@/components/platform/project/report/print-button'

interface PageProps {
  params: Promise<{ id: string; lang: string }>
}

const TOTAL_STAGES = 11

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const n = parseFloat(value)
    return isNaN(n) ? 0 : n
  }
  if (
    value &&
    typeof value === 'object' &&
    'toString' in (value as Record<string, unknown>)
  ) {
    const n = parseFloat((value as { toString: () => string }).toString())
    return isNaN(n) ? 0 : n
  }
  return 0
}

function formatCurrency(value: number, currency: string, locale: Locale): string {
  return `${value.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`
}

function daysBetween(start: Date | null | undefined, end: Date | null | undefined): number {
  if (!start) return 0
  const from = start instanceof Date ? start : new Date(start)
  const to = end ? (end instanceof Date ? end : new Date(end)) : new Date()
  if (isNaN(from.getTime()) || isNaN(to.getTime())) return 0
  const diff = to.getTime() - from.getTime()
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)))
}

export default async function ProjectReport({ params }: PageProps) {
  const { id, lang } = await params
  const locale = lang as Locale
  const dict = await getDictionary(locale)
  const r = dict.project?.report
  const kpi = r?.kpis

  const session = await auth()
  const userId = session?.user?.id

  const project = await db.project.findUnique({
    where: { id },
    include: {
      client: true,
      shipment: {
        include: {
          containers: true,
          trackingStages: true,
        },
      },
    },
  })

  const shipment = project?.shipment ?? null

  // Aggregate KPIs in parallel when shipment exists
  let dutyPaid = 0
  let demurrageDays = 0
  let stagesCompleted = 0
  let daysInPort = 0
  let totalInvoiced = 0
  const currency = 'SDG'

  if (shipment && userId) {
    const [customsPayments, invoiceAgg] = await Promise.all([
      db.shipmentPayment.findMany({
        where: {
          shipmentId: shipment.id,
          payee: 'CUSTOMS',
          status: { in: ['PAID', 'CONFIRMED'] },
        },
        select: { amount: true, currency: true },
      }),
      db.invoice.aggregate({
        where: {
          shipmentId: shipment.id,
          userId,
          status: { not: 'CANCELLED' },
        },
        _sum: { total: true },
      }),
    ])

    dutyPaid = customsPayments.reduce(
      (sum, p) => sum + toNumber(p.amount),
      0
    )

    totalInvoiced = toNumber(invoiceAgg._sum.total)

    demurrageDays = shipment.containers.reduce((sum, c) => {
      if (!c.freeTimeExpiry) return sum
      const expiry = new Date(c.freeTimeExpiry)
      const end = c.returnedAt
        ? new Date(c.returnedAt)
        : c.releasedAt
        ? new Date(c.releasedAt)
        : new Date()
      const diff = end.getTime() - expiry.getTime()
      const days = Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)))
      return sum + days
    }, 0)

    stagesCompleted = shipment.trackingStages.filter(
      (s) => s.status === 'COMPLETED'
    ).length

    if (shipment.arrivalDate) {
      const releasedStage = shipment.trackingStages.find(
        (s) => s.stageType === 'RELEASE' && s.completedAt
      )
      daysInPort = daysBetween(
        shipment.arrivalDate,
        releasedStage?.completedAt ?? null
      )
    }
  }

  const projectTitle =
    (project?.client &&
      typeof project.client === 'object' &&
      (project.client as { companyName?: string }).companyName) ||
    project?.customer ||
    dict.project?.shipmentFallback ||
    'Project'

  const generatedOnLabel = r?.generatedOn ?? 'Generated on'
  const generatedAt = new Date().toLocaleDateString(
    locale === 'ar' ? 'ar-SA' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' }
  )

  return (
    <div className="container mx-auto px-4 py-6 print:p-0">
      <div className="mb-6 flex items-start justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-semibold">
            {r?.title ?? 'Project Report'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {r?.description ??
              'Summary of duties, demurrage, and invoicing for this project'}
          </p>
        </div>
        <ReportPrintButton label={r?.exportPdf ?? 'Export PDF'} />
      </div>

      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-semibold">{r?.title ?? 'Project Report'}</h1>
        <p className="text-sm">{projectTitle}</p>
        <p className="text-sm text-muted-foreground">
          {generatedOnLabel}: {generatedAt}
        </p>
      </div>

      {!shipment ? (
        <div className="border rounded-xl p-10 text-center text-muted-foreground">
          {r?.noShipment ?? 'No shipment linked to this project yet.'}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 print:grid-cols-3">
            <div className="p-5 border rounded-xl">
              <p className="text-xs text-muted-foreground">
                {kpi?.dutyPaid ?? 'Total Duty Paid'}
              </p>
              <p className="text-2xl font-semibold mt-1">
                {formatCurrency(dutyPaid, currency, locale)}
              </p>
            </div>
            <div className="p-5 border rounded-xl">
              <p className="text-xs text-muted-foreground">
                {kpi?.demurrageDays ?? 'Total Demurrage Days'}
              </p>
              <p className="text-2xl font-semibold mt-1">
                {demurrageDays.toLocaleString(
                  locale === 'ar' ? 'ar-SA' : 'en-US'
                )}
              </p>
            </div>
            <div className="p-5 border rounded-xl">
              <p className="text-xs text-muted-foreground">
                {kpi?.stagesCompleted ?? 'Stages Completed'}
              </p>
              <p className="text-2xl font-semibold mt-1">
                {stagesCompleted}{' '}
                <span className="text-sm text-muted-foreground font-normal">
                  {kpi?.stageCountSuffix ?? `of ${TOTAL_STAGES}`}
                </span>
              </p>
            </div>
            <div className="p-5 border rounded-xl">
              <p className="text-xs text-muted-foreground">
                {kpi?.daysInPort ?? 'Days in Port'}
              </p>
              <p className="text-2xl font-semibold mt-1">
                {daysInPort.toLocaleString(
                  locale === 'ar' ? 'ar-SA' : 'en-US'
                )}
              </p>
            </div>
            <div className="p-5 border rounded-xl md:col-span-2 lg:col-span-2">
              <p className="text-xs text-muted-foreground">
                {kpi?.totalInvoiced ?? 'Total Invoiced'}
              </p>
              <p className="text-2xl font-semibold mt-1">
                {formatCurrency(totalInvoiced, currency, locale)}
              </p>
            </div>
          </div>

          <div className="mt-6 text-xs text-muted-foreground print:hidden">
            {generatedOnLabel}: {generatedAt}
          </div>
        </>
      )}
    </div>
  )
}
