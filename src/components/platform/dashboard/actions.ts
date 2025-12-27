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
 * Returns last 12 months of data
 */
export async function getFinancialChartData(): Promise<FinancialChartData> {
  const now = new Date()
  const labels: string[] = []
  const revenueData: number[] = []
  const expenseData: number[] = []
  const profitData: number[] = []

  // Generate last 12 months
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)

    labels.push(date.toLocaleDateString("en-US", { month: "short" }))

    // Get revenue (paid invoices) for this month
    const revenue = await db.invoice.aggregate({
      where: {
        status: "PAID",
        paidAt: {
          gte: date,
          lte: monthEnd,
        },
      },
      _sum: { total: true },
    })

    // For expenses, we'll estimate based on a percentage of revenue
    // In a real app, you'd have an expenses table
    const monthRevenue = Number(revenue._sum.total || 0)
    const monthExpense = Math.round(monthRevenue * 0.65) // Estimate 65% as expenses

    revenueData.push(monthRevenue)
    expenseData.push(monthExpense)
    profitData.push(monthRevenue - monthExpense)
  }

  return { revenueData, expenseData, profitData, labels }
}

/**
 * Get cash flow data for the current period
 */
export async function getCashFlowData(): Promise<CashFlowData> {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  // Cash inflow = paid invoices this month
  const inflow = await db.invoice.aggregate({
    where: {
      status: "PAID",
      paidAt: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
    _sum: { total: true },
  })

  // Cash outflow = estimated at 60% of inflow
  const inflowAmount = Number(inflow._sum.total || 0)
  const outflowAmount = Math.round(inflowAmount * 0.6)

  // Balance = total paid invoices - estimated expenses
  const totalRevenue = await db.invoice.aggregate({
    where: { status: "PAID" },
    _sum: { total: true },
  })
  const balance = Math.round(Number(totalRevenue._sum.total || 0) * 0.35)

  return {
    inflowData: [inflowAmount],
    outflowData: [outflowAmount],
    balanceData: [balance],
  }
}

/**
 * Get expense categories breakdown
 */
export async function getExpenseCategories(): Promise<ExpenseCategory[]> {
  // In a real app, you'd have an expenses table with categories
  // For now, we'll create sample data based on typical logistics expenses
  const categories: ExpenseCategory[] = [
    { category: "Operations", amount: 450000, percentage: 35 },
    { category: "Transportation", amount: 320000, percentage: 25 },
    { category: "Customs Fees", amount: 190000, percentage: 15 },
    { category: "Staff", amount: 130000, percentage: 10 },
    { category: "Storage", amount: 90000, percentage: 7 },
    { category: "Insurance", amount: 65000, percentage: 5 },
    { category: "Utilities", amount: 40000, percentage: 3 },
  ]

  return categories
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
