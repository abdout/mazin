import React from 'react'
import Link from 'next/link'
import { db } from '@/lib/db'
import { auth } from '@/auth'
import { getDictionary } from '@/components/internationalization/dictionaries'
import type { Locale } from '@/components/internationalization'
import { Badge } from '@/components/ui/badge'
import type { InvoiceStatus } from '@prisma/client'

interface PageProps {
  params: Promise<{ id: string; lang: string }>
  searchParams?: Promise<{ status?: string }>
}

const VALID_STATUSES: InvoiceStatus[] = [
  'DRAFT',
  'SENT',
  'PAID',
  'OVERDUE',
  'CANCELLED',
]

function getStatusFilter(value: string | undefined): InvoiceStatus | null {
  if (!value) return null
  const upper = value.toUpperCase()
  return (VALID_STATUSES as string[]).includes(upper)
    ? (upper as InvoiceStatus)
    : null
}

function statusBadgeVariant(
  status: InvoiceStatus
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'PAID':
      return 'default'
    case 'SENT':
      return 'secondary'
    case 'OVERDUE':
      return 'destructive'
    case 'DRAFT':
    case 'CANCELLED':
    default:
      return 'outline'
  }
}

function formatCurrency(
  value: unknown,
  currency: string,
  locale: Locale
): string {
  const num =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
      ? parseFloat(value)
      : typeof value === 'object' && value !== null && 'toString' in value
      ? parseFloat((value as { toString: () => string }).toString())
      : 0
  if (isNaN(num)) return `0.00 ${currency}`
  return `${num.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`
}

function formatDate(value: Date | null | undefined, locale: Locale): string {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default async function ProjectInvoices({ params, searchParams }: PageProps) {
  const { id, lang } = await params
  const sp = searchParams ? await searchParams : undefined
  const locale = lang as Locale
  const dict = await getDictionary(locale)
  const section = dict.project?.invoicesSection
  const filtersDict = section?.filters

  const statusFilter = getStatusFilter(sp?.status)

  const session = await auth()
  const userId = session?.user?.id

  // Find shipment linked to this project (Invoice → Shipment → Project)
  const project = await db.project.findUnique({
    where: { id },
    include: {
      shipment: { select: { id: true } },
    },
  })

  const shipmentId = project?.shipment?.id ?? null

  let invoices: Array<{
    id: string
    invoiceNumber: string
    status: InvoiceStatus
    currency: string
    total: unknown
    createdAt: Date
    items: unknown[]
  }> = []

  if (shipmentId && userId) {
    invoices = await db.invoice.findMany({
      where: {
        shipmentId,
        userId,
        ...(statusFilter ? { status: statusFilter } : {}),
      },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  const statusTabs: Array<{ key: InvoiceStatus | 'ALL'; label: string }> = [
    { key: 'ALL', label: filtersDict?.all ?? 'All' },
    { key: 'DRAFT', label: filtersDict?.draft ?? 'Draft' },
    { key: 'SENT', label: filtersDict?.sent ?? 'Sent' },
    { key: 'PAID', label: filtersDict?.paid ?? 'Paid' },
    { key: 'OVERDUE', label: filtersDict?.overdue ?? 'Overdue' },
    { key: 'CANCELLED', label: filtersDict?.cancelled ?? 'Cancelled' },
  ]

  const selectedTab: InvoiceStatus | 'ALL' = statusFilter ?? 'ALL'

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">
          {section?.title ?? 'Related Invoices'}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {section?.description ??
            'Track duties, VAT, port charges, and other expenses'}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {statusTabs.map((tab) => {
          const href =
            tab.key === 'ALL'
              ? `/${lang}/project/${id}/invoices`
              : `/${lang}/project/${id}/invoices?status=${tab.key}`
          const isActive = selectedTab === tab.key
          return (
            <Link
              key={tab.key}
              href={href}
              className={
                'rounded-full border px-3 py-1 text-sm transition-colors ' +
                (isActive
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-foreground hover:bg-accent')
              }
            >
              {tab.label}
            </Link>
          )
        })}
      </div>

      {invoices.length === 0 ? (
        <div className="border rounded-xl p-10 text-center text-muted-foreground">
          {section?.noExpenseRecords ?? 'No expense records yet'}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {invoices.map((invoice) => (
            <Link
              key={invoice.id}
              href={`/${lang}/invoice/${invoice.id}`}
              className="block"
            >
              <div className="p-5 border rounded-xl bg-card hover:shadow-sm transition-shadow h-full">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {section?.columns?.invoiceNumber ?? 'Invoice Number'}
                    </p>
                    <p className="font-semibold">{invoice.invoiceNumber}</p>
                  </div>
                  <Badge variant={statusBadgeVariant(invoice.status)}>
                    {invoice.status}
                  </Badge>
                </div>
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground">
                    {section?.columns?.amount ?? 'Amount'}
                  </p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(invoice.total, invoice.currency, locale)}
                  </p>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  {section?.columns?.createdAt ?? 'Created At'}:{' '}
                  {formatDate(invoice.createdAt, locale)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
