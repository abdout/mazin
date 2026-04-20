/**
 * Timesheet Module - Server Actions (Stubbed)
 *
 * TODO: Implement with Prisma when Timesheet models are added
 */

"use server"

import { auth } from "@/auth"

export interface TimesheetActionResult {
  success: boolean
  data?: unknown
  error?: string
}

export async function createTimesheet(
  formData: FormData
): Promise<TimesheetActionResult> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  return { success: false, error: "Timesheet creation not yet implemented" }
}

export async function addTimesheetEntry(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  return { success: false, error: "Timesheet entry creation not yet implemented" }
}

export async function submitTimesheet(timesheetId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  return { success: false, error: "Timesheet submission not yet implemented" }
}

export async function approveTimesheet(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  return { success: false, error: "Timesheet approval not yet implemented" }
}

export async function getTimesheets(filters?: {
  status?: string
  userId?: string
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  return { success: true, data: [] }
}
