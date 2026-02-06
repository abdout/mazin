"use client"

import * as React from "react"
import { format } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { TrendingUp, TrendingDown, Wallet, PieChartIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type {
  FinancialChartData,
  CashFlowData,
  ExpenseCategory,
} from "./actions"
import type { Dictionary, Locale } from "@/components/internationalization"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { useLocale } from "@/components/internationalization/use-locale"

/**
 * FinanceOverview Component - Hogwarts Edition
 * Combines Revenue, Cash Flow, and Expense charts
 * with elegant parchment-style design
 */

interface FinanceOverviewProps {
  financialData: FinancialChartData
  cashFlowData: CashFlowData
  expenseCategories: ExpenseCategory[]
  dictionary?: Dictionary
  locale?: Locale
  className?: string
}

// Expense chart colors - jewel tones
const EXPENSE_COLORS = [
  "#3b82f6", // Royal blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ef4444", // Ruby
  "#8b5cf6", // Amethyst
  "#ec4899", // Rose
  "#14b8a6", // Teal
  "#f97316", // Copper
]

export function FinanceOverview({
  financialData,
  cashFlowData,
  expenseCategories,
  dictionary: propDictionary,
  locale: propLocale,
  className,
}: FinanceOverviewProps) {
  const hookDictionary = useDictionary()
  const { locale: hookLocale } = useLocale()

  const dictionary = propDictionary ?? hookDictionary
  const locale = propLocale ?? hookLocale

  const f = dictionary.finance
  const dateLocale = locale === "ar" ? ar : enUS

  // Generate labels if not provided
  const monthLabels =
    financialData.labels ||
    Array.from({ length: 12 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (11 - i))
      return format(date, "MMM", { locale: dateLocale })
    })

  // Prepare revenue chart data
  const revenueChartData = monthLabels.map((label, index) => ({
    month: label,
    revenue: financialData.revenueData[index] || 0,
    expense: financialData.expenseData[index] || 0,
    profit: financialData.profitData[index] || 0,
  }))

  // Prepare cash flow data
  const cashFlowChartData = [
    {
      name: "Inflow",
      value: cashFlowData.inflowData[0] || 0,
      color: "#10b981",
    },
    {
      name: "Outflow",
      value: cashFlowData.outflowData[0] || 0,
      color: "#ef4444",
    },
    {
      name: "Net",
      value:
        (cashFlowData.inflowData[0] || 0) - (cashFlowData.outflowData[0] || 0),
      color: "#3b82f6",
    },
  ]

  // Sort and prepare expense data
  const sortedExpenses = [...expenseCategories].sort(
    (a, b) => b.amount - a.amount
  )
  const topExpenses = sortedExpenses.slice(0, 6)

  const formatYAxis = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
    return value.toString()
  }

  const formatCurrency = (value: number) =>
    `SDG ${new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SD").format(value)}`

  // Calculate totals
  const totalRevenue = financialData.revenueData.reduce((a, b) => a + b, 0)
  const totalExpenses = financialData.expenseData.reduce((a, b) => a + b, 0)
  const totalProfit = totalRevenue - totalExpenses
  const currentBalance = cashFlowData.balanceData[0] || 0
  const netCashFlow =
    (cashFlowData.inflowData[0] || 0) - (cashFlowData.outflowData[0] || 0)

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null

    return (
      <div className="bg-background/95 backdrop-blur-sm rounded-lg border border-amber-200/30 dark:border-amber-800/30 p-3 shadow-lg">
        <p className="font-semibold text-sm mb-1">{label || payload[0]?.name}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground capitalize">
              {entry.name}:
            </span>
            <span className="font-medium">
              {formatCurrency(Math.abs(entry.value))}
            </span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Main charts grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Revenue & Expenses - Takes 2 columns */}
        <Card
          className={cn(
            "lg:col-span-2",
            "bg-gradient-to-br from-stone-50/80 via-amber-50/30 to-stone-50/60",
            "dark:from-stone-900/80 dark:via-amber-950/20 dark:to-stone-900/60",
            "border-amber-200/40 dark:border-amber-900/40",
            "shadow-md"
          )}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/10">
                  <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <CardTitle className="text-base">
                    {f?.revenueExpenses || "Revenue & Expenses"}
                  </CardTitle>
                  <p className="text-muted-foreground text-xs">
                    {f?.lastMonths || "Last 12 months"}
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueChartData}>
                <defs>
                  <linearGradient
                    id="revenueGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id="expenseGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-amber-200/30 dark:stroke-amber-800/30"
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "currentColor", fontSize: 10 }}
                  axisLine={{ stroke: "currentColor", strokeOpacity: 0.2 }}
                />
                <YAxis
                  tick={{ fill: "currentColor", fontSize: 10 }}
                  tickFormatter={formatYAxis}
                  axisLine={{ stroke: "currentColor", strokeOpacity: 0.2 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: "12px" }}
                  iconType="circle"
                  iconSize={8}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#revenueGradient)"
                  name="Revenue"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#expenseGradient)"
                  name="Expenses"
                />
              </AreaChart>
            </ResponsiveContainer>

            {/* Summary stats */}
            <div className="mt-4 grid grid-cols-3 gap-4 border-t border-amber-200/30 dark:border-amber-800/30 pt-4">
              <div className="text-center">
                <p className="text-muted-foreground text-xs">{f?.avgRevenue || "Avg Revenue"}</p>
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(Math.round(totalRevenue / 12))}
                </p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground text-xs">{f?.avgExpenses || "Avg Expenses"}</p>
                <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                  {formatCurrency(Math.round(totalExpenses / 12))}
                </p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground text-xs">{f?.avgProfit || "Avg Profit"}</p>
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {formatCurrency(Math.round(totalProfit / 12))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cash Flow - Right column */}
        <Card
          className={cn(
            "bg-gradient-to-br from-stone-50/80 via-amber-50/30 to-stone-50/60",
            "dark:from-stone-900/80 dark:via-amber-950/20 dark:to-stone-900/60",
            "border-amber-200/40 dark:border-amber-900/40",
            "shadow-md"
          )}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10">
                <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-base">{f?.cashFlow || "Cash Flow"}</CardTitle>
                <p className="text-muted-foreground text-xs">{f?.currentPeriod || "Current period"}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={cashFlowChartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-amber-200/30 dark:stroke-amber-800/30"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "currentColor", fontSize: 10 }}
                />
                <YAxis
                  tick={{ fill: "currentColor", fontSize: 10 }}
                  tickFormatter={formatYAxis}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {cashFlowChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Cash summary */}
            <div className="mt-4 space-y-2 border-t border-amber-200/30 dark:border-amber-800/30 pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{f?.balance || "Balance"}</span>
                <span className="font-semibold">
                  {formatCurrency(currentBalance)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{f?.netFlow || "Net Flow"}</span>
                <span
                  className={cn(
                    "font-semibold",
                    netCashFlow >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  )}
                >
                  {netCashFlow >= 0 ? "+" : ""}
                  {formatCurrency(netCashFlow)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expense Breakdown - Full width */}
      <Card
        className={cn(
          "bg-gradient-to-br from-stone-50/80 via-amber-50/30 to-stone-50/60",
          "dark:from-stone-900/80 dark:via-amber-950/20 dark:to-stone-900/60",
          "border-amber-200/40 dark:border-amber-900/40",
          "shadow-md"
        )}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/10">
              <PieChartIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-base">{f?.expenseBreakdown || "Expense Breakdown"}</CardTitle>
              <p className="text-muted-foreground text-xs">{f?.byCategory || "By category"}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Pie chart */}
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={topExpenses.map(e => ({ ...e, name: e.category, value: e.amount }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ percent }: { percent?: number }) =>
                      percent && percent >= 0.05 ? `${(percent * 100).toFixed(0)}%` : ""
                    }
                    labelLine={false}
                  >
                    {topExpenses.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Category breakdown list */}
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">{f?.totalExpenses || "Total Expenses"}</span>
                <span className="font-bold">
                  {formatCurrency(
                    topExpenses.reduce((sum, cat) => sum + cat.amount, 0)
                  )}
                </span>
              </div>
              {topExpenses.slice(0, 5).map((cat, index) => (
                <div
                  key={cat.category}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{
                        backgroundColor:
                          EXPENSE_COLORS[index % EXPENSE_COLORS.length],
                      }}
                    />
                    <span className="text-muted-foreground truncate max-w-[120px]">
                      {cat.category}
                    </span>
                  </div>
                  <div className="text-end">
                    <span className="font-medium">
                      {formatCurrency(cat.amount)}
                    </span>
                    <span className="text-muted-foreground ms-2 text-xs">
                      ({cat.percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
