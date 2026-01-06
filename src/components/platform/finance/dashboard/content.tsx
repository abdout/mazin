import { auth } from "@/auth"
import {
  Building,
  DollarSign,
  Receipt,
  Users,
} from "lucide-react"

import type { Locale } from "@/components/internationalization"
import { UserRole } from "../lib/permissions"
import {
  getDashboardStats,
  getFinancialAlerts,
  getQuickActionsForRole,
  getRecentTransactions,
} from "./actions"
import { AlertCard } from "./alert-card"
import { BankAccountsSummary } from "./bank-accounts-summary"
import { CashFlowChart } from "./cash-flow-chart"
import { ExpenseChart } from "./expense-chart"
import { KPICard } from "./kpi-card"
import { QuickActions } from "./quick-actions"
import { RevenueChart } from "./revenue-chart"
import { TransactionList } from "./transaction-list"
import type { FinancialKPI } from "./types"

interface FinanceDashboardContentProps {
  locale: Locale
  dictionary: Record<string, any>
}

export async function FinanceDashboardContent({
  locale,
  dictionary,
}: FinanceDashboardContentProps) {
  const session = await auth()
  const isRTL = locale === "ar"
  const t = dictionary.finance ?? {}
  const common = dictionary.common ?? {}

  if (!session?.user) {
    return <div>{isRTL ? "غير مصرح" : "Unauthorized"}</div>
  }

  const userRole = (session.user.role || "VIEWER") as UserRole

  // Fetch all lab data in parallel
  const [stats, transactions, alerts, quickActions] = await Promise.all([
    getDashboardStats("month"),
    getRecentTransactions(5),
    getFinancialAlerts(),
    getQuickActionsForRole(userRole),
  ])

  // Prepare KPIs based on role with i18n
  const getKPIsForRole = (): FinancialKPI[] => {
    const allKPIs: FinancialKPI[] = [
      {
        id: "total-revenue",
        title: t.totalRevenue ?? "Total Revenue",
        value: stats.totalRevenue,
        change: 12,
        changeType: "increase",
        icon: "💰",
        color: "green",
        description: isRTL ? "إجمالي المبلغ المفوتر" : "Total invoiced amount",
        trend: stats.revenueTrend.slice(-7),
      },
      {
        id: "collected-revenue",
        title: t.collectedRevenue ?? "Collected Revenue",
        value: stats.collectedRevenue,
        change: stats.collectionRate > 75 ? 5 : -5,
        changeType: stats.collectionRate > 75 ? "increase" : "decrease",
        icon: "✅",
        color: "blue",
        description: `${stats.collectionRate.toFixed(1)}% ${t.collectionRate ?? "collection rate"}`,
      },
      {
        id: "total-expenses",
        title: t.totalExpenses ?? "Total Expenses",
        value: stats.totalExpenses,
        change: 3,
        changeType: "increase",
        icon: "💸",
        color: "red",
        description: isRTL ? "جميع المصروفات في هذه الفترة" : "All expenses this period",
      },
      {
        id: "net-profit",
        title: t.netProfit ?? "Net Profit",
        value: stats.netProfit,
        change: stats.profitMargin,
        changeType: stats.netProfit > 0 ? "increase" : "decrease",
        icon: "📈",
        color: stats.netProfit > 0 ? "green" : "red",
        description: `${stats.profitMargin.toFixed(1)}% ${t.profitMargin ?? "profit margin"}`,
        trend: stats.profitTrend.slice(-7),
      },
      {
        id: "cash-balance",
        title: t.cashBalance ?? "Cash Balance",
        value: stats.cashBalance,
        change: 8,
        changeType: "increase",
        icon: "🏦",
        color: "purple",
        description: `${stats.cashRunway} ${isRTL ? "شهور متبقية" : "months runway"}`,
      },
      {
        id: "outstanding-invoices",
        title: t.outstandingPayments ?? "Outstanding",
        value: stats.outstandingRevenue,
        change: stats.overdueInvoices,
        changeType: stats.overdueInvoices > 0 ? "increase" : "neutral",
        icon: "⏰",
        color: "yellow",
        description: `${stats.overdueInvoices} ${t.overdueInvoices ?? "overdue invoices"}`,
      },
      {
        id: "active-clients",
        title: isRTL ? "العملاء النشطون" : "Active Clients",
        value: `${stats.activeClients}/${stats.totalClients}`,
        change: stats.totalClients > 0 ? (stats.activeClients / stats.totalClients) * 100 : 0,
        changeType: "neutral",
        icon: "👥",
        color: "blue",
        description: isRTL ? "حالة دفع العملاء" : "Client payment status",
      },
      {
        id: "payroll-expense",
        title: t.navigation?.payroll ?? "Payroll",
        value: stats.totalPayroll,
        change: 0,
        changeType: "neutral",
        icon: "💼",
        color: "orange",
        description: `${stats.payrollProcessed} ${isRTL ? "مُعالَج" : "processed"}, ${stats.pendingPayroll} ${isRTL ? "معلق" : "pending"}`,
      },
    ]

    // Filter KPIs based on role
    switch (userRole) {
      case "ADMIN":
      case "ACCOUNTANT":
        return allKPIs
      case "MANAGER":
      case "OPERATOR":
        return allKPIs.filter((kpi) =>
          ["net-profit", "payroll-expense", "total-revenue", "active-clients"].includes(kpi.id)
        )
      case "STAFF":
        return allKPIs.filter((kpi) =>
          ["active-clients", "outstanding-invoices"].includes(kpi.id)
        )
      default:
        return allKPIs.slice(0, 4)
    }
  }

  const kpis = getKPIsForRole()

  // Check if user has full access
  const hasFullAccess = ["ADMIN", "ACCOUNTANT"].includes(userRole)
  const hasLimitedAccess = ["MANAGER", "OPERATOR"].includes(userRole)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t.dashboard ?? "Financial Dashboard"}
        </h1>
        <p className="text-muted-foreground">
          {t.overview ?? (isRTL ? "نظرة عامة على الأداء المالي لشركتك" : "Overview of your company's financial performance")}
        </p>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.slice(0, 2).map((alert) => (
            <AlertCard key={alert.id} alert={alert} locale={locale} />
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <KPICard key={kpi.id} kpi={kpi} locale={locale} />
        ))}
      </div>

      {/* Charts Section */}
      {hasFullAccess && (
        <div className="grid gap-6 md:grid-cols-2">
          <RevenueChart
            revenueData={stats.revenueTrend}
            expenseData={stats.expensesTrend}
            profitData={stats.profitTrend}
            locale={locale}
            dictionary={dictionary}
          />
          <ExpenseChart expenseCategories={stats.expenseCategories} locale={locale} />
        </div>
      )}

      {/* Additional Charts */}
      {hasFullAccess && (
        <div className="grid gap-6 md:grid-cols-2">
          <CashFlowChart
            inflowData={[stats.cashInflow]}
            outflowData={[stats.cashOutflow]}
            balanceData={[stats.cashBalance]}
            locale={locale}
          />
          <BankAccountsSummary accounts={stats.bankAccounts} locale={locale} />
        </div>
      )}

      {/* Quick Actions and Recent Transactions */}
      <div className="grid gap-6 md:grid-cols-2">
        <QuickActions actions={quickActions} locale={locale} dictionary={dictionary} />
        {(hasFullAccess || hasLimitedAccess) && (
          <TransactionList transactions={transactions} locale={locale} />
        )}
      </div>

      {/* Budget Overview - Only for Admin/Accountant */}
      {hasFullAccess && stats.budgetCategories.length > 0 && (
        <BudgetOverview categories={stats.budgetCategories} locale={locale} dictionary={dictionary} />
      )}

      {/* Footer Stats */}
      <div className="grid gap-4 border-t pt-6 md:grid-cols-4">
        <StatCard
          title={isRTL ? "تحصيل الفواتير" : "Invoice Collection"}
          value={`${stats.paidInvoices}/${stats.totalInvoices}`}
          description={isRTL ? "فواتير مدفوعة" : "Invoices paid"}
          icon={<Receipt className="h-4 w-4" />}
        />
        <StatCard
          title={isRTL ? "استخدام الميزانية" : "Budget Utilization"}
          value={`${((stats.budgetUsed / (stats.budgetUsed + stats.budgetRemaining)) * 100).toFixed(0)}%`}
          description={isRTL ? "من الميزانية المخصصة" : "Of allocated budget"}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <StatCard
          title={isRTL ? "العملاء النشطون" : "Active Clients"}
          value={stats.totalClients}
          description={isRTL ? "عملاء مسجلون" : "Registered clients"}
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          title={isRTL ? "الحسابات البنكية" : "Bank Accounts"}
          value={stats.bankAccounts.length}
          description={isRTL ? "حسابات نشطة" : "Active accounts"}
          icon={<Building className="h-4 w-4" />}
        />
      </div>
    </div>
  )
}

// Helper Components
function StatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string
  value: string | number
  description: string
  icon: React.ReactNode
}) {
  return (
    <div className="bg-muted/50 flex items-center gap-3 rounded-lg p-4">
      <div className="bg-background rounded-md p-2">{icon}</div>
      <div>
        <p className="text-muted-foreground text-sm">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-muted-foreground text-xs">{description}</p>
      </div>
    </div>
  )
}

function BudgetOverview({
  categories,
  locale,
  dictionary,
}: {
  categories: {
    category: string
    allocated: number
    spent: number
    remaining: number
    percentage: number
  }[]
  locale: Locale
  dictionary: Record<string, any>
}) {
  const isRTL = locale === "ar"
  const t = dictionary.finance?.budget ?? {}

  return (
    <div className="rounded-lg border p-6">
      <h3 className="mb-4 text-lg font-semibold">{t.title ?? (isRTL ? "نظرة عامة على الميزانية" : "Budget Overview")}</h3>
      <div className="space-y-3">
        {categories.slice(0, 5).map((cat) => (
          <div key={cat.category} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>{cat.category}</span>
              <span className="text-muted-foreground">
                {isRTL ? "ج.س" : "SDG"} {new Intl.NumberFormat(isRTL ? "ar-SD" : "en-SD").format(cat.spent)} /{" "}
                {new Intl.NumberFormat(isRTL ? "ar-SD" : "en-SD").format(cat.allocated)}
              </span>
            </div>
            <div className="bg-muted h-2 w-full rounded-full">
              <div
                className={`h-2 rounded-full transition-all ${
                  cat.percentage > 90
                    ? "bg-red-500"
                    : cat.percentage > 75
                      ? "bg-yellow-500"
                      : "bg-green-500"
                }`}
                style={{ width: `${Math.min(cat.percentage, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
