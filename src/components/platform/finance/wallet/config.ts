/**
 * Wallet Module - Configuration
 */

// Local enums (stubbed until Prisma models are added)
export const WalletType = {
  COMPANY: "COMPANY",
  CLIENT: "CLIENT",
  EMPLOYEE: "EMPLOYEE",
} as const

export type WalletType = (typeof WalletType)[keyof typeof WalletType]

export const TransactionType = {
  CREDIT: "CREDIT",
  DEBIT: "DEBIT",
  TRANSFER: "TRANSFER",
} as const

export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType]

export const WalletTypeLabels: Record<WalletType, string> = {
  COMPANY: "Company Wallet",
  CLIENT: "Client Wallet",
  EMPLOYEE: "Employee Wallet",
}

export const WalletTransactionTypeLabels: Record<TransactionType, string> = {
  CREDIT: "Credit (Top-up)",
  DEBIT: "Debit (Payment)",
  TRANSFER: "Transfer",
}

export const PaymentMethods = [
  "CASH",
  "CARD",
  "BANK_TRANSFER",
  "WALLET",
  "OTHER",
] as const

export type PaymentMethod = (typeof PaymentMethods)[number]

export const PaymentMethodLabels: Record<PaymentMethod, string> = {
  CASH: "Cash",
  CARD: "Credit/Debit Card",
  BANK_TRANSFER: "Bank Transfer",
  WALLET: "Wallet",
  OTHER: "Other",
}

export const WALLET_LIMITS = {
  MIN_BALANCE: 0,
  MAX_BALANCE: 100000000, // $1,000,000 in cents
  MIN_TOPUP: 100, // $1.00 in cents
  MAX_TOPUP: 10000000, // $100,000 in cents
  MIN_REFUND: 100, // $1.00 in cents
} as const

export const WALLET_CONFIG = {
  AUTO_CREATE_FOR_CLIENTS: true,
  AUTO_CREATE_FOR_EMPLOYEES: false,
  REQUIRE_APPROVAL_FOR_REFUNDS: true,
  ENABLE_OVERDRAFT: false,
} as const
