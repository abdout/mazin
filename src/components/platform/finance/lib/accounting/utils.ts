/**
 * Accounting Integration Utilities - Stubbed Implementation
 *
 * TODO: Implement with Prisma when accounting models are added
 */

import type {
  AccountBalance,
  JournalEntryInput,
  JournalEntryLine,
  PostingResult,
} from "./types"
import { AccountType } from "./types"

/**
 * Validate that debits equal credits
 */
export function validateDoubleEntry(lines: JournalEntryLine[]): boolean {
  const totalDebits = lines.reduce((sum, line) => sum + line.debit, 0)
  const totalCredits = lines.reduce((sum, line) => sum + line.credit, 0)

  // Allow for minor rounding differences (1 cent)
  return Math.abs(totalDebits - totalCredits) < 1
}

/**
 * Generate next journal entry number
 */
export async function generateEntryNumber(
  companyId: string,
  fiscalYearId: string
): Promise<string> {
  console.log("generateEntryNumber called:", { companyId, fiscalYearId })
  const yearCode = new Date().getFullYear().toString()
  const sequence = String(Math.floor(Math.random() * 999999)).padStart(6, "0")
  return `JE-${yearCode}-${sequence}`
}

/**
 * Create journal entry with ledger entries
 */
export async function createJournalEntry(
  companyId: string,
  input: JournalEntryInput,
  createdBy: string
): Promise<PostingResult> {
  try {
    // Validate double entry
    if (!validateDoubleEntry(input.lines)) {
      return {
        success: false,
        errors: ["Debits do not equal credits. Journal entry must balance."],
      }
    }

    console.log("createJournalEntry called:", { companyId, input, createdBy })
    return {
      success: true,
      journalEntryId: `stub-journal-${Date.now()}`,
    }
  } catch (error) {
    console.error("Error creating journal entry:", error)
    return {
      success: false,
      errors: [
        error instanceof Error ? error.message : "Unknown error occurred",
      ],
    }
  }
}

/**
 * Post an unposted journal entry
 */
export async function postJournalEntry(
  journalEntryId: string,
  postedBy: string
): Promise<PostingResult> {
  console.log("postJournalEntry called:", { journalEntryId, postedBy })
  return {
    success: true,
    journalEntryId,
  }
}

/**
 * Reverse a journal entry
 */
export async function reverseJournalEntry(
  journalEntryId: string,
  reversedBy: string,
  reason: string
): Promise<PostingResult> {
  console.log("reverseJournalEntry called:", {
    journalEntryId,
    reversedBy,
    reason,
  })
  return {
    success: true,
    journalEntryId: `reversed-${journalEntryId}`,
  }
}

/**
 * Get account balance
 */
export async function getAccountBalance(
  companyId: string,
  accountId: string,
  fiscalYearId: string
): Promise<number> {
  console.log("getAccountBalance called:", {
    companyId,
    accountId,
    fiscalYearId,
  })
  return 0
}

/**
 * Calculate trial balance
 */
export async function calculateTrialBalance(
  companyId: string,
  fiscalYearId: string
): Promise<AccountBalance[]> {
  console.log("calculateTrialBalance called:", { companyId, fiscalYearId })
  return []
}

/**
 * Format currency amount
 */
export function formatCurrency(
  amount: number,
  currency: string = "USD"
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount / 100)
}

/**
 * Convert to cents (smallest currency unit)
 */
export function toCents(amount: number): number {
  return Math.round(amount * 100)
}

/**
 * Convert from cents to dollars
 */
export function fromCents(cents: number): number {
  return cents / 100
}
