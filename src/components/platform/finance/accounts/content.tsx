// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"
import { Landmark, Wallet } from "lucide-react"

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

import { getBankAccountStats, listBankAccounts } from "./actions"
import { AccountDialog } from "./account-dialog"
import { RowActions } from "./row-actions"
import type { BankAccountDTO } from "./types"

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

export default async function AccountsContent({ dictionary, lang }: Props) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/${lang}/login?callbackUrl=/${lang}/finance/accounts`)
  }

  const [listRes, statsRes] = await Promise.all([
    listBankAccounts(),
    getBankAccountStats(),
  ])
  const rows = (listRes.success && listRes.data ? listRes.data : []) as BankAccountDTO[]
  const stats = statsRes.success && statsRes.data ? statsRes.data : null

  const adict = dictionary.finance?.accounts as Record<string, unknown> | undefined
  const cols = (adict?.columns ?? {}) as Record<string, string>
  const accountTypeLabels = (adict?.accountTypes ?? {}) as Record<string, string>
  const statusLabels = (adict?.statuses ?? {}) as Record<string, string>
  const statsLabels = (adict?.stats ?? {}) as Record<string, string>

  const title = (adict?.title as string) ?? "Bank accounts"
  const subtitle = (adict?.subtitle as string) ?? ""
  const empty = (adict?.empty as string) ?? "No accounts yet."

  return (
    <div className="space-y-6 py-4 md:py-6">
      <header className="flex flex-wrap items-start justify-between gap-4 px-4 lg:px-6">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        <AccountDialog locale={lang} dict={adict} />
      </header>

      <div className="grid gap-4 px-4 md:grid-cols-2 lg:px-6">
        <StatCard
          title={statsLabels.totalBalance ?? "Total balance"}
          value={formatMoney(stats?.totalBalance ?? 0, stats?.currency ?? "SDG", lang)}
          icon={<Landmark className="size-4" />}
        />
        <StatCard
          title={statsLabels.activeAccounts ?? "Active accounts"}
          value={String(stats?.activeAccounts ?? 0)}
          icon={<Wallet className="size-4" />}
        />
      </div>

      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{subtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {empty}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{cols.accountName ?? "Account"}</TableHead>
                    <TableHead>{cols.bankName ?? "Bank"}</TableHead>
                    <TableHead>{cols.accountNumber ?? "Number"}</TableHead>
                    <TableHead>{cols.type ?? "Type"}</TableHead>
                    <TableHead className="text-end">{cols.balance ?? "Balance"}</TableHead>
                    <TableHead>{cols.status ?? "Status"}</TableHead>
                    <TableHead className="text-end">{cols.actions ?? "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{a.accountName}</span>
                          {a.isDefault ? (
                            <Badge variant="outline" className="text-xs">
                              ★
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p>{a.bankName}</p>
                          {a.bankBranch ? (
                            <p className="text-xs text-muted-foreground">
                              {a.bankBranch}
                            </p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {a.accountNumber}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{accountTypeLabels[a.accountType] ?? a.accountType}</span>
                          <span className="font-mono text-xs text-muted-foreground">
                            {a.currency}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-end tabular-nums">
                        {formatMoney(a.currentBalance, a.currency, lang)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={a.status === "ACTIVE" ? "default" : "secondary"}>
                          {statusLabels[a.status] ?? a.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <RowActions account={a} locale={lang} dict={adict} />
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
