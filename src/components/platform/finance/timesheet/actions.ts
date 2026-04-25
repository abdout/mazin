"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { logAudit } from "@/lib/audit"
import { requireStaff } from "@/lib/auth-context"
import { requireCan } from "@/lib/authorization"

const log = logger.forModule("finance.timesheet")

export interface TimesheetActionResult {
  success: boolean
  data?: unknown
  error?: string
}

function requiredString(form: FormData, key: string): string {
  const v = String(form.get(key) ?? "").trim()
  if (!v) throw new Error(`${key} is required`)
  return v
}

/**
 * Recompute totals from the entries. Kept server-side so the client cannot
 * fake hours by posting `totalRegularHours` directly.
 */
async function recalcTotals(timesheetId: string) {
  const entries = await db.timesheetEntry.findMany({
    where: { timesheetId },
    select: { regularHours: true, overtimeHours: true },
  })
  const regular = entries.reduce((s, e) => s + Number(e.regularHours), 0)
  const overtime = entries.reduce((s, e) => s + Number(e.overtimeHours), 0)
  await db.timesheet.update({
    where: { id: timesheetId },
    data: { totalRegularHours: regular, totalOvertimeHours: overtime },
  })
}

export async function createTimesheet(formData: FormData): Promise<TimesheetActionResult> {
  const ctx = await requireStaff()
  requireCan(ctx, "create", "finance")

  try {
    const employeeId = requiredString(formData, "employeeId")
    const period = requiredString(formData, "period")
    const periodStart = new Date(requiredString(formData, "periodStart"))
    const periodEnd = new Date(requiredString(formData, "periodEnd"))

    const existing = await db.timesheet.findUnique({
      where: { employeeId_period: { employeeId, period } },
    })
    if (existing) {
      return { success: false, error: "Timesheet already exists for this period" }
    }

    const created = await db.timesheet.create({
      data: { employeeId, period, periodStart, periodEnd, status: "DRAFT" },
    })

    await logAudit({
      action: "RECORD_CREATE",
      actor: ctx,
      resource: "timesheet",
      resourceId: created.id,
      metadata: { employeeId, period },
    })

    revalidatePath("/finance/timesheet")
    return { success: true, data: created }
  } catch (error) {
    log.error("createTimesheet failed", error as Error)
    return { success: false, error: error instanceof Error ? error.message : "Failed" }
  }
}

export async function addTimesheetEntry(formData: FormData): Promise<TimesheetActionResult> {
  const ctx = await requireStaff()
  requireCan(ctx, "update", "finance")

  try {
    const timesheetId = requiredString(formData, "timesheetId")
    const date = new Date(requiredString(formData, "date"))
    const regularHours = Number(formData.get("regularHours") ?? 0)
    const overtimeHours = Number(formData.get("overtimeHours") ?? 0)

    const sheet = await db.timesheet.findUnique({ where: { id: timesheetId } })
    if (!sheet) return { success: false, error: "Timesheet not found" }
    if (sheet.status !== "DRAFT") {
      return { success: false, error: "Cannot add entries to a submitted timesheet" }
    }

    const entry = await db.timesheetEntry.create({
      data: {
        timesheetId,
        date,
        regularHours,
        overtimeHours,
        description: formData.get("description") ? String(formData.get("description")) : null,
        projectId: formData.get("projectId") ? String(formData.get("projectId")) : null,
        shipmentId: formData.get("shipmentId") ? String(formData.get("shipmentId")) : null,
      },
    })

    await recalcTotals(timesheetId)
    revalidatePath("/finance/timesheet")
    return { success: true, data: entry }
  } catch (error) {
    log.error("addTimesheetEntry failed", error as Error)
    return { success: false, error: error instanceof Error ? error.message : "Failed" }
  }
}

export async function submitTimesheet(timesheetId: string): Promise<TimesheetActionResult> {
  const ctx = await requireStaff()
  requireCan(ctx, "update", "finance")

  await db.timesheet.update({
    where: { id: timesheetId },
    data: { status: "SUBMITTED", submittedAt: new Date() },
  })

  await logAudit({
    action: "RECORD_UPDATE",
    actor: ctx,
    resource: "timesheet",
    resourceId: timesheetId,
    metadata: { status: "SUBMITTED" },
  })

  revalidatePath("/finance/timesheet")
  return { success: true }
}

export async function approveTimesheet(formData: FormData): Promise<TimesheetActionResult> {
  const ctx = await requireStaff()
  requireCan(ctx, "approve", "finance")

  try {
    const timesheetId = requiredString(formData, "timesheetId")
    const action = String(formData.get("action") ?? "approve")
    const reason = formData.get("reason") ? String(formData.get("reason")) : null

    if (action === "reject") {
      await db.timesheet.update({
        where: { id: timesheetId },
        data: {
          status: "REJECTED",
          rejectedAt: new Date(),
          rejectedBy: ctx.userId,
          rejectionReason: reason,
        },
      })
    } else {
      await db.timesheet.update({
        where: { id: timesheetId },
        data: {
          status: "APPROVED",
          approvedAt: new Date(),
          approvedBy: ctx.userId,
        },
      })
    }

    await logAudit({
      action: "RECORD_UPDATE",
      actor: ctx,
      resource: "timesheet",
      resourceId: timesheetId,
      metadata: { decision: action, reason },
    })

    revalidatePath("/finance/timesheet")
    return { success: true }
  } catch (error) {
    log.error("approveTimesheet failed", error as Error)
    return { success: false, error: error instanceof Error ? error.message : "Failed" }
  }
}

export async function getTimesheets(filters?: {
  status?: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED"
  employeeId?: string
}): Promise<TimesheetActionResult> {
  const ctx = await requireStaff()
  requireCan(ctx, "read", "finance")

  const rows = await db.timesheet.findMany({
    where: {
      ...(filters?.status && { status: filters.status }),
      ...(filters?.employeeId && { employeeId: filters.employeeId }),
    },
    include: {
      employee: { select: { id: true, fullName: true, employeeNumber: true } },
      _count: { select: { entries: true } },
    },
    orderBy: { periodStart: "desc" },
  })
  return { success: true, data: rows }
}
