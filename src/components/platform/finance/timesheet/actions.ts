/**
 * Timesheet Module - Server Actions (Stubbed)
 *
 * TODO: Implement with Prisma when Timesheet models are added
 */

"use server"

export interface TimesheetActionResult {
  success: boolean
  data?: unknown
  error?: string
}

export async function createTimesheet(
  formData: FormData
): Promise<TimesheetActionResult> {
  console.log("createTimesheet called with:", Object.fromEntries(formData))
  return { success: false, error: "Timesheet creation not yet implemented" }
}

export async function addTimesheetEntry(formData: FormData) {
  console.log("addTimesheetEntry called with:", Object.fromEntries(formData))
  return { success: false, error: "Timesheet entry creation not yet implemented" }
}

export async function submitTimesheet(timesheetId: string) {
  console.log("submitTimesheet called for:", timesheetId)
  return { success: false, error: "Timesheet submission not yet implemented" }
}

export async function approveTimesheet(formData: FormData) {
  console.log("approveTimesheet called with:", Object.fromEntries(formData))
  return { success: false, error: "Timesheet approval not yet implemented" }
}

export async function getTimesheets(filters?: {
  status?: string
  userId?: string
}) {
  console.log("getTimesheets called with filters:", filters)
  return { success: true, data: [] }
}
