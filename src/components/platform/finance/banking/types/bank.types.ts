/**
 * Banking Types - Stubbed
 *
 * TODO: These types will be generated from Prisma schema when models are added
 */

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
  accessToken?: string
  createdAt: Date
  updatedAt: Date
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

export interface Transfer {
  id: string
  fromAccountId: string
  toAccountId: string
  amount: number
  currency: string
  status: "pending" | "completed" | "failed" | "cancelled"
  createdAt: Date
  completedAt?: Date
  description?: string
  reference?: string
}

export type BankingDictionary = {
  dashboard?: string
  myBanks?: string
  paymentTransfer?: string
  transactionHistory?: string
  noBanks?: string
  connectYourBank?: string
  connectBank?: string
  availableBalance?: string
  accounts?: string
  transfer?: string
  sendMoney?: string
}

// Additional types for actions.types.ts exports
export interface AccountOverview {
  accountId: string
  name: string
  balance: number
  type: string
}

export interface BankAccountWithTransactions extends BankAccount {
  transactions?: Transaction[]
}

export interface BankInstitution {
  id: string
  name: string
  logo?: string
  primaryColor?: string
  url?: string
}

export interface CreateBankAccountInput {
  userId: string
  companyId: string
  bankId: string
  accountId: string
  name: string
  type: string
  subtype: string
  institutionId: string
  accessToken?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface PaginationOptions {
  page?: number
  pageSize?: number
  cursor?: string
}

export interface PlaidLinkMetadata {
  institution?: {
    name: string
    institution_id: string
  }
  accounts?: Array<{
    id: string
    name: string
    mask: string
    type: string
    subtype: string
  }>
  link_session_id?: string
}

export interface TransactionFilters {
  accountId?: string
  startDate?: Date
  endDate?: Date
  category?: string
  type?: "debit" | "credit"
  minAmount?: number
  maxAmount?: number
}

export interface TransferWithBanks extends Transfer {
  fromAccount?: BankAccount
  toAccount?: BankAccount
}

export type TransactionType = "debit" | "credit"
export type TransferStatus = Transfer["status"]
export type PaymentChannel = "online" | "in store" | "other"
