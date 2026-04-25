// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"
import {
  CircleArrowUp,
  TrendingUp,
  Wallet as WalletIcon,
} from "lucide-react"

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
import { Badge } from "@/components/ui/badge"

import { listWallets, getWalletStats } from "./queries"
import { DepositDialog } from "./deposit-dialog"

interface WalletContentProps {
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

function formatRelative(dateISO: string | null, locale: Locale) {
  if (!dateISO) return "—"
  try {
    const rtf = new Intl.RelativeTimeFormat(locale === "ar" ? "ar" : "en", {
      numeric: "auto",
    })
    const diffMs = new Date(dateISO).getTime() - Date.now()
    const minutes = Math.round(diffMs / 60000)
    const abs = Math.abs(minutes)
    if (abs < 60) return rtf.format(minutes, "minute")
    const hours = Math.round(minutes / 60)
    if (Math.abs(hours) < 48) return rtf.format(hours, "hour")
    return rtf.format(Math.round(hours / 24), "day")
  } catch {
    return new Date(dateISO).toLocaleDateString(locale === "ar" ? "ar-SD" : "en-US")
  }
}

export default async function WalletContent({ dictionary, lang }: WalletContentProps) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/${lang}/login?callbackUrl=/${lang}/finance/wallet`)
  }

  const [wallets, stats] = await Promise.all([
    listWallets(session.user.id),
    getWalletStats(session.user.id),
  ])

  const wdict = dictionary.finance?.wallet as Record<string, unknown> | undefined
  const cols = (wdict?.columns ?? {}) as Record<string, string>
  const status = (wdict?.status ?? {}) as Record<string, string>

  const title = (wdict?.title as string) ?? "Client wallets"
  const subtitle = (wdict?.subtitle as string) ?? ""
  const totalBalanceLabel = (wdict?.totalBalance as string) ?? "Total balance"
  const activeWalletsLabel = (wdict?.activeWallets as string) ?? "Active wallets"
  const transactions30dLabel = (wdict?.transactions30d as string) ?? "Transactions (30d)"
  const emptyMessage = (wdict?.empty as string) ?? "No clients yet."

  return (
    <div className="space-y-6 py-4 md:py-6">
      <header className="px-4 lg:px-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </header>

      <div className="grid gap-4 px-4 md:grid-cols-3 lg:px-6">
        <StatCard
          title={totalBalanceLabel}
          value={formatMoney(stats.totalBalance, stats.currency, lang)}
          icon={<WalletIcon className="size-4" />}
        />
        <StatCard
          title={activeWalletsLabel}
          value={String(stats.activeWallets)}
          icon={<CircleArrowUp className="size-4" />}
        />
        <StatCard
          title={transactions30dLabel}
          value={String(stats.transactions30d)}
          icon={<TrendingUp className="size-4" />}
        />
      </div>

      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{subtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            {wallets.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{cols.client ?? "Client"}</TableHead>
                    <TableHead className="text-end">{cols.balance ?? "Balance"}</TableHead>
                    <TableHead>{cols.currency ?? "Currency"}</TableHead>
                    <TableHead className="text-end">{cols.creditLimit ?? "Credit limit"}</TableHead>
                    <TableHead>{cols.lastActivity ?? "Last activity"}</TableHead>
                    <TableHead className="text-end">{cols.actions ?? "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wallets.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell className="font-medium">{w.clientName}</TableCell>
                      <TableCell className="text-end tabular-nums">
                        {formatMoney(w.balance, w.currency, lang)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs">{w.currency}</span>
                          <Badge variant={w.status === "ACTIVE" ? "default" : "secondary"}>
                            {status[w.status] ?? w.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-end tabular-nums text-muted-foreground">
                        {w.creditLimit > 0 ? formatMoney(w.creditLimit, w.currency, lang) : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatRelative(w.lastActivityAt, lang)}
                      </TableCell>
                      <TableCell className="text-end">
                        <DepositDialog
                          walletId={w.id}
                          clientName={w.clientName}
                          currency={w.currency}
                          locale={lang}
                          dict={wdict}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
        <CardDescription className="text-xs">{title}</CardDescription>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  )
}
