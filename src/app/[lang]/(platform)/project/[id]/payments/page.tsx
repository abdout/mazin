import React from 'react'
import { Icon } from '@iconify/react'
import { getDictionary } from '@/components/internationalization/dictionaries'
import type { Dictionary, Locale } from '@/components/internationalization'
import { getProject } from '@/components/platform/project/actions'
import {
  getShipmentPayments,
  getPaymentSummary,
} from '@/actions/shipment-payment'

interface PageProps {
  params: Promise<{ id: string; lang: string }>
}

type PayeeKey =
  | 'CUSTOMS'
  | 'SEA_PORTS'
  | 'SHIPPING_LINE'
  | 'SSMO'
  | 'MINISTRY_OF_TRADE'
  | 'TRANSPORT'
  | 'CLEARING_AGENT'
  | 'OTHER'

const PAYEE_ICONS: Record<PayeeKey, string> = {
  CUSTOMS: 'mdi:shield-account',
  SEA_PORTS: 'mdi:anchor',
  SHIPPING_LINE: 'mdi:ferry',
  SSMO: 'mdi:certificate',
  MINISTRY_OF_TRADE: 'mdi:domain',
  TRANSPORT: 'mdi:truck',
  CLEARING_AGENT: 'mdi:account-tie',
  OTHER: 'mdi:dots-horizontal-circle',
}

type PaymentStatus =
  | 'PENDING'
  | 'PARTIAL'
  | 'PAID'
  | 'CONFIRMED'
  | 'CANCELLED'

const STATUS_CLASSES: Record<PaymentStatus, string> = {
  PENDING:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800',
  PARTIAL:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800',
  PAID: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800',
  CONFIRMED:
    'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800',
  CANCELLED:
    'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800',
}

function getStatusLabel(status: PaymentStatus, dict: Dictionary): string {
  const statuses = dict.project?.payments?.statuses
  const fallbacks: Record<PaymentStatus, string> = {
    PENDING: 'Pending',
    PARTIAL: 'Partial',
    PAID: 'Paid',
    CONFIRMED: 'Confirmed',
    CANCELLED: 'Cancelled',
  }
  return statuses?.[status] ?? fallbacks[status]
}

function getPayeeLabel(payee: PayeeKey, dict: Dictionary): string {
  const payees = dict.project?.payments?.payees
  const fallbacks: Record<PayeeKey, string> = {
    CUSTOMS: 'Customs',
    SEA_PORTS: 'Sea Ports Authority',
    SHIPPING_LINE: 'Shipping Line',
    SSMO: 'SSMO',
    MINISTRY_OF_TRADE: 'Ministry of Trade',
    TRANSPORT: 'Transport',
    CLEARING_AGENT: 'Clearing Agent',
    OTHER: 'Other',
  }
  return payees?.[payee] ?? fallbacks[payee]
}

function formatAmount(amount: number, currency: string, locale: Locale): string {
  const formatter = new Intl.NumberFormat(locale === 'ar' ? 'ar-SD' : 'en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
  return `${formatter.format(amount)} ${currency}`
}

function formatDate(date: Date | string | null, locale: Locale): string {
  if (!date) return '--'
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SD' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d)
}

export default async function ProjectPayments({ params }: PageProps) {
  const { id, lang } = await params
  const locale = lang as Locale
  const dict = await getDictionary(locale)
  const payments = dict.project?.payments
  const defaultCurrency = 'SDG'

  const projectResult = await getProject(id)
  const shipmentId = projectResult.success
    ? projectResult.project?.shipment?.id
    : undefined

  let paymentList: Awaited<ReturnType<typeof getShipmentPayments>> = []
  let summary: Awaited<ReturnType<typeof getPaymentSummary>> = {
    totalAmount: 0,
    totalPaid: 0,
    totalPending: 0,
    paymentCount: 0,
    byPayee: {},
  }

  if (shipmentId) {
    try {
      ;[paymentList, summary] = await Promise.all([
        getShipmentPayments(shipmentId),
        getPaymentSummary(shipmentId),
      ])
    } catch {
      paymentList = []
    }
  }

  const hasPayments = paymentList.length > 0
  const byPayeeEntries = (Object.entries(summary.byPayee) as [
    PayeeKey,
    { total: number; paid: number; pending: number; count: number },
  ][]).sort((a, b) => b[1].total - a[1].total)

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">
          {payments?.title ?? 'Payments'}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {payments?.description ?? 'Track multi-party payments for this shipment'}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-4 border rounded-xl">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Icon icon="mdi:cash-multiple" width={18} />
            <span className="text-sm">
              {payments?.totalAmount ?? 'Total Amount'}
            </span>
          </div>
          <p className="text-2xl font-semibold mt-2">
            {formatAmount(summary.totalAmount, defaultCurrency, locale)}
          </p>
        </div>
        <div className="p-4 border rounded-xl border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <Icon icon="mdi:check-circle" width={18} />
            <span className="text-sm">
              {payments?.paid ?? 'Paid'}
            </span>
          </div>
          <p className="text-2xl font-semibold mt-2 text-green-700 dark:text-green-400">
            {formatAmount(summary.totalPaid, defaultCurrency, locale)}
          </p>
        </div>
        <div className="p-4 border rounded-xl border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <Icon icon="mdi:clock-outline" width={18} />
            <span className="text-sm">
              {payments?.pending ?? 'Pending'}
            </span>
          </div>
          <p className="text-2xl font-semibold mt-2 text-amber-700 dark:text-amber-400">
            {formatAmount(summary.totalPending, defaultCurrency, locale)}
          </p>
        </div>
        <div className="p-4 border rounded-xl">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Icon icon="mdi:receipt-text" width={18} />
            <span className="text-sm">
              {payments?.paymentCount ?? 'Payment Count'}
            </span>
          </div>
          <p className="text-2xl font-semibold mt-2">
            {new Intl.NumberFormat(locale === 'ar' ? 'ar-SD' : 'en-US').format(
              summary.paymentCount,
            )}
          </p>
        </div>
      </div>

      {/* Breakdown by payee */}
      <div className="mt-8">
        <h2 className="text-lg font-medium mb-4">
          {payments?.breakdownByPayee ?? 'Breakdown by Payee'}
        </h2>

        {byPayeeEntries.length === 0 ? (
          <div className="border rounded-xl p-8 text-center text-muted-foreground">
            <Icon
              icon="mdi:cash-off"
              width={40}
              className="mx-auto mb-3 opacity-40"
            />
            <p className="text-sm">
              {payments?.noPayeeBreakdown ?? 'No payee data available'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {byPayeeEntries.map(([payee, entry]) => {
              const isFullyPaid = entry.pending === 0 && entry.total > 0
              const hasPending = entry.pending > 0
              const payeeLabel = getPayeeLabel(payee, dict)
              const paymentUnit =
                entry.count === 1
                  ? payments?.payment ?? 'payment'
                  : payments?.payments ?? 'payments'
              return (
                <div key={payee} className="p-4 border rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Icon
                        icon={PAYEE_ICONS[payee] ?? 'mdi:office-building'}
                        width={20}
                        className="text-muted-foreground"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{payeeLabel}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Intl.NumberFormat(
                          locale === 'ar' ? 'ar-SD' : 'en-US',
                        ).format(entry.count)}{' '}
                        {paymentUnit}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-md border ${
                        isFullyPaid
                          ? STATUS_CLASSES.PAID
                          : hasPending
                            ? STATUS_CLASSES.PENDING
                            : STATUS_CLASSES.CANCELLED
                      }`}
                    >
                      {isFullyPaid
                        ? payments?.paid ?? 'Paid'
                        : hasPending
                          ? payments?.partial ?? 'Partial'
                          : payments?.unpaid ?? 'Unpaid'}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {payments?.total ?? 'Total'}
                      </span>
                      <span className="font-medium">
                        {formatAmount(entry.total, defaultCurrency, locale)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-700 dark:text-green-400">
                        {payments?.paid ?? 'Paid'}
                      </span>
                      <span className="font-medium text-green-700 dark:text-green-400">
                        {formatAmount(entry.paid, defaultCurrency, locale)}
                      </span>
                    </div>
                    {entry.pending > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-amber-700 dark:text-amber-400">
                          {payments?.pending ?? 'Pending'}
                        </span>
                        <span className="font-medium text-amber-700 dark:text-amber-400">
                          {formatAmount(entry.pending, defaultCurrency, locale)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Individual payments list */}
      <div className="mt-8 border rounded-xl p-6">
        <h2 className="text-lg font-medium mb-4">
          {payments?.paymentsList ?? 'Payments List'}
        </h2>

        {!hasPayments ? (
          <div className="text-center py-10 text-muted-foreground">
            <Icon
              icon="mdi:receipt-text-outline"
              width={48}
              className="mx-auto mb-3 opacity-40"
            />
            <p>{payments?.noPayments ?? 'No payments yet'}</p>
            <p className="text-sm mt-1">
              {payments?.noPaymentsHint ?? 'Payments will appear here once added'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {paymentList.map((payment) => {
              const payee = payment.payee as PayeeKey
              const status = payment.status as PaymentStatus
              const payeeLabel = getPayeeLabel(payee, dict)
              return (
                <div
                  key={payment.id}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted shrink-0">
                    <Icon
                      icon={PAYEE_ICONS[payee] ?? 'mdi:office-building'}
                      width={18}
                      className="text-muted-foreground"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">
                        {payment.payeeName || payeeLabel}
                      </span>
                      {payment.payeeName && (
                        <span className="text-xs text-muted-foreground">
                          {payeeLabel}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                      {payment.referenceNo && (
                        <span className="inline-flex items-center gap-1">
                          <Icon icon="mdi:pound" width={12} />
                          {payment.referenceNo}
                        </span>
                      )}
                      {payment.receiptNo && (
                        <span className="inline-flex items-center gap-1">
                          <Icon icon="mdi:receipt" width={12} />
                          {payment.receiptNo}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Icon icon="mdi:calendar" width={12} />
                        {formatDate(
                          payment.paidDate ?? payment.dueDate,
                          locale,
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="ms-auto flex items-center gap-3 shrink-0">
                    <span className="font-semibold text-sm">
                      {formatAmount(
                        payment.amount,
                        payment.currency || defaultCurrency,
                        locale,
                      )}
                    </span>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-md border whitespace-nowrap ${STATUS_CLASSES[status]}`}
                    >
                      {getStatusLabel(status, dict)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
