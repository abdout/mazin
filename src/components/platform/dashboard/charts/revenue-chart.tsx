"use client"

import * as React from "react"
import { format } from "date-fns"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Dictionary } from "@/components/internationalization/types"

interface RevenueChartProps {
  revenueData: number[]
  expenseData: number[]
  profitData: number[]
  labels?: string[]
  className?: string
  dict?: Dictionary
}

// Custom tooltip — defined at module scope to avoid creating a new component each render.
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value?: number; name?: string; color?: string; payload?: Record<string, unknown> }>; label?: string }) {
  if (!active || !payload) return null

  return (
    <div className="bg-background rounded-lg border p-3 shadow-lg">
      <p className="font-semibold">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="capitalize">{entry.name}:</span>
          <span className="font-medium">
            SDG {new Intl.NumberFormat("en-SD").format(entry.value ?? 0)}
          </span>
        </div>
      ))}
    </div>
  )
}

// Format Y-axis ticks
function formatYAxis(value: number) {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`
  }
  return value.toString()
}

function RevenueChartInner({
  revenueData,
  expenseData,
  profitData,
  labels,
  className,
  dict,
}: RevenueChartProps) {
  const r = dict?.dashboard?.charts?.revenue
  // Generate labels if not provided (last 12 months)
  const monthLabels =
    labels ||
    Array.from({ length: 12 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (11 - i))
      return format(date, "MMM")
    })

  // Prepare data for charts
  const chartData = monthLabels.map((label, index) => ({
    month: label,
    revenue: revenueData[index] || 0,
    expense: expenseData[index] || 0,
    profit: profitData[index] || 0,
  }))

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{r?.title ?? "Revenue & Expenses"}</CardTitle>
        <CardDescription>
          {r?.description ?? "Monthly financial performance over the last 12 months"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="area" className="w-full">
          <TabsList className="grid w-full max-w-[400px] grid-cols-3">
            <TabsTrigger value="area">{r?.areaChart ?? "Area Chart"}</TabsTrigger>
            <TabsTrigger value="bar">{r?.barChart ?? "Bar Chart"}</TabsTrigger>
            <TabsTrigger value="line">{r?.lineChart ?? "Line Chart"}</TabsTrigger>
          </TabsList>

          <TabsContent value="area" className="mt-4">
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={chartData}>
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
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="month"
                  className="text-xs"
                  tick={{ fill: "currentColor" }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: "currentColor" }}
                  tickFormatter={formatYAxis}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#revenueGradient)"
                  name={r?.revenue ?? "Revenue"}
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#expenseGradient)"
                  name={r?.expenses ?? "Expenses"}
                />
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="bar" className="mt-4">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="month"
                  className="text-xs"
                  tick={{ fill: "currentColor" }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: "currentColor" }}
                  tickFormatter={formatYAxis}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="revenue" fill="#10b981" name={r?.revenue ?? "Revenue"} />
                <Bar dataKey="expense" fill="#ef4444" name={r?.expenses ?? "Expenses"} />
                <Bar dataKey="profit" fill="#3b82f6" name={r?.profit ?? "Profit"} />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="line" className="mt-4">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="month"
                  className="text-xs"
                  tick={{ fill: "currentColor" }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: "currentColor" }}
                  tickFormatter={formatYAxis}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name={r?.revenue ?? "Revenue"}
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name={r?.expenses ?? "Expenses"}
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name={r?.profit ?? "Profit"}
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4 border-t pt-6">
          <div className="text-center">
            <p className="text-muted-foreground text-sm">
              {r?.avgMonthlyRevenue ?? "Avg Monthly Revenue"}
            </p>
            <p className="text-lg font-semibold text-green-600">
              SDG{" "}
              {new Intl.NumberFormat("en-SD").format(
                revenueData.reduce((a, b) => a + b, 0) / revenueData.length
              )}
            </p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground text-sm">
              {r?.avgMonthlyExpenses ?? "Avg Monthly Expenses"}
            </p>
            <p className="text-lg font-semibold text-red-600">
              SDG{" "}
              {new Intl.NumberFormat("en-SD").format(
                expenseData.reduce((a, b) => a + b, 0) / expenseData.length
              )}
            </p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground text-sm">
              {r?.avgMonthlyProfit ?? "Avg Monthly Profit"}
            </p>
            <p className="text-lg font-semibold text-blue-600">
              SDG{" "}
              {new Intl.NumberFormat("en-SD").format(
                profitData.reduce((a, b) => a + b, 0) / profitData.length
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export const RevenueChart = React.memo(RevenueChartInner)
