/**
 * Finance Dashboard Server Actions
 * Real implementation with Prisma queries
 */

"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, isAfter } from "date-fns"

import type { DashboardStats, FinancialAlert, RecentTransaction } from "./types"

// Helper to get date range based on filter
function getDateRange(dateRange: "month" | "quarter" | "year") {
  const now = new Date()
  let startDate: Date
  let endDate = now

  switch (dateRange) {
    case "quarter":
      startDate = subMonths(now, 3)
      break
    case "year":
      startDate = startOfYear(now)
      break
    case "month":
    default:
      startDate = startOfMonth(now)
      break
  }

  return { startDate, endDate }
}

// Helper to get trend data for last 12 months
async function getMonthlyTrend(
  userId: string,
  type: "revenue" | "expenses" | "profit" | "shipments"
): Promise<number[]> {
  const months: number[] = []
  const now = new Date()

  for (let i = 11; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i))
    const monthEnd = endOfMonth(subMonths(now, i))

    let value = 0

    switch (type) {
      case "revenue": {
        const invoices = await db.invoice.aggregate({
          where: {
            userId,
            status: "PAID",
            paidAt: { gte: monthStart, lte: monthEnd },
          },
          _sum: { total: true },
        })
        value = Number(invoices._sum.total || 0)
        break
      }
      case "expenses": {
        const expenses = await db.expense.aggregate({
          where: {
            userId,
            status: "PAID",
            paidAt: { gte: monthStart, lte: monthEnd },
          },
          _sum: { totalAmount: true },
        })
        value = Number(expenses._sum.totalAmount || 0)
        break
      }
      case "shipments": {
        const count = await db.shipment.count({
          where: {
            userId,
            createdAt: { gte: monthStart, lte: monthEnd },
          },
        })
        value = count
        break
      }
    }

    months.push(value)
  }

  // For profit, calculate from revenue - expenses
  if (type === "profit") {
    const revenue = await getMonthlyTrend(userId, "revenue")
    const expenses = await getMonthlyTrend(userId, "expenses")
    return revenue.map((r, i) => r - expenses[i])
  }

  return months
}

export async function getDashboardStats(
  dateRange: "month" | "quarter" | "year" = "month"
): Promise<DashboardStats> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const userId = session.user.id
  const { startDate, endDate } = getDateRange(dateRange)

  try {
    // Fetch all data in parallel
    const [
      invoiceStats,
      paidInvoices,
      pendingInvoiceStats,
      overdueInvoices,
      expenseStats,
      bankAccounts,
      clientCount,
      activeClientCount,
      shipmentStats,
      budgetStats,
      payrollStats,
    ] = await Promise.all([
      // Total invoiced (all statuses except cancelled)
      db.invoice.aggregate({
        where: {
          userId,
          status: { not: "CANCELLED" },
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: { total: true },
        _count: true,
      }),

      // Paid invoices
      db.invoice.aggregate({
        where: {
          userId,
          status: "PAID",
          paidAt: { gte: startDate, lte: endDate },
        },
        _sum: { total: true },
        _count: true,
      }),

      // Pending invoices
      db.invoice.aggregate({
        where: {
          userId,
          status: { in: ["DRAFT", "SENT"] },
        },
        _sum: { total: true },
        _count: true,
      }),

      // Overdue invoices
      db.invoice.findMany({
        where: {
          userId,
          status: "SENT",
          dueDate: { lt: new Date() },
        },
        select: { id: true, total: true },
      }),

      // Total expenses
      db.expense.aggregate({
        where: {
          userId,
          status: "PAID",
          paidAt: { gte: startDate, lte: endDate },
        },
        _sum: { totalAmount: true },
        _count: true,
      }),

      // Bank accounts with balances
      db.bankAccount.findMany({
        where: { userId, status: "ACTIVE" },
        select: {
          accountName: true,
          currentBalance: true,
          currency: true,
          accountType: true,
        },
      }),

      // Total clients
      db.client.count({ where: { userId } }),

      // Active clients (with invoices in period)
      db.client.count({
        where: {
          userId,
          invoices: {
            some: {
              createdAt: { gte: startDate, lte: endDate },
            },
          },
        },
      }),

      // Shipment stats
      db.shipment.groupBy({
        by: ["status"],
        where: { userId },
        _count: true,
      }),

      // Budget stats (current year)
      db.budget.findFirst({
        where: {
          userId,
          status: "ACTIVE",
          fiscalYear: new Date().getFullYear(),
        },
        include: {
          items: true,
        },
      }),

      // Payroll stats
      db.payroll.aggregate({
        where: {
          userId,
          periodStart: { gte: startDate },
        },
        _sum: { totalNet: true },
        _count: true,
      }),
    ])

    // Calculate expense categories
    const expenseByCategory = await db.expense.groupBy({
      by: ["categoryId"],
      where: {
        userId,
        status: "PAID",
        paidAt: { gte: startDate, lte: endDate },
      },
      _sum: { totalAmount: true },
    })

    const categories = await db.expenseCategory.findMany({
      where: { userId },
      select: { id: true, name: true },
    })

    const categoryMap = new Map(categories.map((c) => [c.id, c.name]))
    const totalExpenses = Number(expenseStats._sum.totalAmount || 0)

    const expenseCategories = expenseByCategory.map((e) => ({
      category: categoryMap.get(e.categoryId) || "Other",
      amount: Number(e._sum.totalAmount || 0),
      percentage: totalExpenses > 0
        ? (Number(e._sum.totalAmount || 0) / totalExpenses) * 100
        : 0,
    }))

    // Calculate metrics
    const totalRevenue = Number(invoiceStats._sum.total || 0)
    const collectedRevenue = Number(paidInvoices._sum.total || 0)
    const outstandingRevenue = Number(pendingInvoiceStats._sum.total || 0)
    const collectionRate = totalRevenue > 0 ? (collectedRevenue / totalRevenue) * 100 : 0

    const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + Number(inv.total), 0)

    const grossProfit = collectedRevenue - totalExpenses
    const netProfit = grossProfit // Simplified - should subtract taxes
    const profitMargin = collectedRevenue > 0 ? (netProfit / collectedRevenue) * 100 : 0

    const cashBalance = bankAccounts.reduce((sum, acc) => sum + Number(acc.currentBalance), 0)
    const avgMonthlyExpense = totalExpenses || 1
    const cashRunway = Math.floor(cashBalance / avgMonthlyExpense)

    // Shipment calculations
    const totalShipments = shipmentStats.reduce((sum, s) => sum + s._count, 0)
    const activeShipments = shipmentStats
      .filter((s) => !["DELIVERED", "CANCELLED"].includes(s.status))
      .reduce((sum, s) => sum + s._count, 0)
    const completedShipments = shipmentStats
      .filter((s) => s.status === "DELIVERED")
      .reduce((sum, s) => sum + s._count, 0)

    const averageRevenuePerShipment = completedShipments > 0
      ? collectedRevenue / completedShipments
      : 0

    // Budget calculations
    const budgetCategories = budgetStats?.items.map((item) => ({
      category: item.categoryName,
      allocated: Number(item.allocated),
      spent: Number(item.spent),
      remaining: Number(item.remaining),
      percentage: Number(item.allocated) > 0
        ? (Number(item.spent) / Number(item.allocated)) * 100
        : 0,
    })) || []

    const budgetUsed = budgetCategories.reduce((sum, b) => sum + b.spent, 0)
    const budgetRemaining = budgetCategories.reduce((sum, b) => sum + b.remaining, 0)

    // Get trends
    const [revenueTrend, expensesTrend, shipmentsTrend] = await Promise.all([
      getMonthlyTrend(userId, "revenue"),
      getMonthlyTrend(userId, "expenses"),
      getMonthlyTrend(userId, "shipments"),
    ])

    const profitTrend = revenueTrend.map((r, i) => r - expensesTrend[i])

    // Clients with outstanding
    const clientsWithOutstanding = await db.client.count({
      where: {
        userId,
        invoices: {
          some: {
            status: { in: ["SENT", "OVERDUE"] },
          },
        },
      },
    })

    return {
      // Revenue Metrics
      totalRevenue,
      collectedRevenue,
      outstandingRevenue,
      collectionRate,

      // Expense Metrics
      totalExpenses,
      budgetUsed,
      budgetRemaining,
      expenseCategories,

      // Profit Metrics
      grossProfit,
      netProfit,
      profitMargin,

      // Cash Flow Metrics
      cashBalance,
      cashInflow: collectedRevenue,
      cashOutflow: totalExpenses,
      cashRunway,

      // Invoice Metrics
      totalInvoices: invoiceStats._count,
      paidInvoices: paidInvoices._count,
      pendingInvoices: pendingInvoiceStats._count,
      overdueInvoices: overdueInvoices.length,
      overdueAmount,

      // Payroll Metrics
      totalPayroll: Number(payrollStats._sum.totalNet || 0),
      payrollProcessed: payrollStats._count,
      pendingPayroll: 0, // Would need additional query

      // Clearance Operations Metrics
      totalShipments,
      activeShipments,
      completedShipments,
      averageRevenuePerShipment,

      // Client Metrics
      totalClients: clientCount,
      activeClients: activeClientCount,
      clientsWithOutstanding,
      averageClientBalance: clientCount > 0 ? outstandingRevenue / clientCount : 0,

      // Banking Metrics
      bankAccounts: bankAccounts.map((acc) => ({
        name: acc.accountName,
        balance: Number(acc.currentBalance),
        currency: acc.currency,
        type: acc.accountType,
      })),

      // Budget Metrics
      budgetCategories,

      // Trends
      revenueTrend,
      expensesTrend,
      profitTrend,
      shipmentsTrend,
    }
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    // Return empty stats on error
    return {
      totalRevenue: 0,
      collectedRevenue: 0,
      outstandingRevenue: 0,
      collectionRate: 0,
      totalExpenses: 0,
      budgetUsed: 0,
      budgetRemaining: 0,
      expenseCategories: [],
      grossProfit: 0,
      netProfit: 0,
      profitMargin: 0,
      cashBalance: 0,
      cashInflow: 0,
      cashOutflow: 0,
      cashRunway: 0,
      totalInvoices: 0,
      paidInvoices: 0,
      pendingInvoices: 0,
      overdueInvoices: 0,
      overdueAmount: 0,
      totalPayroll: 0,
      payrollProcessed: 0,
      pendingPayroll: 0,
      totalShipments: 0,
      activeShipments: 0,
      completedShipments: 0,
      averageRevenuePerShipment: 0,
      totalClients: 0,
      activeClients: 0,
      clientsWithOutstanding: 0,
      averageClientBalance: 0,
      bankAccounts: [],
      budgetCategories: [],
      revenueTrend: [],
      expensesTrend: [],
      profitTrend: [],
      shipmentsTrend: [],
    }
  }
}

export async function getRecentTransactions(
  limit = 10
): Promise<RecentTransaction[]> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    const transactions = await db.transaction.findMany({
      where: { userId: session.user.id },
      orderBy: { transactionDate: "desc" },
      take: limit,
      include: {
        bankAccount: { select: { accountName: true } },
        expense: { select: { category: { select: { name: true } } } },
      },
    })

    return transactions.map((t) => ({
      id: t.id,
      type: t.type === "CREDIT"
        ? "income"
        : t.type === "DEBIT"
          ? "expense"
          : "transfer",
      description: t.description,
      amount: Number(t.amount),
      currency: t.currency,
      date: t.transactionDate,
      status: t.status === "COMPLETED" || t.status === "RECONCILED"
        ? "completed"
        : t.status === "FAILED" || t.status === "CANCELLED"
          ? "failed"
          : "pending",
      category: t.expense?.category?.name || t.category,
      reference: t.reference || undefined,
      shipmentId: t.shipmentId || undefined,
    }))
  } catch (error) {
    console.error("Error fetching recent transactions:", error)
    return []
  }
}

export async function getFinancialAlerts(): Promise<FinancialAlert[]> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const alerts: FinancialAlert[] = []
  const userId = session.user.id

  try {
    // Check for overdue invoices
    const overdueInvoices = await db.invoice.count({
      where: {
        userId,
        status: "SENT",
        dueDate: { lt: new Date() },
      },
    })

    if (overdueInvoices > 0) {
      alerts.push({
        id: "overdue-invoices",
        type: "warning",
        title: "Overdue Invoices",
        titleAr: "فواتير متأخرة",
        description: `You have ${overdueInvoices} overdue invoice(s) requiring attention.`,
        descriptionAr: `لديك ${overdueInvoices} فاتورة متأخرة تتطلب الاهتمام.`,
        action: {
          label: "View Invoices",
          labelAr: "عرض الفواتير",
          href: "/finance/invoice?status=OVERDUE",
        },
        timestamp: new Date(),
      })
    }

    // Check for low cash balance
    const totalCash = await db.bankAccount.aggregate({
      where: { userId, status: "ACTIVE" },
      _sum: { currentBalance: true },
    })

    const avgMonthlyExpense = await db.expense.aggregate({
      where: {
        userId,
        status: "PAID",
        paidAt: { gte: subMonths(new Date(), 3) },
      },
      _avg: { totalAmount: true },
    })

    const cashBalance = Number(totalCash._sum.currentBalance || 0)
    const monthlyExpense = Number(avgMonthlyExpense._avg.totalAmount || 1) * 30

    if (cashBalance < monthlyExpense * 2) {
      alerts.push({
        id: "low-cash",
        type: "error",
        title: "Low Cash Reserve",
        titleAr: "احتياطي نقدي منخفض",
        description: `Cash balance is below 2 months of average expenses.`,
        descriptionAr: `رصيد النقد أقل من متوسط المصروفات لشهرين.`,
        action: {
          label: "View Banking",
          labelAr: "عرض البنوك",
          href: "/finance/banking",
        },
        timestamp: new Date(),
      })
    }

    // Check for pending payroll
    const pendingPayroll = await db.payroll.count({
      where: {
        userId,
        status: "PENDING_APPROVAL",
      },
    })

    if (pendingPayroll > 0) {
      alerts.push({
        id: "pending-payroll",
        type: "info",
        title: "Payroll Pending Approval",
        titleAr: "الرواتب بانتظار الموافقة",
        description: `${pendingPayroll} payroll run(s) awaiting approval.`,
        descriptionAr: `${pendingPayroll} دورة رواتب بانتظار الموافقة.`,
        action: {
          label: "Review Payroll",
          labelAr: "مراجعة الرواتب",
          href: "/finance/payroll",
        },
        timestamp: new Date(),
      })
    }

    // Check for unapproved expenses
    const pendingExpenses = await db.expense.count({
      where: {
        userId,
        status: "PENDING",
      },
    })

    if (pendingExpenses > 0) {
      alerts.push({
        id: "pending-expenses",
        type: "info",
        title: "Expenses Pending Approval",
        titleAr: "مصروفات بانتظار الموافقة",
        description: `${pendingExpenses} expense(s) require review.`,
        descriptionAr: `${pendingExpenses} مصروف يتطلب المراجعة.`,
        action: {
          label: "Review Expenses",
          labelAr: "مراجعة المصروفات",
          href: "/finance/expenses?status=PENDING",
        },
        timestamp: new Date(),
      })
    }

    return alerts.slice(0, 5) // Return top 5 alerts
  } catch (error) {
    console.error("Error fetching financial alerts:", error)
    return []
  }
}

export async function getQuickActionsForRole(role: string) {
  const allActions = [
    {
      id: "create-invoice",
      label: "Create Invoice",
      labelAr: "إنشاء فاتورة",
      icon: "FileText",
      href: "/finance/invoice/new",
      color: "blue",
      description: "Generate a new invoice",
      descriptionAr: "إنشاء فاتورة جديدة",
      permission: "invoice.create",
    },
    {
      id: "record-payment",
      label: "Record Payment",
      labelAr: "تسجيل دفعة",
      icon: "DollarSign",
      href: "/finance/banking/payment",
      color: "green",
      description: "Record a payment received",
      descriptionAr: "تسجيل دفعة مستلمة",
      permission: "payment.create",
    },
    {
      id: "submit-expense",
      label: "Submit Expense",
      labelAr: "تقديم مصروف",
      icon: "Receipt",
      href: "/finance/expenses/new",
      color: "orange",
      description: "Submit an expense claim",
      descriptionAr: "تقديم مطالبة مصروف",
      permission: "expense.create",
    },
    {
      id: "run-payroll",
      label: "Run Payroll",
      labelAr: "تشغيل الرواتب",
      icon: "Users",
      href: "/finance/payroll/new",
      color: "purple",
      description: "Process monthly payroll",
      descriptionAr: "معالجة الرواتب الشهرية",
      permission: "payroll.process",
    },
    {
      id: "view-reports",
      label: "Financial Reports",
      labelAr: "التقارير المالية",
      icon: "BarChart",
      href: "/finance/reports",
      color: "indigo",
      description: "View financial statements",
      descriptionAr: "عرض البيانات المالية",
      permission: "reports.view",
    },
    {
      id: "bank-reconciliation",
      label: "Reconciliation",
      labelAr: "المطابقة",
      icon: "Building",
      href: "/finance/banking/reconciliation",
      color: "teal",
      description: "Reconcile bank accounts",
      descriptionAr: "مطابقة الحسابات البنكية",
      permission: "banking.reconcile",
    },
  ]

  const rolePermissions: Record<string, string[]> = {
    ADMIN: [
      "invoice.create",
      "payment.create",
      "expense.create",
      "payroll.process",
      "reports.view",
      "banking.reconcile",
    ],
    ACCOUNTANT: [
      "invoice.create",
      "payment.create",
      "expense.create",
      "payroll.process",
      "reports.view",
      "banking.reconcile",
    ],
    MANAGER: ["expense.create", "reports.view", "invoice.create"],
    CLERK: ["expense.create", "invoice.create"],
    OPERATOR: ["expense.create"],
    STAFF: ["expense.create"],
    VIEWER: ["reports.view"],
  }

  const permissions = rolePermissions[role] || rolePermissions.VIEWER
  return allActions.filter(
    (action) => !action.permission || permissions.includes(action.permission)
  )
}

// Additional helper to get finance overview for main page
export async function getFinanceOverview() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const userId = session.user.id
  const now = new Date()
  const startOfCurrentMonth = startOfMonth(now)

  try {
    const [
      totalRevenue,
      totalExpenses,
      pendingPayments,
      unpaidInvoices,
      invoicesCount,
      clientsWithCharges,
      employeesCount,
      pendingPayroll,
    ] = await Promise.all([
      // Total revenue this month
      db.invoice.aggregate({
        where: {
          userId,
          status: "PAID",
          paidAt: { gte: startOfCurrentMonth },
        },
        _sum: { total: true },
      }),

      // Total expenses this month
      db.expense.aggregate({
        where: {
          userId,
          status: "PAID",
          paidAt: { gte: startOfCurrentMonth },
        },
        _sum: { totalAmount: true },
      }),

      // Pending payments (invoices sent but not paid)
      db.invoice.aggregate({
        where: {
          userId,
          status: "SENT",
        },
        _sum: { total: true },
      }),

      // Unpaid invoices count
      db.invoice.count({
        where: {
          userId,
          status: { in: ["SENT", "OVERDUE"] },
        },
      }),

      // Total invoices this month
      db.invoice.count({
        where: {
          userId,
          createdAt: { gte: startOfCurrentMonth },
        },
      }),

      // Clients with active charges
      db.client.count({
        where: {
          userId,
          invoices: {
            some: {
              status: { in: ["SENT", "OVERDUE"] },
            },
          },
        },
      }),

      // Employees with salary
      db.employee.count({
        where: { userId, status: "ACTIVE" },
      }),

      // Pending payroll runs
      db.payroll.count({
        where: {
          userId,
          status: { in: ["DRAFT", "PENDING_APPROVAL"] },
        },
      }),
    ])

    return {
      totalRevenue: Number(totalRevenue._sum.total || 0),
      totalExpenses: Number(totalExpenses._sum.totalAmount || 0),
      pendingPayments: Number(pendingPayments._sum.total || 0),
      unpaidInvoices,
      invoicesCount,
      clientsWithChargesCount: clientsWithCharges,
      employeesWithSalaryCount: employeesCount,
      pendingPayrollCount: pendingPayroll,
      reportsCount: 0, // Generated reports - would need reports table
    }
  } catch (error) {
    console.error("Error fetching finance overview:", error)
    return {
      totalRevenue: 0,
      totalExpenses: 0,
      pendingPayments: 0,
      unpaidInvoices: 0,
      invoicesCount: 0,
      clientsWithChargesCount: 0,
      employeesWithSalaryCount: 0,
      pendingPayrollCount: 0,
      reportsCount: 0,
    }
  }
}
