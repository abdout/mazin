"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import {
  Anchor,
  ChevronRight,
  CircleAlert,
  DollarSign,
  FileBarChart,
  FileText,
  TrendingUp,
  Users,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/types"
import {
  AreaChartStacked,
  InteractiveBarChart,
  RadialTextChart,
} from "@/components/platform/dashboard/charts"
import { getAccounts } from "./banking/actions/bank.actions"
import { getPayrollSummary } from "./payroll/actions"
import { getExpenseSummary } from "./expenses/actions"

interface Props {
  dictionary?: Dictionary
  lang: Locale
}

interface FinanceData {
  totalBalance: number
  totalExpenses: number
  pendingPayroll: number
  unpaidInvoices: number
  invoicesCount: number
  clientsWithChargesCount: number
  employeesWithSalaryCount: number
  pendingPayrollCount: number
  reportsCount: number
}

export default function FinanceContent({ dictionary, lang }: Props) {
  const d = dictionary?.finance
  const [data, setData] = useState<FinanceData>({
    totalBalance: 0,
    totalExpenses: 0,
    pendingPayroll: 0,
    unpaidInvoices: 0,
    invoicesCount: 0,
    clientsWithChargesCount: 0,
    employeesWithSalaryCount: 0,
    pendingPayrollCount: 0,
    reportsCount: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [accountsResult, payrollResult, expenseResult] = await Promise.all([
          getAccounts(),
          getPayrollSummary(),
          getExpenseSummary(),
        ])

        setData({
          totalBalance: accountsResult.success && accountsResult.data
            ? accountsResult.data.totalCurrentBalance
            : 0,
          totalExpenses: expenseResult.success && expenseResult.data
            ? expenseResult.data.totalPaidAmount
            : 0,
          pendingPayroll: payrollResult.success && payrollResult.data
            ? payrollResult.data.approvedRuns
            : 0,
          unpaidInvoices: 0, // Would need invoice actions
          invoicesCount: 0,
          clientsWithChargesCount: 0,
          employeesWithSalaryCount: payrollResult.success && payrollResult.data
            ? payrollResult.data.activeEmployees
            : 0,
          pendingPayrollCount: payrollResult.success && payrollResult.data
            ? payrollResult.data.pendingApproval + payrollResult.data.draftRuns
            : 0,
          reportsCount: 0,
        })
      } catch (error) {
        console.error("Error fetching finance data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString(lang === "ar" ? "ar-SD" : "en-US")
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats - Financial Health */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Bank Card with Image */}
        <div className="flex items-center justify-center">
          <Image
            src="/master-card.png"
            alt="Bank Card"
            width={1050}
            height={600}
            className="h-auto w-full max-w-md"
            priority
          />
        </div>

        {/* 2x2 Grid - Key Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">
                {d?.totalBalance ?? "Total Balance"}
              </CardTitle>
              <TrendingUp className="text-muted-foreground h-3.5 w-3.5" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {loading ? "..." : `${formatCurrency(data.totalBalance)} SDG`}
              </div>
              <p className="text-muted-foreground text-xs">
                {d?.allAccounts ?? "All accounts"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">
                {d?.totalExpenses ?? "Total Expenses"}
              </CardTitle>
              <DollarSign className="text-muted-foreground h-3.5 w-3.5" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {loading ? "..." : `${formatCurrency(data.totalExpenses)} SDG`}
              </div>
              <p className="text-muted-foreground text-xs">
                {d?.paid ?? "Paid"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">
                {d?.pendingPayroll ?? "Pending Payroll"}
              </CardTitle>
              <CircleAlert className="text-muted-foreground h-3.5 w-3.5" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {loading ? "..." : data.pendingPayrollCount}
              </div>
              <p className="text-muted-foreground text-xs">
                {d?.needApproval ?? "Need approval"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">
                {d?.activeEmployees ?? "Active Employees"}
              </CardTitle>
              <Users className="text-muted-foreground h-3.5 w-3.5" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {loading ? "..." : data.employeesWithSalaryCount}
              </div>
              <p className="text-muted-foreground text-xs">
                {d?.employees ?? "Employees"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts Section */}
      <div className="space-y-4">
        <InteractiveBarChart />
        <div className="grid gap-4 md:grid-cols-2">
          <RadialTextChart />
          <AreaChartStacked />
        </div>
      </div>

      {/* Finance Quick Look */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Banking */}
        <Card className="p-4">
          <CardContent className="space-y-3 p-0">
            <div className="flex items-center gap-3">
              <div className="bg-primary/15 flex h-10 w-10 items-center justify-center rounded-lg">
                <DollarSign className="text-primary h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground text-xs">
                  {d?.navigation?.banking ?? "Banking"}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold">
                    {loading ? "..." : formatCurrency(data.totalBalance)}
                  </p>
                  <span className="bg-muted text-muted-foreground rounded px-1.5 py-0 text-[10px]">
                    SDG
                  </span>
                </div>
              </div>
            </div>
            <Link
              href={`/${lang}/finance/banking`}
              className="text-primary inline-flex items-center text-xs hover:underline"
            >
              {d?.viewAccounts ?? "View Accounts"}{" "}
              <ChevronRight className="ml-1 h-3 w-3 rtl:mr-1 rtl:rotate-180" />
            </Link>
          </CardContent>
        </Card>

        {/* Payroll */}
        <Card className="p-4">
          <CardContent className="space-y-3 p-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/15">
                <Users className="h-5 w-5 text-orange-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground text-xs">
                  {d?.navigation?.payroll ?? "Payroll"}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold">
                    {loading ? "..." : data.employeesWithSalaryCount}
                  </p>
                  {data.pendingPayrollCount > 0 && (
                    <span className="rounded bg-amber-500/10 px-1.5 py-0 text-[10px] text-amber-600">
                      {data.pendingPayrollCount} {d?.pending ?? "pending"}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Link
              href={`/${lang}/finance/payroll`}
              className="text-primary inline-flex items-center text-xs hover:underline"
            >
              {d?.viewPayroll ?? "View Payroll"}{" "}
              <ChevronRight className="ml-1 h-3 w-3 rtl:mr-1 rtl:rotate-180" />
            </Link>
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card className="p-4">
          <CardContent className="space-y-3 p-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15">
                <FileText className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground text-xs">
                  {d?.navigation?.expenses ?? "Expenses"}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold">
                    {loading ? "..." : formatCurrency(data.totalExpenses)}
                  </p>
                  <span className="bg-muted text-muted-foreground rounded px-1.5 py-0 text-[10px]">
                    SDG
                  </span>
                </div>
              </div>
            </div>
            <Link
              href={`/${lang}/finance/expenses`}
              className="text-primary inline-flex items-center text-xs hover:underline"
            >
              {d?.viewExpenses ?? "View Expenses"}{" "}
              <ChevronRight className="ml-1 h-3 w-3 rtl:mr-1 rtl:rotate-180" />
            </Link>
          </CardContent>
        </Card>

        {/* Fees/Customs */}
        <Card className="p-4">
          <CardContent className="space-y-3 p-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/15">
                <Anchor className="h-5 w-5 text-blue-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground text-xs">
                  {d?.customsFees ?? "Customs Fees"}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold">
                    {dictionary?.common?.view ?? "View"}
                  </p>
                </div>
              </div>
            </div>
            <Link
              href={`/${lang}/finance/fees`}
              className="text-primary inline-flex items-center text-xs hover:underline"
            >
              {d?.viewFees ?? "View Fees"}{" "}
              <ChevronRight className="ml-1 h-3 w-3 rtl:mr-1 rtl:rotate-180" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href={`/${lang}/finance/banking/my-banks`}>
          <Card className="group hover:border-primary/30 cursor-pointer p-4 transition-all duration-300 hover:shadow-md">
            <CardContent className="p-0">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 text-primary group-hover:bg-primary/20 rounded-lg p-2 transition-colors">
                  <DollarSign className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {d?.addBankAccount ?? "Add Bank Account"}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {d?.manageAccounts ?? "Manage accounts"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/${lang}/finance/payroll`}>
          <Card className="group hover:border-primary/30 cursor-pointer p-4 transition-all duration-300 hover:shadow-md">
            <CardContent className="p-0">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-orange-500/10 p-2 text-orange-500 transition-colors group-hover:bg-orange-500/20">
                  <Users className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {d?.processPayroll ?? "Process Payroll"}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {d?.monthlyPayroll ?? "Monthly payroll"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/${lang}/finance/expenses`}>
          <Card className="group hover:border-primary/30 cursor-pointer p-4 transition-all duration-300 hover:shadow-md">
            <CardContent className="p-0">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-500/10 p-2 text-amber-500 transition-colors group-hover:bg-amber-500/20">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {d?.addExpense ?? "Add Expense"}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {d?.trackExpenses ?? "Track expenses"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/${lang}/finance/reports`}>
          <Card className="group hover:border-primary/30 cursor-pointer p-4 transition-all duration-300 hover:shadow-md">
            <CardContent className="p-0">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-500/10 p-2 text-blue-500 transition-colors group-hover:bg-blue-500/20">
                  <FileBarChart className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {d?.generateReport ?? "Generate Report"}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {d?.financialReports ?? "Financial reports"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
