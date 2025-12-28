"use server"

/**
 * Bank Actions - Stubbed Implementation
 *
 * TODO: These actions require:
 * 1. Prisma schema updates for BankAccount, Transaction models
 * 2. Plaid API integration (npm install plaid)
 * 3. User model to include companyId field
 *
 * For now, these return placeholder data to allow the build to pass.
 */

// Placeholder types until Prisma schema is updated
export interface BankAccount {
  id: string
  userId: string
  companyId: string
  bankId: string
  accountId: string
  name: string
  officialName?: string
  mask?: string
  currentBalance: number
  availableBalance: number
  type: string
  subtype: string
  institutionId: string
  transactions?: Transaction[]
}

export interface Transaction {
  id: string
  accountId: string
  bankAccountId: string
  companyId: string
  name: string
  amount: number
  date: Date
  category: string
  subcategory?: string
  type: "debit" | "credit"
  pending: boolean
  merchantName?: string
  paymentChannel?: string
  isoCurrencyCode: string
}

export interface AccountsResponse {
  data: BankAccount[]
  totalBanks: number
  totalCurrentBalance: number
}

// Stub implementations
export async function getAccounts({ userId }: { userId: string }): Promise<AccountsResponse | null> {
  // TODO: Implement with actual Prisma queries
  console.log("getAccounts called for user:", userId)
  return {
    data: [],
    totalBanks: 0,
    totalCurrentBalance: 0,
  }
}

export async function getAccount(accountId: string): Promise<BankAccount | null> {
  // TODO: Implement with actual Prisma queries
  console.log("getAccount called for:", accountId)
  return null
}

export async function getBankInfo(accountId: string): Promise<{
  name: string
  logo?: string
  primaryColor?: string
} | null> {
  // TODO: Implement with Plaid API
  console.log("getBankInfo called for:", accountId)
  return null
}

export async function createBankAccount(params: {
  userId: string
  bankId: string
  accountId: string
  accessToken: string
  fundingSourceUrl?: string
  shareableId?: string
}): Promise<BankAccount | null> {
  // TODO: Implement with Plaid + Prisma
  console.log("createBankAccount called with:", params)
  throw new Error("Bank account creation not yet implemented. Please set up Prisma schema and Plaid integration.")
}

export async function syncTransactions(params: {
  accountId: string
  startDate?: Date
  endDate?: Date
}): Promise<{ success: boolean; count?: number; error?: string }> {
  // TODO: Implement with Plaid API
  console.log("syncTransactions called with:", params)
  return { success: false, error: "Transaction sync not yet implemented" }
}

export async function prefetchAccounts(userId: string): Promise<void> {
  // TODO: Implement cache prefetching
  console.log("prefetchAccounts called for:", userId)
}
