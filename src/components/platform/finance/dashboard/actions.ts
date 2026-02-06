"use server"

import { db } from "@/lib/db"
import type { DashboardStats, FinancialAlert, RecentTransaction } from "./types"

export async function getDashboardStats(
  dateRange: "month" | "quarter" | "year" = "month"
): Promise<DashboardStats> {
  const now = new Date()
  let startDate: Date

  switch (dateRange) {
    case "quarter":
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1)
      break
    case "year":
      startDate = new Date(now.getFullYear(), 0, 1)
      break
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
  }

  // Run aggregated queries in parallel
  const [
    invoiceStats,
    expenseStats,
    shipmentStats,
    clientStats,
    bankAccounts,
    expenseCategories,
    payrollStats,
  ] = await Promise.all([
    // Invoice aggregation
    db.invoice.groupBy({
      by: ["status"],
      _sum: { total: true },
      _count: true,
      where: { createdAt: { gte: startDate } },
    }),

    // Expense aggregation
    db.expense.aggregate({
      _sum: { amount: true },
      _count: true,
      where: {
        expenseDate: { gte: startDate },
        status: { in: ["APPROVED", "PAID"] },
      },
    }),

    // Shipment counts
    db.shipment.groupBy({
      by: ["status"],
      _count: true,
    }),

    // Client counts
    db.client.aggregate({
      _count: true,
      where: { isActive: true },
    }),

    // Bank accounts
    db.bankAccount.findMany({
      where: { isActive: true },
      select: {
        accountName: true,
        currentBalance: true,
        currency: true,
        accountType: true,
      },
    }),

    // Expense by category
    db.expense.groupBy({
      by: ["categoryId"],
      _sum: { amount: true },
      where: {
        expenseDate: { gte: startDate },
        status: { in: ["APPROVED", "PAID"] },
        categoryId: { not: null },
      },
    }),

    // Payroll stats
    db.payrollRun.aggregate({
      _sum: { totalNet: true },
      _count: true,
      where: {
        periodYear: now.getFullYear(),
        status: { in: ["COMPLETED", "APPROVED", "PROCESSING"] },
      },
    }),
  ])

  // Compute invoice metrics
  const totalRevenue = invoiceStats.reduce(
    (sum, s) => sum + Number(s._sum.total ?? 0),
    0
  )
  const paidInvoices = invoiceStats.find((s) => s.status === "PAID")
  const collectedRevenue = Number(paidInvoices?._sum.total ?? 0)
  const pendingInvoiceGroup = invoiceStats.find((s) => s.status === "SENT")
  const overdueInvoiceGroup = invoiceStats.find((s) => s.status === "OVERDUE")

  const totalInvoiceCount = invoiceStats.reduce((sum, s) => sum + s._count, 0)
  const paidCount = paidInvoices?._count ?? 0
  const pendingCount = pendingInvoiceGroup?._count ?? 0
  const overdueCount = overdueInvoiceGroup?._count ?? 0
  const overdueAmount = Number(overdueInvoiceGroup?._sum.total ?? 0)
  const outstandingRevenue = totalRevenue - collectedRevenue

  // Compute expense metrics
  const totalExpenses = Number(expenseStats._sum.amount ?? 0)

  // Compute shipment metrics
  const totalShipments = shipmentStats.reduce((sum, s) => sum + s._count, 0)
  const activeShipments = shipmentStats
    .filter((s) => ["IN_TRANSIT", "ARRIVED", "PENDING"].includes(s.status))
    .reduce((sum, s) => sum + s._count, 0)
  const completedShipments = shipmentStats
    .filter((s) => ["DELIVERED", "CLEARED"].includes(s.status))
    .reduce((sum, s) => sum + s._count, 0)

  // Compute profit
  const grossProfit = collectedRevenue - totalExpenses
  const profitMargin = collectedRevenue > 0 ? (grossProfit / collectedRevenue) * 100 : 0

  // Cash balance
  const cashBalance = bankAccounts.reduce(
    (sum, a) => sum + Number(a.currentBalance),
    0
  )

  // Expense categories with names
  const categoryIds = expenseCategories
    .map((c) => c.categoryId)
    .filter((id): id is string => id !== null)

  const categoryNames =
    categoryIds.length > 0
      ? await db.expenseCategory.findMany({
          where: { id: { in: categoryIds } },
          select: { id: true, name: true },
        })
      : []

  const categoryNameMap = new Map(categoryNames.map((c) => [c.id, c.name]))
  const totalCategoryExpense = expenseCategories.reduce(
    (sum, c) => sum + Number(c._sum.amount ?? 0),
    0
  )

  return {
    totalRevenue,
    collectedRevenue,
    outstandingRevenue,
    collectionRate: totalRevenue > 0 ? (collectedRevenue / totalRevenue) * 100 : 0,

    totalExpenses,
    budgetUsed: totalExpenses,
    budgetRemaining: 0,
    expenseCategories: expenseCategories.map((c) => ({
      category: categoryNameMap.get(c.categoryId ?? "") ?? "Uncategorized",
      amount: Number(c._sum.amount ?? 0),
      percentage:
        totalCategoryExpense > 0
          ? (Number(c._sum.amount ?? 0) / totalCategoryExpense) * 100
          : 0,
    })),

    grossProfit,
    netProfit: grossProfit,
    profitMargin,

    cashBalance,
    cashInflow: collectedRevenue,
    cashOutflow: totalExpenses,
    cashRunway: totalExpenses > 0 ? cashBalance / (totalExpenses || 1) : 0,

    totalInvoices: totalInvoiceCount,
    paidInvoices: paidCount,
    pendingInvoices: pendingCount,
    overdueInvoices: overdueCount,
    overdueAmount,

    totalPayroll: Number(payrollStats._sum.totalNet ?? 0),
    payrollProcessed: payrollStats._count ?? 0,
    pendingPayroll: 0,

    totalShipments,
    activeShipments,
    completedShipments,
    averageRevenuePerShipment: totalShipments > 0 ? totalRevenue / totalShipments : 0,

    totalClients: clientStats._count ?? 0,
    activeClients: clientStats._count ?? 0,
    clientsWithOutstanding: 0,
    averageClientBalance: 0,

    bankAccounts: bankAccounts.map((a) => ({
      name: a.accountName,
      balance: Number(a.currentBalance),
      currency: a.currency,
      type: a.accountType,
    })),

    budgetCategories: [],
    revenueTrend: [],
    expensesTrend: [],
    profitTrend: [],
    shipmentsTrend: [],
  }
}

export async function getRecentTransactions(
  limit = 10
): Promise<RecentTransaction[]> {
  const transactions = await db.bankTransaction.findMany({
    take: limit,
    orderBy: { transactionDate: "desc" },
    select: {
      id: true,
      type: true,
      amount: true,
      description: true,
      transactionDate: true,
      sourceType: true,
      transactionRef: true,
      isReconciled: true,
    },
  })

  return transactions.map((t) => ({
    id: t.id,
    type: t.type === "CREDIT" ? "income" : "expense",
    description: t.description ?? t.transactionRef,
    amount: Number(t.amount),
    date: t.transactionDate,
    status: t.isReconciled ? "completed" as const : "pending" as const,
    category: t.sourceType ?? undefined,
    reference: t.transactionRef,
  }))
}

export async function getFinancialAlerts(): Promise<FinancialAlert[]> {
  const alerts: FinancialAlert[] = []

  // Check for overdue invoices
  const overdueCount = await db.invoice.count({
    where: { status: "OVERDUE" },
  })

  if (overdueCount > 0) {
    alerts.push({
      id: "overdue-invoices",
      type: "warning",
      title: `${overdueCount} Overdue Invoices`,
      titleAr: `${overdueCount} فواتير متأخرة`,
      description: `You have ${overdueCount} overdue invoice(s) requiring attention.`,
      descriptionAr: `لديك ${overdueCount} فاتورة/فواتير متأخرة تتطلب اهتمامك.`,
      action: { label: "View Invoices", labelAr: "عرض الفواتير", href: "/invoice" },
      timestamp: new Date(),
    })
  }

  // Check for pending expenses
  const pendingExpenses = await db.expense.count({
    where: { status: "PENDING" },
  })

  if (pendingExpenses > 0) {
    alerts.push({
      id: "pending-expenses",
      type: "info",
      title: `${pendingExpenses} Pending Expenses`,
      titleAr: `${pendingExpenses} مصروفات معلقة`,
      description: `${pendingExpenses} expense(s) awaiting approval.`,
      descriptionAr: `${pendingExpenses} مصروف/مصروفات بانتظار الموافقة.`,
      action: { label: "Review", labelAr: "مراجعة", href: "/finance/expenses" },
      timestamp: new Date(),
    })
  }

  return alerts
}

export async function getQuickActionsForRole(role: string) {
  const allActions = [
    {
      id: "create-invoice",
      label: "Create Invoice",
      icon: "FileText",
      href: "/finance/invoice/create",
      color: "blue",
      description: "Generate a new invoice",
      permission: "invoice.create",
    },
    {
      id: "record-payment",
      label: "Record Payment",
      icon: "DollarSign",
      href: "/finance/fees/payment",
      color: "green",
      description: "Record a fee payment",
      permission: "payment.create",
    },
    {
      id: "submit-expense",
      label: "Submit Expense",
      icon: "Receipt",
      href: "/finance/expenses/create",
      color: "orange",
      description: "Submit an expense claim",
      permission: "expense.create",
    },
    {
      id: "run-payroll",
      label: "Run Payroll",
      icon: "Users",
      href: "/finance/payroll/run",
      color: "purple",
      description: "Process monthly payroll",
      permission: "payroll.process",
    },
    {
      id: "view-reports",
      label: "Financial Reports",
      icon: "BarChart",
      href: "/finance/reports",
      color: "indigo",
      description: "View financial statements",
      permission: "reports.view",
    },
    {
      id: "bank-reconciliation",
      label: "Bank Reconciliation",
      icon: "Building",
      href: "/finance/banking/reconciliation",
      color: "teal",
      description: "Reconcile bank accounts",
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
    MANAGER: ["expense.create", "reports.view"],
    CLERK: ["expense.create"],
  }

  const permissions = rolePermissions[role] || []
  return allActions.filter(
    (action) => !action.permission || permissions.includes(action.permission)
  )
}
