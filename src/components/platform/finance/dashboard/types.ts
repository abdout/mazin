/**
 * Dashboard Types for Finance Module
 * Customs Clearance Financial KPIs and Metrics
 */

export interface FinancialKPI {
  id: string
  title: string
  titleAr?: string
  value: string | number
  change?: number
  changeType?: "increase" | "decrease" | "neutral"
  icon?: string
  description?: string
  trend?: number[]
  color?: "blue" | "green" | "red" | "yellow" | "purple" | "orange"
}

export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string
    fill?: boolean
  }[]
}

export interface DashboardStats {
  // Revenue Metrics
  totalRevenue: number
  collectedRevenue: number
  outstandingRevenue: number
  collectionRate: number

  // Expense Metrics
  totalExpenses: number
  budgetUsed: number
  budgetRemaining: number
  expenseCategories: {
    category: string
    amount: number
    percentage: number
  }[]

  // Profit Metrics
  grossProfit: number
  netProfit: number
  profitMargin: number

  // Cash Flow Metrics
  cashBalance: number
  cashInflow: number
  cashOutflow: number
  cashRunway: number // months

  // Invoice Metrics
  totalInvoices: number
  paidInvoices: number
  pendingInvoices: number
  overdueInvoices: number
  overdueAmount: number

  // Payroll Metrics
  totalPayroll: number
  payrollProcessed: number
  pendingPayroll: number

  // Clearance Operations Metrics
  totalShipments: number
  activeShipments: number
  completedShipments: number
  averageRevenuePerShipment: number

  // Client Metrics
  totalClients: number
  activeClients: number
  clientsWithOutstanding: number
  averageClientBalance: number

  // Banking Metrics
  bankAccounts: {
    name: string
    balance: number
    currency: string
    type: string
  }[]

  // Budget Metrics
  budgetCategories: {
    category: string
    allocated: number
    spent: number
    remaining: number
    percentage: number
  }[]

  // Trends
  revenueTrend: number[] // last 12 months
  expensesTrend: number[] // last 12 months
  profitTrend: number[] // last 12 months
  shipmentsTrend: number[] // last 12 months
}

export interface QuickAction {
  id: string
  label: string
  labelAr?: string
  icon: string
  href?: string
  action?: () => void
  color?: string
  description?: string
  descriptionAr?: string
  permission?: string
}

export interface RecentTransaction {
  id: string
  type: "income" | "expense" | "transfer" | "duty"
  description: string
  amount: number
  currency?: string
  date: Date
  status: "completed" | "pending" | "failed"
  category?: string
  reference?: string
  shipmentId?: string
  clientName?: string
}

export interface FinancialAlert {
  id: string
  type: "warning" | "error" | "info" | "success"
  title: string
  titleAr?: string
  description: string
  descriptionAr?: string
  action?: {
    label: string
    labelAr?: string
    href: string
  }
  timestamp: Date
}

export interface DashboardFilters {
  dateRange: "today" | "week" | "month" | "quarter" | "year" | "custom"
  startDate?: Date
  endDate?: Date
  fiscalYear?: string
  department?: string
  category?: string
  clientId?: string
  serviceType?: string
}

export interface RoleBasedDashboard {
  role: "ADMIN" | "ACCOUNTANT" | "MANAGER" | "OPERATOR" | "STAFF"
  kpis: FinancialKPI[]
  charts: {
    revenue?: boolean
    expenses?: boolean
    cashFlow?: boolean
    shipments?: boolean
    budgetUtilization?: boolean
    payroll?: boolean
    clientBalances?: boolean
  }
  quickActions: QuickAction[]
  sections: {
    overview: boolean
    invoices: boolean
    expenses: boolean
    banking: boolean
    reports: boolean
    alerts: boolean
    shipments?: boolean
  }
}

/**
 * Customs Clearance specific dashboard types
 */
export interface ShipmentFinancialSummary {
  shipmentId: string
  clientName: string
  serviceType: "import" | "export" | "transit"
  totalCharges: number
  dutiesCollected: number
  serviceFees: number
  portCharges: number
  transportCharges: number
  otherCharges: number
  totalPaid: number
  outstanding: number
  status: "pending" | "partial" | "paid" | "overdue"
}

export interface ClientFinancialSummary {
  clientId: string
  clientName: string
  totalShipments: number
  totalBilled: number
  totalPaid: number
  outstanding: number
  creditLimit: number
  creditUsed: number
  paymentTerms: string
  lastPaymentDate?: Date
  averagePaymentDays: number
}

export interface DutyPaymentSummary {
  totalDutiesCollected: number
  dutiesPaidToGovernment: number
  dutiesPending: number
  dutiesOverdue: number
  byCategory: {
    category: string
    amount: number
  }[]
}

export interface OperationalMetrics {
  averageProcessingTime: number // in hours
  shipmentsPerDay: number
  revenuePerEmployee: number
  expenseRatio: number
  clientRetentionRate: number
  onTimeDeliveryRate: number
}
