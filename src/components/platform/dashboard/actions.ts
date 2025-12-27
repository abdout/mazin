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
