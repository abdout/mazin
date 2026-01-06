"use server"

/**
 * Reports Module - Server Actions
 * Full Prisma implementation for financial reports
 */

import { auth } from "@/auth"
import { db } from "@/lib/db"

import type {
  BalanceSheetData,
  CashFlowData,
  IncomeStatementData,
  ReportActionResult,
  TrialBalanceData,
} from "./types"

// ============================================================================
// BALANCE SHEET (Statement of Financial Position)
// ============================================================================

export async function generateBalanceSheet(
  startDate: Date,
  endDate: Date,
  fiscalYearId?: string
): Promise<ReportActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    // Get all accounts grouped by type
    const accounts = await db.chartOfAccount.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
        accountType: { in: ["ASSET", "LIABILITY", "EQUITY"] },
      },
      include: {
        journalLines: {
          where: {
            journalEntry: {
              status: "POSTED",
              entryDate: { lte: endDate },
            },
          },
        },
      },
      orderBy: [{ accountType: "asc" }, { code: "asc" }],
    })

    const assets: { accountCode: string; accountName: string; accountType: string; balance: number }[] = []
    const liabilities: { accountCode: string; accountName: string; accountType: string; balance: number }[] = []
    const equity: { accountCode: string; accountName: string; accountType: string; balance: number }[] = []

    let totalAssets = 0
    let totalLiabilities = 0
    let totalEquity = 0

    for (const account of accounts) {
      // Calculate balance from journal lines
      let balance = 0
      for (const line of account.journalLines) {
        if (account.normalBalance === "DEBIT") {
          balance += Number(line.debitAmount) - Number(line.creditAmount)
        } else {
          balance += Number(line.creditAmount) - Number(line.debitAmount)
        }
      }

      const accountSummary = {
        accountCode: account.code,
        accountName: account.name,
        accountType: account.accountType,
        balance,
      }

      switch (account.accountType) {
        case "ASSET":
          assets.push(accountSummary)
          totalAssets += balance
          break
        case "LIABILITY":
          liabilities.push(accountSummary)
          totalLiabilities += balance
          break
        case "EQUITY":
          equity.push(accountSummary)
          totalEquity += balance
          break
      }
    }

    // If no chart of accounts, calculate from transactions
    if (accounts.length === 0) {
      // Get bank account balances as assets
      const bankAccounts = await db.bankAccount.findMany({
        where: { userId: session.user.id, status: "ACTIVE" },
      })

      for (const account of bankAccounts) {
        assets.push({
          accountCode: `BA-${account.id.slice(0, 6)}`,
          accountName: account.accountName,
          accountType: "ASSET",
          balance: Number(account.currentBalance),
        })
        totalAssets += Number(account.currentBalance)
      }

      // Get client wallet balances (money owed to clients) as liabilities
      const wallets = await db.wallet.findMany({
        where: {
          client: { userId: session.user.id },
          balance: { gt: 0 },
        },
        include: {
          client: { select: { companyName: true } },
        },
      })

      for (const wallet of wallets) {
        liabilities.push({
          accountCode: `CW-${wallet.id.slice(0, 6)}`,
          accountName: `Client Deposit: ${wallet.client.companyName}`,
          accountType: "LIABILITY",
          balance: Number(wallet.balance),
        })
        totalLiabilities += Number(wallet.balance)
      }

      // Calculate retained earnings as equity
      const retainedEarnings = totalAssets - totalLiabilities
      equity.push({
        accountCode: "RE-001",
        accountName: "Retained Earnings",
        accountType: "EQUITY",
        balance: retainedEarnings,
      })
      totalEquity = retainedEarnings
    }

    const data: BalanceSheetData = {
      assets,
      liabilities,
      equity,
      totalAssets,
      totalLiabilities,
      totalEquity,
      asOfDate: endDate,
      isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error generating balance sheet:", error)
    return { success: false, error: "Failed to generate balance sheet" }
  }
}

// ============================================================================
// INCOME STATEMENT (Profit & Loss)
// ============================================================================

export async function generateIncomeStatement(
  startDate: Date,
  endDate: Date,
  fiscalYearId?: string
): Promise<ReportActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    // Get revenue from invoices
    const invoices = await db.invoice.findMany({
      where: {
        userId: session.user.id,
        status: "PAID",
        paidAt: { gte: startDate, lte: endDate },
      },
    })

    const invoiceRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total), 0)

    // Get revenue from credit transactions
    const creditTransactions = await db.transaction.findMany({
      where: {
        userId: session.user.id,
        type: "CREDIT",
        status: "COMPLETED",
        transactionDate: { gte: startDate, lte: endDate },
        category: {
          in: [
            "INVOICE_PAYMENT",
            "SERVICE_FEE",
            "CLEARANCE_FEE",
            "DOCUMENTATION_FEE",
            "HANDLING_FEE",
            "OTHER_REVENUE",
          ],
        },
      },
    })

    // Get expenses from expense table
    const expenses = await db.expense.findMany({
      where: {
        userId: session.user.id,
        status: "PAID",
        paidAt: { gte: startDate, lte: endDate },
      },
      include: {
        category: true,
      },
    })

    // Get expenses from debit transactions
    const debitTransactions = await db.transaction.findMany({
      where: {
        userId: session.user.id,
        type: "DEBIT",
        status: "COMPLETED",
        transactionDate: { gte: startDate, lte: endDate },
        category: {
          in: [
            "PORT_CHARGE",
            "CUSTOMS_DUTY",
            "TRANSPORTATION",
            "STORAGE",
            "INSPECTION_FEE",
            "GOVERNMENT_FEE",
            "SALARY",
            "OFFICE_EXPENSE",
            "UTILITY",
            "OTHER_EXPENSE",
          ],
        },
      },
    })

    // Group revenue by category
    const revenueByCategory = new Map<string, number>()
    revenueByCategory.set("Invoice Revenue", invoiceRevenue)

    for (const tx of creditTransactions) {
      const category = tx.category
      const current = revenueByCategory.get(category) || 0
      revenueByCategory.set(category, current + Number(tx.amount))
    }

    // Group expenses by category
    const expenseByCategory = new Map<string, number>()

    for (const exp of expenses) {
      const category = exp.category?.name || "Uncategorized"
      const current = expenseByCategory.get(category) || 0
      expenseByCategory.set(category, current + Number(exp.totalAmount))
    }

    for (const tx of debitTransactions) {
      const category = tx.category
      const current = expenseByCategory.get(category) || 0
      expenseByCategory.set(category, current + Number(tx.amount))
    }

    // Build report data
    const revenue = Array.from(revenueByCategory.entries()).map(([name, balance]) => ({
      accountCode: name.toUpperCase().replace(/\s+/g, "_"),
      accountName: name,
      accountType: "REVENUE" as const,
      balance,
    }))

    const expensesList = Array.from(expenseByCategory.entries()).map(([name, balance]) => ({
      accountCode: name.toUpperCase().replace(/\s+/g, "_"),
      accountName: name,
      accountType: "EXPENSE" as const,
      balance,
    }))

    const totalRevenue = revenue.reduce((sum, r) => sum + r.balance, 0)
    const totalExpenses = expensesList.reduce((sum, e) => sum + e.balance, 0)
    const netIncome = totalRevenue - totalExpenses

    const data: IncomeStatementData = {
      revenue,
      expenses: expensesList,
      totalRevenue,
      totalExpenses,
      netIncome,
      startDate,
      endDate,
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error generating income statement:", error)
    return { success: false, error: "Failed to generate income statement" }
  }
}

// ============================================================================
// CASH FLOW STATEMENT
// ============================================================================

export async function generateCashFlowStatement(
  startDate: Date,
  endDate: Date,
  fiscalYearId?: string
): Promise<ReportActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    // Get all transactions in the period
    const transactions = await db.transaction.findMany({
      where: {
        userId: session.user.id,
        status: "COMPLETED",
        transactionDate: { gte: startDate, lte: endDate },
      },
      orderBy: { transactionDate: "asc" },
    })

    // Categorize transactions into Operating, Investing, Financing
    const operating: { description: string; amount: number; type: "INFLOW" | "OUTFLOW" }[] = []
    const investing: { description: string; amount: number; type: "INFLOW" | "OUTFLOW" }[] = []
    const financing: { description: string; amount: number; type: "INFLOW" | "OUTFLOW" }[] = []

    // Operating categories
    const operatingCategories = [
      "INVOICE_PAYMENT",
      "SERVICE_FEE",
      "CLEARANCE_FEE",
      "DOCUMENTATION_FEE",
      "HANDLING_FEE",
      "OTHER_REVENUE",
      "PORT_CHARGE",
      "CUSTOMS_DUTY",
      "TRANSPORTATION",
      "STORAGE",
      "INSPECTION_FEE",
      "GOVERNMENT_FEE",
      "SALARY",
      "OFFICE_EXPENSE",
      "UTILITY",
      "OTHER_EXPENSE",
    ]

    // Financing categories
    const financingCategories = [
      "CLIENT_DEPOSIT",
      "CLIENT_REFUND",
    ]

    // Transfer categories (excluded from cash flow - internal movements)
    const transferCategories = [
      "INTERNAL_TRANSFER",
    ]

    for (const tx of transactions) {
      const isInflow = tx.type === "CREDIT"
      const amount = Number(tx.amount)
      const item = {
        description: tx.description,
        amount,
        type: isInflow ? "INFLOW" as const : "OUTFLOW" as const,
      }

      if (transferCategories.includes(tx.category)) {
        continue // Skip internal transfers
      }

      if (operatingCategories.includes(tx.category)) {
        operating.push(item)
      } else if (financingCategories.includes(tx.category)) {
        financing.push(item)
      } else {
        // Default to operating
        operating.push(item)
      }
    }

    // Calculate net amounts
    const calculateNet = (items: { amount: number; type: "INFLOW" | "OUTFLOW" }[]) => {
      return items.reduce((sum, item) => {
        return item.type === "INFLOW" ? sum + item.amount : sum - item.amount
      }, 0)
    }

    const netOperating = calculateNet(operating)
    const netInvesting = calculateNet(investing)
    const netFinancing = calculateNet(financing)
    const netCashFlow = netOperating + netInvesting + netFinancing

    const data: CashFlowData = {
      operating,
      investing,
      financing,
      netOperating,
      netInvesting,
      netFinancing,
      netCashFlow,
      startDate,
      endDate,
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error generating cash flow statement:", error)
    return { success: false, error: "Failed to generate cash flow statement" }
  }
}

// ============================================================================
// TRIAL BALANCE
// ============================================================================

export async function generateTrialBalance(
  fiscalYearId?: string,
  asOfDate?: Date
): Promise<ReportActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const date = asOfDate || new Date()

    // Get all accounts with their journal entries
    const accounts = await db.chartOfAccount.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      include: {
        journalLines: {
          where: {
            journalEntry: {
              status: "POSTED",
              entryDate: { lte: date },
            },
          },
        },
      },
      orderBy: [{ accountType: "asc" }, { code: "asc" }],
    })

    const trialBalanceAccounts: {
      accountCode: string
      accountName: string
      accountType: string
      debitBalance: number
      creditBalance: number
    }[] = []

    let totalDebits = 0
    let totalCredits = 0

    for (const account of accounts) {
      let debitBalance = 0
      let creditBalance = 0

      for (const line of account.journalLines) {
        debitBalance += Number(line.debitAmount)
        creditBalance += Number(line.creditAmount)
      }

      // Calculate net balance based on normal balance
      const netDebit = debitBalance - creditBalance
      if (netDebit > 0) {
        debitBalance = netDebit
        creditBalance = 0
      } else if (netDebit < 0) {
        debitBalance = 0
        creditBalance = -netDebit
      } else {
        debitBalance = 0
        creditBalance = 0
      }

      if (debitBalance > 0 || creditBalance > 0) {
        trialBalanceAccounts.push({
          accountCode: account.code,
          accountName: account.name,
          accountType: account.accountType,
          debitBalance,
          creditBalance,
        })

        totalDebits += debitBalance
        totalCredits += creditBalance
      }
    }

    // If no chart of accounts, create a simple trial balance from transactions
    if (accounts.length === 0) {
      // Bank accounts (Asset - Debit)
      const bankAccounts = await db.bankAccount.findMany({
        where: { userId: session.user.id },
      })

      for (const bank of bankAccounts) {
        const balance = Number(bank.currentBalance)
        if (balance !== 0) {
          trialBalanceAccounts.push({
            accountCode: `BA-${bank.id.slice(0, 6)}`,
            accountName: `Bank: ${bank.accountName}`,
            accountType: "ASSET",
            debitBalance: balance > 0 ? balance : 0,
            creditBalance: balance < 0 ? -balance : 0,
          })
          if (balance > 0) totalDebits += balance
          else totalCredits += -balance
        }
      }
    }

    const data: TrialBalanceData = {
      accounts: trialBalanceAccounts,
      totalDebits,
      totalCredits,
      isBalanced: Math.abs(totalDebits - totalCredits) < 0.01,
      asOfDate: date,
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error generating trial balance:", error)
    return { success: false, error: "Failed to generate trial balance" }
  }
}

// ============================================================================
// EXPENSE ANALYSIS REPORT
// ============================================================================

export async function generateExpenseAnalysis(
  startDate: Date,
  endDate: Date
): Promise<ReportActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    // Get expenses grouped by category
    const expenses = await db.expense.findMany({
      where: {
        userId: session.user.id,
        expenseDate: { gte: startDate, lte: endDate },
        status: { in: ["APPROVED", "PAID"] },
      },
      include: {
        category: true,
      },
    })

    // Group by category
    const byCategory = new Map<string, {
      name: string
      count: number
      total: number
      percentage: number
    }>()

    const grandTotal = expenses.reduce((sum, e) => sum + Number(e.totalAmount), 0)

    for (const expense of expenses) {
      const categoryName = expense.category?.name || "Uncategorized"
      const current = byCategory.get(categoryName) || { name: categoryName, count: 0, total: 0, percentage: 0 }
      current.count += 1
      current.total += Number(expense.totalAmount)
      byCategory.set(categoryName, current)
    }

    // Calculate percentages
    for (const [, category] of byCategory) {
      category.percentage = grandTotal > 0 ? (category.total / grandTotal) * 100 : 0
    }

    // Get monthly trend
    const monthlyTrend: { month: string; amount: number }[] = []
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

      const monthTotal = expenses
        .filter((e) => e.expenseDate >= monthStart && e.expenseDate <= monthEnd)
        .reduce((sum, e) => sum + Number(e.totalAmount), 0)

      monthlyTrend.push({
        month: monthStart.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        amount: monthTotal,
      })

      currentDate.setMonth(currentDate.getMonth() + 1)
    }

    // Get top expenses
    const topExpenses = expenses
      .sort((a, b) => Number(b.totalAmount) - Number(a.totalAmount))
      .slice(0, 10)
      .map((e) => ({
        id: e.id,
        description: e.description,
        amount: Number(e.totalAmount),
        category: e.category?.name || "Uncategorized",
        date: e.expenseDate,
      }))

    return {
      success: true,
      data: {
        totalExpenses: grandTotal,
        expenseCount: expenses.length,
        averageExpense: expenses.length > 0 ? grandTotal / expenses.length : 0,
        byCategory: Array.from(byCategory.values()).sort((a, b) => b.total - a.total),
        monthlyTrend,
        topExpenses,
        startDate,
        endDate,
      },
    }
  } catch (error) {
    console.error("Error generating expense analysis:", error)
    return { success: false, error: "Failed to generate expense analysis" }
  }
}

// ============================================================================
// REVENUE ANALYSIS REPORT
// ============================================================================

export async function generateRevenueAnalysis(
  startDate: Date,
  endDate: Date
): Promise<ReportActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    // Get paid invoices
    const invoices = await db.invoice.findMany({
      where: {
        userId: session.user.id,
        status: "PAID",
        paidAt: { gte: startDate, lte: endDate },
      },
      include: {
        client: { select: { companyName: true } },
      },
    })

    const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total), 0)

    // Group by client
    const byClient = new Map<string, { name: string; revenue: number; invoiceCount: number; percentage: number }>()

    for (const invoice of invoices) {
      const clientName = invoice.client?.companyName || "Unknown Client"
      const current = byClient.get(clientName) || { name: clientName, revenue: 0, invoiceCount: 0, percentage: 0 }
      current.revenue += Number(invoice.total)
      current.invoiceCount += 1
      byClient.set(clientName, current)
    }

    // Calculate percentages
    for (const [, client] of byClient) {
      client.percentage = totalRevenue > 0 ? (client.revenue / totalRevenue) * 100 : 0
    }

    // Get monthly trend
    const monthlyTrend: { month: string; revenue: number; invoiceCount: number }[] = []
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

      const monthInvoices = invoices.filter(
        (inv) => inv.paidAt && inv.paidAt >= monthStart && inv.paidAt <= monthEnd
      )

      monthlyTrend.push({
        month: monthStart.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        revenue: monthInvoices.reduce((sum, inv) => sum + Number(inv.total), 0),
        invoiceCount: monthInvoices.length,
      })

      currentDate.setMonth(currentDate.getMonth() + 1)
    }

    return {
      success: true,
      data: {
        totalRevenue,
        invoiceCount: invoices.length,
        averageInvoice: invoices.length > 0 ? totalRevenue / invoices.length : 0,
        byClient: Array.from(byClient.values()).sort((a, b) => b.revenue - a.revenue),
        monthlyTrend,
        topClients: Array.from(byClient.values())
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10),
        startDate,
        endDate,
      },
    }
  } catch (error) {
    console.error("Error generating revenue analysis:", error)
    return { success: false, error: "Failed to generate revenue analysis" }
  }
}

// ============================================================================
// BUDGET VARIANCE REPORT
// ============================================================================

export async function generateBudgetVarianceReport(
  budgetId?: string
): Promise<ReportActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    // Get active budget or specific budget
    const where: any = { userId: session.user.id }
    if (budgetId) {
      where.id = budgetId
    } else {
      where.status = "ACTIVE"
    }

    const budget = await db.budget.findFirst({
      where,
      include: {
        items: true,
      },
      orderBy: { createdAt: "desc" },
    })

    if (!budget) {
      return { success: false, error: "No budget found" }
    }

    // Calculate variances
    const items = budget.items.map((item) => {
      const allocated = Number(item.allocated)
      const spent = Number(item.spent)
      const variance = allocated - spent
      const variancePercent = allocated > 0 ? (variance / allocated) * 100 : 0
      const utilizationPercent = allocated > 0 ? (spent / allocated) * 100 : 0

      return {
        categoryName: item.categoryName,
        categoryCode: item.categoryCode,
        allocated,
        spent,
        remaining: Number(item.remaining),
        variance,
        variancePercent,
        utilizationPercent,
        status: utilizationPercent > 100 ? "OVER_BUDGET" : utilizationPercent > 80 ? "WARNING" : "ON_TRACK",
      }
    })

    const totalAllocated = Number(budget.totalAllocated)
    const totalSpent = Number(budget.totalSpent)
    const totalVariance = totalAllocated - totalSpent
    const overallUtilization = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0

    return {
      success: true,
      data: {
        budgetId: budget.id,
        budgetName: budget.name,
        fiscalYear: budget.fiscalYear,
        status: budget.status,
        startDate: budget.startDate,
        endDate: budget.endDate,
        summary: {
          totalAllocated,
          totalSpent,
          totalRemaining: Number(budget.totalRemaining),
          totalVariance,
          overallUtilization,
        },
        items: items.sort((a, b) => a.variancePercent - b.variancePercent), // Worst variances first
        overBudgetItems: items.filter((i) => i.status === "OVER_BUDGET"),
        warningItems: items.filter((i) => i.status === "WARNING"),
      },
    }
  } catch (error) {
    console.error("Error generating budget variance report:", error)
    return { success: false, error: "Failed to generate budget variance report" }
  }
}

// ============================================================================
// AVAILABLE REPORTS
// ============================================================================

export async function getAvailableReports() {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  const reports = [
    {
      id: "BALANCE_SHEET",
      name: "Balance Sheet",
      nameAr: "الميزانية العمومية",
      description: "Assets, liabilities, and equity as of a specific date",
      descriptionAr: "الأصول والخصوم وحقوق الملكية في تاريخ محدد",
      category: "FINANCIAL_STATEMENTS",
    },
    {
      id: "INCOME_STATEMENT",
      name: "Income Statement",
      nameAr: "قائمة الدخل",
      description: "Revenue, expenses, and net income for a period",
      descriptionAr: "الإيرادات والمصروفات وصافي الدخل لفترة محددة",
      category: "FINANCIAL_STATEMENTS",
    },
    {
      id: "CASH_FLOW",
      name: "Cash Flow Statement",
      nameAr: "قائمة التدفقات النقدية",
      description: "Cash inflows and outflows from operating, investing, and financing",
      descriptionAr: "التدفقات النقدية الداخلة والخارجة من الأنشطة التشغيلية والاستثمارية والتمويلية",
      category: "FINANCIAL_STATEMENTS",
    },
    {
      id: "TRIAL_BALANCE",
      name: "Trial Balance",
      nameAr: "ميزان المراجعة",
      description: "Account balances verification before preparing financial statements",
      descriptionAr: "التحقق من أرصدة الحسابات قبل إعداد القوائم المالية",
      category: "ACCOUNTING",
    },
    {
      id: "EXPENSE_ANALYSIS",
      name: "Expense Analysis",
      nameAr: "تحليل المصروفات",
      description: "Detailed breakdown of expenses by category and trend analysis",
      descriptionAr: "تحليل تفصيلي للمصروفات حسب الفئة وتحليل الاتجاهات",
      category: "ANALYSIS",
    },
    {
      id: "REVENUE_ANALYSIS",
      name: "Revenue Analysis",
      nameAr: "تحليل الإيرادات",
      description: "Revenue breakdown by client and monthly trends",
      descriptionAr: "تحليل الإيرادات حسب العميل والاتجاهات الشهرية",
      category: "ANALYSIS",
    },
    {
      id: "BUDGET_VARIANCE",
      name: "Budget Variance",
      nameAr: "انحراف الميزانية",
      description: "Comparison of budgeted vs actual spending",
      descriptionAr: "مقارنة بين الميزانية المخططة والإنفاق الفعلي",
      category: "BUDGETING",
    },
  ]

  return { success: true, data: reports }
}

// ============================================================================
// REPORT GENERATION DISPATCHER
// ============================================================================

export async function generateReport(
  reportType: string,
  startDate: Date,
  endDate: Date,
  options?: Record<string, any>
): Promise<ReportActionResult> {
  switch (reportType) {
    case "BALANCE_SHEET":
      return generateBalanceSheet(startDate, endDate, options?.fiscalYearId)

    case "INCOME_STATEMENT":
      return generateIncomeStatement(startDate, endDate, options?.fiscalYearId)

    case "CASH_FLOW":
      return generateCashFlowStatement(startDate, endDate, options?.fiscalYearId)

    case "TRIAL_BALANCE":
      return generateTrialBalance(options?.fiscalYearId, endDate)

    case "EXPENSE_ANALYSIS":
      return generateExpenseAnalysis(startDate, endDate)

    case "REVENUE_ANALYSIS":
      return generateRevenueAnalysis(startDate, endDate)

    case "BUDGET_VARIANCE":
      return generateBudgetVarianceReport(options?.budgetId)

    default:
      return { success: false, error: `Unknown report type: ${reportType}` }
  }
}
