/**
 * Accounting Integration Actions — intentionally unimplemented.
 *
 * Double-entry bookkeeping is planned but not yet backed by Prisma models.
 * Each exported action fails with NOT_IMPLEMENTED so the UI cannot claim a
 * journal entry was posted when nothing happened.
 */

"use server"

import { auth } from "@/auth"
import { logger } from "@/lib/logger"

import type { PostingResult } from "./types"

const log = logger.forModule("accounting")

const NOT_IMPLEMENTED_ERROR = "Accounting module is not yet implemented"

async function requireAuthOrUnauthorized(): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" }
  return { ok: true }
}

function notImplementedPosting(op: string): PostingResult {
  log.warn("Accounting action invoked but not implemented", { op })
  return { success: false, errors: [NOT_IMPLEMENTED_ERROR] }
}

function notImplementedResult<T extends Record<string, unknown>>(
  op: string,
  extra: T = {} as T,
): { success: false; error: string } & T {
  log.warn("Accounting action invoked but not implemented", { op })
  return { success: false, error: NOT_IMPLEMENTED_ERROR, ...extra }
}

export async function initializeAccounting(_companyId: string): Promise<{
  success: boolean
  accountsCreated?: number
  fiscalYearId?: string
  error?: string
}> {
  const guard = await requireAuthOrUnauthorized()
  if (!guard.ok) return { success: false, error: guard.error }
  return notImplementedResult("initializeAccounting")
}

export async function postFeePayment(
  _companyId: string,
  _paymentData: {
    paymentId: string
    clientId: string
    amount: number
    paymentMethod: string
    paymentDate: Date
    feeType?: string
  },
): Promise<PostingResult> {
  const guard = await requireAuthOrUnauthorized()
  if (!guard.ok) return { success: false, errors: [guard.error] }
  return notImplementedPosting("postFeePayment")
}

export async function postFeeAssignment(
  _companyId: string,
  _assignmentData: {
    assignmentId: string
    clientId: string
    amount: number
    feeType: string
    assignedDate: Date
  },
): Promise<PostingResult> {
  const guard = await requireAuthOrUnauthorized()
  if (!guard.ok) return { success: false, errors: [guard.error] }
  return notImplementedPosting("postFeeAssignment")
}

export async function postSalaryPayment(
  _companyId: string,
  _paymentData: {
    slipId: string
    employeeId: string
    grossSalary: number
    taxAmount: number
    socialSecurityAmount: number
    netSalary: number
    paymentDate: Date
  },
): Promise<PostingResult> {
  const guard = await requireAuthOrUnauthorized()
  if (!guard.ok) return { success: false, errors: [guard.error] }
  return notImplementedPosting("postSalaryPayment")
}

export async function postExpensePayment(
  _companyId: string,
  _expenseData: {
    expenseId: string
    categoryName: string
    amount: number
    paymentDate: Date
    description: string
  },
): Promise<PostingResult> {
  const guard = await requireAuthOrUnauthorized()
  if (!guard.ok) return { success: false, errors: [guard.error] }
  return notImplementedPosting("postExpensePayment")
}

export async function postInvoicePayment(
  _companyId: string,
  _invoiceData: {
    invoiceId: string
    amount: number
    paymentDate: Date
    invoiceNumber: string
  },
): Promise<PostingResult> {
  const guard = await requireAuthOrUnauthorized()
  if (!guard.ok) return { success: false, errors: [guard.error] }
  return notImplementedPosting("postInvoicePayment")
}

export async function postWalletTopup(
  _companyId: string,
  _topupData: {
    transactionId: string
    amount: number
    topupDate: Date
  },
): Promise<PostingResult> {
  const guard = await requireAuthOrUnauthorized()
  if (!guard.ok) return { success: false, errors: [guard.error] }
  return notImplementedPosting("postWalletTopup")
}

export async function postJournalEntryAction(
  _journalEntryId: string,
): Promise<PostingResult> {
  const guard = await requireAuthOrUnauthorized()
  if (!guard.ok) return { success: false, errors: [guard.error] }
  return notImplementedPosting("postJournalEntryAction")
}

export async function reverseJournalEntryAction(
  _journalEntryId: string,
  _reason: string,
): Promise<PostingResult> {
  const guard = await requireAuthOrUnauthorized()
  if (!guard.ok) return { success: false, errors: [guard.error] }
  return notImplementedPosting("reverseJournalEntryAction")
}

export async function getChartOfAccounts(_companyId: string) {
  const guard = await requireAuthOrUnauthorized()
  if (!guard.ok) return { success: false, error: guard.error }
  return notImplementedResult("getChartOfAccounts", { accounts: [] as const })
}

export async function getJournalEntries(
  _companyId: string,
  _options?: {
    fiscalYearId?: string
    sourceModule?: string
    isPosted?: boolean
    limit?: number
  },
) {
  const guard = await requireAuthOrUnauthorized()
  if (!guard.ok) return { success: false, error: guard.error }
  return notImplementedResult("getJournalEntries", { entries: [] as const })
}

export async function getAccountBalances(
  _companyId: string,
  _fiscalYearId?: string,
) {
  const guard = await requireAuthOrUnauthorized()
  if (!guard.ok) return { success: false, error: guard.error }
  return notImplementedResult("getAccountBalances", { balances: [] as const })
}
