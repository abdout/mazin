// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"
import {
  CircleAlert,
  CircleCheck,
  DollarSign,
  Receipt,
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

import { getExpenses, getExpenseCategories, getExpenseSummary } from "./actions"
import { NewExpenseDialog } from "./new-expense-dialog"
import { RowActions } from "./row-actions"

interface Props {
  dictionary: Dictionary
  lang: Locale
}

interface ExpenseRow {
  id: string
  expenseNumber: string
  description: string
  vendor: string | null
  amount: number
  currency: string
  status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "PAID" | "CANCELLED"
  expenseDate: Date
  category: { id: string; name: string; nameAr: string | null } | null
  shipment: { id: string; shipmentNumber: string; description: string | null } | null
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

function formatDate(date: Date, locale: Locale) {
  try {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-SD" : "en-US", {
      dateStyle: "medium",
    }).format(date)
  } catch {
    return date.toLocaleDateString()
  }
}

function statusVariant(status: ExpenseRow["status"]): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "APPROVED":
    case "PAID":
      return "default"
    case "PENDING":
      return "secondary"
    case "REJECTED":
    case "CANCELLED":
      return "destructive"
    default:
      return "outline"
  }
}

export default async function ExpensesContent({ dictionary, lang }: Props) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/${lang}/login?callbackUrl=/${lang}/finance/expenses`)
  }

  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const [listRes, summaryRes, categoriesRes] = await Promise.all([
    getExpenses({ pageSize: 50 }),
    getExpenseSummary({ startDate: monthStart }),
    getExpenseCategories(),
  ])

  const rows = (listRes.success && listRes.data ? listRes.data.data : []) as ExpenseRow[]
  const summary = summaryRes.success && summaryRes.data ? summaryRes.data : null
  const categories =
    (categoriesRes.success && categoriesRes.data ? categoriesRes.data : []) as Array<{
      id: string
      name: string
      nameAr: string | null
    }>

  const edict = dictionary.finance?.expenses as Record<string, unknown> | undefined
  const title = (edict?.title as string) ?? "Expenses"
  const subtitle = (edict?.subtitle as string) ?? ""
  const stats = (edict?.stats ?? {}) as Record<string, string>
  const cols = (edict?.columns ?? {}) as Record<string, string>
  const statusLabels: Record<ExpenseRow["status"], string> = {
    DRAFT: (edict?.draft as string) ?? "Draft",
    PENDING: (edict?.pending as string) ?? "Pending",
    APPROVED: (edict?.approved as string) ?? "Approved",
    REJECTED: (edict?.rejected as string) ?? "Rejected",
    PAID: (edict?.paid as string) ?? "Paid",
    CANCELLED: (edict?.cancelled as string) ?? "Cancelled",
  }
  const empty = (edict?.empty as string) ?? "No expenses yet."

  // Stats are SDG-only for v1 (see dashboard/actions.ts rationale).
  const currency = "SDG"

  return (
    <div className="space-y-6 py-4 md:py-6">
      <header className="flex flex-wrap items-start justify-between gap-4 px-4 lg:px-6">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        <NewExpenseDialog locale={lang} dict={edict} categories={categories} />
      </header>

      <div className="grid gap-4 px-4 md:grid-cols-4 lg:px-6">
        <StatCard
          title={stats.totalThisMonth ?? "Total this month"}
          value={formatMoney(
            (summary?.totalPendingAmount ?? 0) +
              (summary?.totalApprovedAmount ?? 0) +
              (summary?.totalPaidAmount ?? 0),
            currency,
            lang
          )}
          icon={<DollarSign className="size-4" />}
        />
        <StatCard
          title={stats.pendingApproval ?? "Pending approval"}
          value={String(summary?.pendingExpenses ?? 0)}
          icon={<CircleAlert className="size-4" />}
        />
        <StatCard
          title={stats.approvedUnpaid ?? "Approved, unpaid"}
          value={String(summary?.approvedExpenses ?? 0)}
          icon={<CircleCheck className="size-4" />}
        />
        <StatCard
          title={stats.paidThisMonth ?? "Paid this month"}
          value={formatMoney(summary?.totalPaidAmount ?? 0, currency, lang)}
          icon={<Receipt className="size-4" />}
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
              <p className="py-8 text-center text-sm text-muted-foreground">{empty}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{cols.date ?? "Date"}</TableHead>
                    <TableHead>{cols.number ?? "No."}</TableHead>
                    <TableHead>{cols.description ?? "Description"}</TableHead>
                    <TableHead>{cols.category ?? "Category"}</TableHead>
                    <TableHead>{cols.vendor ?? "Vendor"}</TableHead>
                    <TableHead>{cols.shipment ?? "Shipment"}</TableHead>
                    <TableHead className="text-end">{cols.amount ?? "Amount"}</TableHead>
                    <TableHead>{cols.status ?? "Status"}</TableHead>
                    <TableHead className="text-end" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(new Date(r.expenseDate), lang)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{r.expenseNumber}</TableCell>
                      <TableCell>{r.description}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.category
                          ? (lang === "ar" && r.category.nameAr) || r.category.name
                          : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.vendor ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.shipment?.shipmentNumber ?? "—"}
                      </TableCell>
                      <TableCell className="text-end tabular-nums">
                        {formatMoney(r.amount, r.currency || "SDG", lang)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(r.status)}>
                          {statusLabels[r.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <RowActions
                          expenseId={r.id}
                          status={r.status}
                          locale={lang}
                          dict={edict}
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
