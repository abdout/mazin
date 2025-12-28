/**
 * Chart of Accounts Seed Data - Stubbed Implementation
 *
 * Default accounts for customs clearance company finance management
 * TODO: Implement with Prisma when accounting models are added
 */

// Import AccountType from types to avoid duplicate exports
import { AccountType } from "./types"

// Local BalanceType enum (stubbed until Prisma models are added)
const BalanceType = {
  DEBIT: "DEBIT",
  CREDIT: "CREDIT",
} as const

type BalanceType = (typeof BalanceType)[keyof typeof BalanceType]

// Helper function to determine normal balance based on account type
function getNormalBalance(accountType: AccountType): BalanceType {
  switch (accountType) {
    case AccountType.ASSET:
    case AccountType.EXPENSE:
      return BalanceType.DEBIT
    case AccountType.LIABILITY:
    case AccountType.EQUITY:
    case AccountType.REVENUE:
      return BalanceType.CREDIT
    default:
      return BalanceType.DEBIT
  }
}

interface AccountSeedData {
  code: string
  name: string
  nameAr: string
  type: AccountType
  description: string
  isActive: boolean
  parentAccountCode?: string
}

/**
 * Standard chart of accounts for customs clearance company
 */
const standardAccounts: AccountSeedData[] = [
  // ===== ASSETS =====
  {
    code: "1000",
    name: "Cash",
    nameAr: "النقدية",
    type: AccountType.ASSET,
    description: "Cash on hand and petty cash",
    isActive: true,
  },
  {
    code: "1010",
    name: "Bank Account - Operating (SDG)",
    nameAr: "حساب البنك - التشغيلي (ج.س)",
    type: AccountType.ASSET,
    description: "Main operating bank account in SDG",
    isActive: true,
  },
  {
    code: "1100",
    name: "Accounts Receivable",
    nameAr: "ذمم العملاء",
    type: AccountType.ASSET,
    description: "Amounts owed by clients",
    isActive: true,
  },
  // ===== LIABILITIES =====
  {
    code: "2000",
    name: "Accounts Payable",
    nameAr: "ذمم الموردين",
    type: AccountType.LIABILITY,
    description: "Amounts owed to suppliers and vendors",
    isActive: true,
  },
  {
    code: "2100",
    name: "Salary Payable",
    nameAr: "رواتب مستحقة",
    type: AccountType.LIABILITY,
    description: "Accrued salary obligations",
    isActive: true,
  },
  // ===== EQUITY =====
  {
    code: "3000",
    name: "Share Capital",
    nameAr: "رأس المال",
    type: AccountType.EQUITY,
    description: "Owner's capital contribution",
    isActive: true,
  },
  // ===== REVENUE =====
  {
    code: "4000",
    name: "Clearance Service Revenue",
    nameAr: "إيرادات خدمات التخليص",
    type: AccountType.REVENUE,
    description: "Revenue from clearance services",
    isActive: true,
  },
  // ===== EXPENSES =====
  {
    code: "5000",
    name: "Salary Expense",
    nameAr: "مصروف الرواتب",
    type: AccountType.EXPENSE,
    description: "Staff salaries and wages",
    isActive: true,
  },
]

/**
 * Seed chart of accounts for a company (stubbed)
 */
export async function seedChartOfAccounts(companyId: string): Promise<void> {
  console.log(`seedChartOfAccounts called for company: ${companyId}`)
  console.log(`Would seed ${standardAccounts.length} accounts`)
}

/**
 * Get or create default fiscal year (stubbed)
 */
export async function getOrCreateFiscalYear(
  companyId: string,
  year?: number
): Promise<string> {
  console.log("getOrCreateFiscalYear called:", { companyId, year })
  return `stub-fiscal-year-${year || new Date().getFullYear()}`
}

/**
 * Initialize accounting system for a company (stubbed)
 */
export async function initializeAccountingSystem(companyId: string): Promise<{
  success: boolean
  accountsCreated: number
  fiscalYearId: string
}> {
  console.log("initializeAccountingSystem called:", companyId)

  return {
    success: true,
    accountsCreated: standardAccounts.length,
    fiscalYearId: await getOrCreateFiscalYear(companyId),
  }
}
