// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"

import { auth } from "@/auth"
import type { Dictionary } from "@/components/internationalization/types"
import type { Locale } from "@/components/internationalization/config"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  getARAging,
  getCashFlowThisMonth,
  getPnlSummary,
  getWalletSummary,
} from "./actions"

interface Props {
  dictionary: Dictionary
  lang: Locale
}

function formatMoney(value: number, currency: string, locale: Locale) {
  try {
    return new Intl.NumberFormat(locale === "ar" ? "ar-SD" : "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return `${currency} ${value.toFixed(2)}`
  }
}

export default async function ReportsContent({ dictionary, lang }: Props) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/${lang}/login?callbackUrl=/${lang}/finance/reports`)
  }

  // All four reports run in parallel; they're independent tenant-scoped reads.
  const [pnlRes, agingRes, walletsRes, cashFlowRes] = await Promise.all([
    getPnlSummary(),
    getARAging(),
    getWalletSummary(),
    getCashFlowThisMonth(),
  ])

  const pnl = pnlRes.success ? pnlRes.data : null
  const aging = agingRes.success ? agingRes.data : null
  const wallets = walletsRes.success ? walletsRes.data : null
  const cashflow = cashFlowRes.success ? cashFlowRes.data : null

  const rdict = dictionary.finance?.reports as Record<string, unknown> | undefined
  const s = (rdict?.sections ?? {}) as Record<string, string>

  const title = (rdict?.title as string) ?? "Financial reports"
  const subtitle = (rdict?.subtitle as string) ?? ""
  const currency = "SDG"

  return (
    <div className="space-y-6 py-4 md:py-6">
      <header className="px-4 lg:px-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </header>

      {/* P&L Summary: three periods side-by-side. */}
      <section className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>{s.pnl ?? "Profit & Loss"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <PnlColumn
                label={s.pnlThisMonth ?? "This month"}
                period={pnl?.thisMonth}
                currency={currency}
                locale={lang}
                labels={s}
              />
              <PnlColumn
                label={s.pnlLastMonth ?? "Last month"}
                period={pnl?.lastMonth}
                currency={currency}
                locale={lang}
                labels={s}
              />
              <PnlColumn
                label={s.pnlYTD ?? "Year to date"}
                period={pnl?.yearToDate}
                currency={currency}
                locale={lang}
                labels={s}
              />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Two-column layout for aging + wallets. */}
      <section className="grid gap-4 px-4 md:grid-cols-2 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>{s.aging ?? "Receivables aging"}</CardTitle>
            <CardDescription>{s.agingSubtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{s.agingBucket ?? "Age"}</TableHead>
                  <TableHead className="text-end">{s.agingCount ?? "Count"}</TableHead>
                  <TableHead className="text-end">{s.agingAmount ?? "Amount"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(aging?.buckets ?? []).map((b) => (
                  <TableRow key={b.label}>
                    <TableCell className="font-mono text-xs">{b.label}</TableCell>
                    <TableCell className="text-end tabular-nums">{b.count}</TableCell>
                    <TableCell className="text-end tabular-nums">
                      {formatMoney(b.amount, currency, lang)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{s.wallets ?? "Client wallets"}</CardTitle>
            <CardDescription>{s.walletsSubtitle}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <MiniStat
                label={s.walletsTotalHeld ?? "Total held"}
                value={formatMoney(wallets?.totalHeld ?? 0, currency, lang)}
              />
              <MiniStat
                label={s.walletsActive ?? "Active wallets"}
                value={String(wallets?.walletCount ?? 0)}
              />
            </div>
            {(wallets?.topClients?.length ?? 0) > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{s.walletsTopClient ?? "Client"}</TableHead>
                    <TableHead className="text-end">
                      {s.walletsTopBalance ?? "Balance"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wallets?.topClients.map((c) => (
                    <TableRow key={c.clientId}>
                      <TableCell>{c.clientName}</TableCell>
                      <TableCell className="text-end tabular-nums">
                        {formatMoney(c.balance, c.currency, lang)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Cash flow this month. */}
      <section className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>{s.cashflow ?? "Cash flow"}</CardTitle>
            <CardDescription>{s.cashflowSubtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  {s.cashflowInflows ?? "Inflows"}
                </h3>
                <ul className="mt-2 space-y-1">
                  <LedgerLine
                    label={s.cashflowInvoicePayments ?? "Invoice payments"}
                    value={formatMoney(cashflow?.inflows.invoicePayments ?? 0, currency, lang)}
                  />
                  <LedgerLine
                    label={s.cashflowWalletDeposits ?? "Wallet deposits"}
                    value={formatMoney(cashflow?.inflows.walletDeposits ?? 0, currency, lang)}
                  />
                  <LedgerLine
                    label="—"
                    value={formatMoney(cashflow?.inflows.total ?? 0, currency, lang)}
                    bold
                  />
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  {s.cashflowOutflows ?? "Outflows"}
                </h3>
                <ul className="mt-2 space-y-1">
                  <LedgerLine
                    label={s.cashflowExpenses ?? "Expenses paid"}
                    value={formatMoney(cashflow?.outflows.expenses ?? 0, currency, lang)}
                  />
                  <LedgerLine
                    label={s.cashflowWalletDrawdowns ?? "Wallet drawdowns"}
                    value={formatMoney(cashflow?.outflows.walletDrawdowns ?? 0, currency, lang)}
                  />
                  <LedgerLine
                    label="—"
                    value={formatMoney(cashflow?.outflows.total ?? 0, currency, lang)}
                    bold
                  />
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  {s.cashflowNet ?? "Net"}
                </h3>
                <p className="mt-2 text-2xl font-semibold tabular-nums">
                  {formatMoney(cashflow?.net ?? 0, currency, lang)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function PnlColumn({
  label,
  period,
  currency,
  locale,
  labels,
}: {
  label: string
  period: { revenue: number; expenses: number; profit: number } | undefined
  currency: string
  locale: Locale
  labels: Record<string, string>
}) {
  return (
    <div className="space-y-1 rounded-md border p-4">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <LedgerLine
        label={labels.revenue ?? "Revenue"}
        value={formatMoney(period?.revenue ?? 0, currency, locale)}
      />
      <LedgerLine
        label={labels.expenses ?? "Expenses"}
        value={formatMoney(period?.expenses ?? 0, currency, locale)}
      />
      <LedgerLine
        label={labels.profit ?? "Profit"}
        value={formatMoney(period?.profit ?? 0, currency, locale)}
        bold
      />
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </div>
  )
}

function LedgerLine({
  label,
  value,
  bold,
}: {
  label: string
  value: string
  bold?: boolean
}) {
  return (
    <li
      className={
        "flex items-center justify-between gap-4 text-sm" + (bold ? " font-semibold" : "")
      }
    >
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{value}</span>
    </li>
  )
}
