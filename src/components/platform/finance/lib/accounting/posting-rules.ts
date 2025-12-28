/**
 * Posting Rules for Finance Modules - Stubbed Implementation
 *
 * Defines how each finance module's transactions map to journal entries
 * TODO: Implement with Prisma when accounting models are added
 */

import type { JournalEntryInput, JournalEntryLine } from "./types"
import { SourceModule } from "./types"
import { toCents } from "./utils"

/**
 * Standard account codes for chart of accounts
 * Companies can customize these during setup
 */
export const StandardAccountCodes = {
  // Assets
  CASH: "1000",
  BANK_ACCOUNT: "1010",
  ACCOUNTS_RECEIVABLE: "1100",
  CLIENT_RECEIVABLE: "1110",
  PREPAID_EXPENSES: "1300",

  // Liabilities
  ACCOUNTS_PAYABLE: "2000",
  SALARY_PAYABLE: "2100",
  TAX_PAYABLE: "2200",
  SOCIAL_SECURITY_PAYABLE: "2210",
  UNEARNED_REVENUE: "2300",

  // Equity
  RETAINED_EARNINGS: "3000",
  CURRENT_YEAR_EARNINGS: "3100",

  // Revenue
  SERVICE_REVENUE: "4000",
  CLEARANCE_FEES: "4010",
  DOCUMENTATION_FEES: "4100",
  OTHER_REVENUE: "4900",

  // Expenses
  SALARY_EXPENSE: "5000",
  STAFF_SALARY: "5010",
  ADMIN_SALARY: "5020",
  PAYROLL_TAX_EXPENSE: "5100",
  UTILITIES_EXPENSE: "5200",
  SUPPLIES_EXPENSE: "5300",
  MAINTENANCE_EXPENSE: "5400",
  OTHER_EXPENSE: "5900",
} as const

/**
 * Get account by code (stubbed)
 */
async function getAccountIdByCode(
  companyId: string,
  accountCode: string,
  db: unknown
): Promise<string | null> {
  console.log("getAccountIdByCode called:", { companyId, accountCode })
  return `stub-account-${accountCode}`
}

/**
 * Fee Payment Posting Rule (stubbed)
 */
export async function createFeePaymentEntry(
  companyId: string,
  paymentData: {
    paymentId: string
    clientId: string
    amount: number
    paymentMethod: string
    paymentDate: Date
    feeType?: string
  },
  db: unknown
): Promise<JournalEntryInput> {
  console.log("createFeePaymentEntry called:", { companyId, paymentData })

  const amount = toCents(paymentData.amount)

  const lines: JournalEntryLine[] = [
    {
      accountId: `stub-account-${StandardAccountCodes.CASH}`,
      accountCode: StandardAccountCodes.CASH,
      accountName: "Cash",
      debit: amount,
      credit: 0,
      description: "Fee payment received from client",
    },
    {
      accountId: `stub-account-${StandardAccountCodes.CLIENT_RECEIVABLE}`,
      accountCode: StandardAccountCodes.CLIENT_RECEIVABLE,
      accountName: "Client Receivable",
      debit: 0,
      credit: amount,
      description: "Fee payment applied",
    },
  ]

  return {
    entryDate: paymentData.paymentDate,
    description: `Client fee payment - ${paymentData.paymentMethod}`,
    reference: paymentData.paymentId,
    sourceModule: SourceModule.FEES,
    sourceRecordId: paymentData.paymentId,
    lines,
    autoPost: true,
  }
}

/**
 * Fee Assignment Posting Rule (stubbed)
 */
export async function createFeeAssignmentEntry(
  companyId: string,
  assignmentData: {
    assignmentId: string
    clientId: string
    amount: number
    feeType: string
    assignedDate: Date
  },
  db: unknown
): Promise<JournalEntryInput> {
  console.log("createFeeAssignmentEntry called:", { companyId, assignmentData })

  const amount = toCents(assignmentData.amount)

  const lines: JournalEntryLine[] = [
    {
      accountId: `stub-account-${StandardAccountCodes.CLIENT_RECEIVABLE}`,
      accountCode: StandardAccountCodes.CLIENT_RECEIVABLE,
      accountName: "Client Receivable",
      debit: amount,
      credit: 0,
      description: `Fee assigned: ${assignmentData.feeType}`,
    },
    {
      accountId: `stub-account-${StandardAccountCodes.SERVICE_REVENUE}`,
      accountCode: StandardAccountCodes.SERVICE_REVENUE,
      accountName: "Service Revenue",
      debit: 0,
      credit: amount,
      description: "Fee revenue recognized",
    },
  ]

  return {
    entryDate: assignmentData.assignedDate,
    description: `Fee assignment - ${assignmentData.feeType}`,
    reference: assignmentData.assignmentId,
    sourceModule: SourceModule.FEES,
    sourceRecordId: assignmentData.assignmentId,
    lines,
    autoPost: true,
  }
}

/**
 * Salary Payment Posting Rule (stubbed)
 */
export async function createSalaryPaymentEntry(
  companyId: string,
  paymentData: {
    slipId: string
    employeeId: string
    grossSalary: number
    taxAmount: number
    socialSecurityAmount: number
    netSalary: number
    paymentDate: Date
  },
  db: unknown
): Promise<JournalEntryInput> {
  console.log("createSalaryPaymentEntry called:", { companyId, paymentData })

  const grossAmount = toCents(paymentData.grossSalary)
  const netAmount = toCents(paymentData.netSalary)
  const taxAmount = toCents(paymentData.taxAmount)
  const ssAmount = toCents(paymentData.socialSecurityAmount)

  const lines: JournalEntryLine[] = [
    {
      accountId: `stub-account-${StandardAccountCodes.SALARY_EXPENSE}`,
      accountCode: StandardAccountCodes.SALARY_EXPENSE,
      accountName: "Salary Expense",
      debit: grossAmount,
      credit: 0,
      description: "Salary expense for employee",
    },
    {
      accountId: `stub-account-${StandardAccountCodes.CASH}`,
      accountCode: StandardAccountCodes.CASH,
      accountName: "Cash",
      debit: 0,
      credit: netAmount,
      description: "Salary payment to employee",
    },
  ]

  if (taxAmount > 0) {
    lines.push({
      accountId: `stub-account-${StandardAccountCodes.TAX_PAYABLE}`,
      accountCode: StandardAccountCodes.TAX_PAYABLE,
      accountName: "Tax Payable",
      debit: 0,
      credit: taxAmount,
      description: "Tax withheld",
    })
  }

  if (ssAmount > 0) {
    lines.push({
      accountId: `stub-account-${StandardAccountCodes.SOCIAL_SECURITY_PAYABLE}`,
      accountCode: StandardAccountCodes.SOCIAL_SECURITY_PAYABLE,
      accountName: "Social Security Payable",
      debit: 0,
      credit: ssAmount,
      description: "Social security withheld",
    })
  }

  return {
    entryDate: paymentData.paymentDate,
    description: "Salary payment",
    reference: paymentData.slipId,
    sourceModule: SourceModule.PAYROLL,
    sourceRecordId: paymentData.slipId,
    lines,
    autoPost: true,
  }
}

/**
 * Expense Payment Posting Rule (stubbed)
 */
export async function createExpensePaymentEntry(
  companyId: string,
  expenseData: {
    expenseId: string
    categoryName: string
    amount: number
    paymentDate: Date
    description: string
  },
  db: unknown
): Promise<JournalEntryInput> {
  console.log("createExpensePaymentEntry called:", { companyId, expenseData })

  const amount = toCents(expenseData.amount)

  const lines: JournalEntryLine[] = [
    {
      accountId: `stub-account-${StandardAccountCodes.OTHER_EXPENSE}`,
      accountCode: StandardAccountCodes.OTHER_EXPENSE,
      accountName: `${expenseData.categoryName} Expense`,
      debit: amount,
      credit: 0,
      description: expenseData.description,
    },
    {
      accountId: `stub-account-${StandardAccountCodes.CASH}`,
      accountCode: StandardAccountCodes.CASH,
      accountName: "Cash",
      debit: 0,
      credit: amount,
      description: `Payment for ${expenseData.categoryName}`,
    },
  ]

  return {
    entryDate: expenseData.paymentDate,
    description: `Expense: ${expenseData.description}`,
    reference: expenseData.expenseId,
    sourceModule: SourceModule.EXPENSES,
    sourceRecordId: expenseData.expenseId,
    lines,
    autoPost: true,
  }
}

/**
 * Invoice Payment Posting Rule (stubbed)
 */
export async function createInvoicePaymentEntry(
  companyId: string,
  invoiceData: {
    invoiceId: string
    amount: number
    paymentDate: Date
    invoiceNumber: string
  },
  db: unknown
): Promise<JournalEntryInput> {
  console.log("createInvoicePaymentEntry called:", { companyId, invoiceData })

  const amount = toCents(invoiceData.amount)

  const lines: JournalEntryLine[] = [
    {
      accountId: `stub-account-${StandardAccountCodes.CASH}`,
      accountCode: StandardAccountCodes.CASH,
      accountName: "Cash",
      debit: amount,
      credit: 0,
      description: "Invoice payment received",
    },
    {
      accountId: `stub-account-${StandardAccountCodes.ACCOUNTS_RECEIVABLE}`,
      accountCode: StandardAccountCodes.ACCOUNTS_RECEIVABLE,
      accountName: "Accounts Receivable",
      debit: 0,
      credit: amount,
      description: `Payment for invoice ${invoiceData.invoiceNumber}`,
    },
  ]

  return {
    entryDate: invoiceData.paymentDate,
    description: `Invoice payment - ${invoiceData.invoiceNumber}`,
    reference: invoiceData.invoiceId,
    sourceModule: SourceModule.INVOICE,
    sourceRecordId: invoiceData.invoiceId,
    lines,
    autoPost: true,
  }
}

/**
 * Wallet Top-up Posting Rule (stubbed)
 */
export async function createWalletTopupEntry(
  companyId: string,
  topupData: {
    transactionId: string
    amount: number
    topupDate: Date
  },
  db: unknown
): Promise<JournalEntryInput> {
  console.log("createWalletTopupEntry called:", { companyId, topupData })

  const amount = toCents(topupData.amount)

  const lines: JournalEntryLine[] = [
    {
      accountId: `stub-account-${StandardAccountCodes.CASH}`,
      accountCode: StandardAccountCodes.CASH,
      accountName: "Cash",
      debit: amount,
      credit: 0,
      description: "Wallet top-up received",
    },
    {
      accountId: `stub-account-${StandardAccountCodes.UNEARNED_REVENUE}`,
      accountCode: StandardAccountCodes.UNEARNED_REVENUE,
      accountName: "Unearned Revenue",
      debit: 0,
      credit: amount,
      description: "Wallet balance increase",
    },
  ]

  return {
    entryDate: topupData.topupDate,
    description: "Wallet top-up",
    reference: topupData.transactionId,
    sourceModule: SourceModule.WALLET,
    sourceRecordId: topupData.transactionId,
    lines,
    autoPost: true,
  }
}

/**
 * Budget Allocation Memo
 */
export function createBudgetAllocationMemo(
  companyId: string,
  budgetData: {
    allocationId: string
    departmentName: string
    amount: number
    startDate: Date
  }
): string {
  return `Budget allocated: $${budgetData.amount} to ${budgetData.departmentName}`
}
