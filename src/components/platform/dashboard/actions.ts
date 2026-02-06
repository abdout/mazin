"use server"

import { db } from "@/lib/db"
import { auth } from "@/auth"
import type { UserRole } from "@prisma/client"

// ============================================================================
// TYPES
// ============================================================================

export interface QuickLookData {
  totalShipments: number
  inTransit: number
  pendingCustoms: number
  unpaidTotal: number
}

export interface UpcomingItem {
  label: string
  value: string
  highlight?: boolean
}

export interface UpcomingData {
  title: string
  subtitle: string
  badge: string
  badgeVariant: "default" | "secondary" | "destructive"
  details: UpcomingItem[]
  link: string
  linkLabel: string
}

// ============================================================================
// QUICK LOOK DATA
// ============================================================================

export async function getQuickLookData(): Promise<QuickLookData> {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    return {
      totalShipments: 0,
      inTransit: 0,
      pendingCustoms: 0,
      unpaidTotal: 0,
    }
  }

  const [totalShipments, inTransit, pendingCustoms, unpaidInvoicesResult] =
    await Promise.all([
      db.shipment.count({
        where: { userId },
      }),
      db.shipment.count({
        where: { userId, status: "IN_TRANSIT" },
      }),
      db.customsDeclaration.count({
        where: {
          userId,
          status: { in: ["DRAFT", "SUBMITTED", "UNDER_REVIEW"] },
        },
      }),
      db.invoice.aggregate({
        where: {
          userId,
          status: { notIn: ["PAID", "CANCELLED"] },
        },
        _sum: { total: true },
      }),
    ])

  return {
    totalShipments,
    inTransit,
    pendingCustoms,
    unpaidTotal: Number(unpaidInvoicesResult._sum.total || 0),
  }
}

// ============================================================================
// UPCOMING DATA (ROLE-BASED)
// ============================================================================

export async function getUpcomingData(role: UserRole): Promise<UpcomingData> {
  const session = await auth()
  const userId = session?.user?.id

  switch (role) {
    case "ADMIN":
      return getAdminUpcoming(userId)
    case "MANAGER":
      return getManagerUpcoming(userId)
    case "CLERK":
      return getClerkUpcoming(userId)
    case "VIEWER":
    default:
      return getViewerUpcoming(userId)
  }
}

async function getAdminUpcoming(userId?: string): Promise<UpcomingData> {
  const [totalShipments, pendingDeclarations, totalRevenue] = await Promise.all(
    [
      db.shipment.count(),
      db.customsDeclaration.count({
        where: { status: { in: ["DRAFT", "SUBMITTED", "UNDER_REVIEW"] } },
      }),
      db.invoice.aggregate({
        where: { status: "PAID" },
        _sum: { total: true },
      }),
    ]
  )

  const revenue = Number(totalRevenue._sum.total || 0)

  return {
    title: "System Overview",
    subtitle: "Monitor all operations",
    badge: `${pendingDeclarations} pending`,
    badgeVariant: pendingDeclarations > 5 ? "destructive" : "secondary",
    details: [
      { label: "Total Shipments", value: totalShipments.toString() },
      { label: "Pending Declarations", value: pendingDeclarations.toString(), highlight: pendingDeclarations > 5 },
      { label: "Total Revenue", value: `SDG ${revenue.toLocaleString()}` },
    ],
    link: "/shipments",
    linkLabel: "View All Shipments",
  }
}

async function getManagerUpcoming(userId?: string): Promise<UpcomingData> {
  const [assignedDeclarations, completedThisMonth, pendingApproval] =
    await Promise.all([
      db.customsDeclaration.count({
        where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
      }),
      db.customsDeclaration.count({
        where: {
          status: "APPROVED",
          approvedAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      db.customsDeclaration.count({
        where: { status: "UNDER_REVIEW" },
      }),
    ])

  return {
    title: "Team Performance",
    subtitle: "Track your team's progress",
    badge: `${pendingApproval} to review`,
    badgeVariant: pendingApproval > 3 ? "destructive" : "secondary",
    details: [
      { label: "Assigned Declarations", value: assignedDeclarations.toString() },
      { label: "Completed This Month", value: completedThisMonth.toString() },
      { label: "Pending Approval", value: pendingApproval.toString(), highlight: pendingApproval > 3 },
    ],
    link: "/customs",
    linkLabel: "View Declarations",
  }
}

async function getClerkUpcoming(userId?: string): Promise<UpcomingData> {
  if (!userId) {
    return {
      title: "My Tasks",
      subtitle: "Pending declarations and documents",
      badge: "0 pending",
      badgeVariant: "secondary",
      details: [],
      link: "/customs",
      linkLabel: "View My Tasks",
    }
  }

  const [myDeclarations, draftCount, submittedCount] = await Promise.all([
    db.customsDeclaration.count({
      where: { userId },
    }),
    db.customsDeclaration.count({
      where: { userId, status: "DRAFT" },
    }),
    db.customsDeclaration.count({
      where: { userId, status: "SUBMITTED" },
    }),
  ])

  return {
    title: "My Tasks",
    subtitle: "Pending declarations and documents",
    badge: `${draftCount} drafts`,
    badgeVariant: draftCount > 3 ? "destructive" : "secondary",
    details: [
      { label: "My Declarations", value: myDeclarations.toString() },
      { label: "Drafts", value: draftCount.toString(), highlight: draftCount > 3 },
      { label: "Submitted", value: submittedCount.toString() },
    ],
    link: "/customs",
    linkLabel: "View My Tasks",
  }
}

async function getViewerUpcoming(userId?: string): Promise<UpcomingData> {
  if (!userId) {
    return {
      title: "Tracking Updates",
      subtitle: "Active shipment status",
      badge: "0 active",
      badgeVariant: "secondary",
      details: [],
      link: "/shipments",
      linkLabel: "Track Shipments",
    }
  }

  const [activeShipments, inTransit, delivered] = await Promise.all([
    db.shipment.count({
      where: { userId, status: { not: "DELIVERED" } },
    }),
    db.shipment.count({
      where: { userId, status: "IN_TRANSIT" },
    }),
    db.shipment.count({
      where: { userId, status: "DELIVERED" },
    }),
  ])

  return {
    title: "Tracking Updates",
    subtitle: "Active shipment status",
    badge: `${inTransit} in transit`,
    badgeVariant: inTransit > 0 ? "default" : "secondary",
    details: [
      { label: "Active Shipments", value: activeShipments.toString() },
      { label: "In Transit", value: inTransit.toString() },
      { label: "Delivered", value: delivered.toString() },
    ],
    link: "/shipments",
    linkLabel: "Track Shipments",
  }
}

// ============================================================================
// FINANCIAL DATA FOR CHARTS
// ============================================================================

export interface FinancialChartData {
  revenueData: number[]
  expenseData: number[]
  profitData: number[]
  labels: string[]
}

export interface CashFlowData {
  inflowData: number[]
  outflowData: number[]
  balanceData: number[]
}

export interface ExpenseCategory {
  category: string
  amount: number
  percentage: number
}

export interface TrendingStatsData {
  totalShipments: { value: number; change: number; changeType: "positive" | "negative" }
  totalRevenue: { value: number; change: number; changeType: "positive" | "negative" }
  pendingDeclarations: { value: number; change: number; changeType: "positive" | "negative" }
  completionRate: { value: number; change: number; changeType: "positive" | "negative" }
}

/**
 * Get financial data for revenue/expense charts
 * Returns last 12 months of data using parallel queries
 */
export async function getFinancialChartData(): Promise<FinancialChartData> {
  const now = new Date()
  const labels: string[] = []
  const months: { start: Date; end: Date }[] = []

  // Build month ranges
  for (let i = 11; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
    labels.push(start.toLocaleDateString("en-US", { month: "short" }))
    months.push({ start, end })
  }

  // Run all 12 months of revenue + expense queries in parallel
  const [revenueResults, expenseResults] = await Promise.all([
    Promise.all(
      months.map((m) =>
        db.invoice.aggregate({
          where: { status: "PAID", paidAt: { gte: m.start, lte: m.end } },
          _sum: { total: true },
        })
      )
    ),
    Promise.all(
      months.map((m) =>
        db.expense.aggregate({
          where: {
            status: { in: ["APPROVED", "PAID"] },
            expenseDate: { gte: m.start, lte: m.end },
          },
          _sum: { amount: true },
        })
      )
    ),
  ])

  const revenueData = revenueResults.map((r) => Number(r._sum.total ?? 0))
  const expenseData = expenseResults.map((e) => Number(e._sum.amount ?? 0))
  const profitData = revenueData.map((r, i) => r - (expenseData[i] ?? 0))

  return { revenueData, expenseData, profitData, labels }
}

/**
 * Get cash flow data for the current period
 */
export async function getCashFlowData(): Promise<CashFlowData> {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  // Run queries in parallel
  const [inflow, outflow, bankBalances] = await Promise.all([
    // Cash inflow = paid invoices this month
    db.invoice.aggregate({
      where: {
        status: "PAID",
        paidAt: { gte: monthStart, lte: monthEnd },
      },
      _sum: { total: true },
    }),
    // Cash outflow = real expenses this month
    db.expense.aggregate({
      where: {
        status: { in: ["APPROVED", "PAID"] },
        expenseDate: { gte: monthStart, lte: monthEnd },
      },
      _sum: { amount: true },
    }),
    // Balance from bank accounts
    db.bankAccount.aggregate({
      where: { isActive: true },
      _sum: { currentBalance: true },
    }),
  ])

  const inflowAmount = Number(inflow._sum.total ?? 0)
  const outflowAmount = Number(outflow._sum.amount ?? 0)
  const balance = Number(bankBalances._sum.currentBalance ?? 0)

  return {
    inflowData: [inflowAmount],
    outflowData: [outflowAmount],
    balanceData: [balance],
  }
}

/**
 * Get expense categories breakdown from real data
 */
export async function getExpenseCategories(): Promise<ExpenseCategory[]> {
  const grouped = await db.expense.groupBy({
    by: ["categoryId"],
    _sum: { amount: true },
    where: {
      status: { in: ["APPROVED", "PAID"] },
      categoryId: { not: null },
    },
    orderBy: { _sum: { amount: "desc" } },
  })

  if (grouped.length === 0) return []

  // Fetch category names
  const categoryIds = grouped
    .map((g) => g.categoryId)
    .filter((id): id is string => id !== null)

  const categoryNames = await db.expenseCategory.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true },
  })

  const nameMap = new Map(categoryNames.map((c) => [c.id, c.name]))
  const total = grouped.reduce((sum, g) => sum + Number(g._sum.amount ?? 0), 0)

  return grouped.map((g) => {
    const amount = Number(g._sum.amount ?? 0)
    return {
      category: nameMap.get(g.categoryId ?? "") ?? "Uncategorized",
      amount,
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
    }
  })
}

/**
 * Get trending stats for dashboard
 */
// ============================================================================
// RECENT TRANSACTIONS
// ============================================================================

export interface RecentTransaction {
  id: string
  description: string
  amount: number
  type: "income" | "expense" | "transfer"
  status: "completed" | "pending" | "failed"
  date: Date
  category?: string
  reference?: string
}

/**
 * Get recent transactions for dashboard
 */
export async function getRecentTransactions(
  limit: number = 5
): Promise<RecentTransaction[]> {
  const session = await auth()

  // Get recent invoices as transactions
  const invoices = await db.invoice.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      invoiceNumber: true,
      total: true,
      status: true,
      createdAt: true,
      paidAt: true,
      client: {
        select: { companyName: true },
      },
    },
  })

  return invoices.map((invoice) => ({
    id: invoice.id,
    description: `Invoice #${invoice.invoiceNumber} - ${invoice.client?.companyName || "Customer"}`,
    amount: Number(invoice.total),
    type: "income" as const,
    status:
      invoice.status === "PAID"
        ? ("completed" as const)
        : invoice.status === "CANCELLED"
          ? ("failed" as const)
          : ("pending" as const),
    date: invoice.paidAt || invoice.createdAt,
    category: "Invoice",
    reference: invoice.invoiceNumber,
  }))
}

/**
 * Get trending stats for dashboard
 */
export async function getTrendingStatsData(): Promise<TrendingStatsData> {
  const now = new Date()
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

  // Current month data
  const [currentShipments, currentRevenue, currentPending, currentCompleted] = await Promise.all([
    db.shipment.count({
      where: { createdAt: { gte: thisMonth } },
    }),
    db.invoice.aggregate({
      where: { status: "PAID", paidAt: { gte: thisMonth } },
      _sum: { total: true },
    }),
    db.customsDeclaration.count({
      where: { status: { in: ["DRAFT", "SUBMITTED", "UNDER_REVIEW"] } },
    }),
    db.customsDeclaration.count({
      where: { status: "APPROVED", approvedAt: { gte: thisMonth } },
    }),
  ])

  // Last month data for comparison
  const [lastShipments, lastRevenue, lastPending, lastCompleted] = await Promise.all([
    db.shipment.count({
      where: { createdAt: { gte: lastMonth, lte: lastMonthEnd } },
    }),
    db.invoice.aggregate({
      where: { status: "PAID", paidAt: { gte: lastMonth, lte: lastMonthEnd } },
      _sum: { total: true },
    }),
    db.customsDeclaration.count({
      where: {
        status: { in: ["DRAFT", "SUBMITTED", "UNDER_REVIEW"] },
        createdAt: { lte: lastMonthEnd }
      },
    }),
    db.customsDeclaration.count({
      where: { status: "APPROVED", approvedAt: { gte: lastMonth, lte: lastMonthEnd } },
    }),
  ])

  // Calculate changes
  const calcChange = (current: number, last: number) => {
    if (last === 0) return current > 0 ? 100 : 0
    return Math.round(((current - last) / last) * 100)
  }

  const shipmentChange = calcChange(currentShipments, lastShipments)
  const revenueChange = calcChange(
    Number(currentRevenue._sum.total || 0),
    Number(lastRevenue._sum.total || 0)
  )
  const pendingChange = calcChange(currentPending, lastPending)
  const completionChange = calcChange(currentCompleted, lastCompleted)

  // Total declarations for completion rate
  const totalDeclarations = await db.customsDeclaration.count({
    where: { createdAt: { gte: thisMonth } },
  })
  const completionRate = totalDeclarations > 0
    ? Math.round((currentCompleted / totalDeclarations) * 100)
    : 0

  return {
    totalShipments: {
      value: currentShipments,
      change: Math.abs(shipmentChange),
      changeType: shipmentChange >= 0 ? "positive" : "negative",
    },
    totalRevenue: {
      value: Number(currentRevenue._sum.total || 0),
      change: Math.abs(revenueChange),
      changeType: revenueChange >= 0 ? "positive" : "negative",
    },
    pendingDeclarations: {
      value: currentPending,
      change: Math.abs(pendingChange),
      changeType: pendingChange <= 0 ? "positive" : "negative", // Less pending is better
    },
    completionRate: {
      value: completionRate,
      change: Math.abs(completionChange),
      changeType: completionChange >= 0 ? "positive" : "negative",
    },
  }
}
