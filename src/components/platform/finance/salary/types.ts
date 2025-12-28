/**
 * Salary Sub-Block Types
 *
 * Feature-based sub-block for staff salary management
 */

// Stub types (will be replaced when Prisma models are added)
interface SalaryStructure {
  id: string
  employeeId: string
  basicSalary: number
  status: string
  effectiveFrom: Date
  effectiveTo: Date | null
  companyId: string
  createdAt: Date
  updatedAt: Date
}

interface SalaryAllowance {
  id: string
  salaryStructureId: string
  name: string
  amount: number
  isPercentage: boolean
  percentage: number | null
}

interface SalaryDeduction {
  id: string
  salaryStructureId: string
  name: string
  amount: number
  isPercentage: boolean
  percentage: number | null
}

// Extended types with relations
export type SalaryStructureWithRelations = SalaryStructure & {
  employee: {
    id: string
    givenName: string
    surname: string
    employeeId: string | null
  }
  allowances?: SalaryAllowance[]
  deductions?: SalaryDeduction[]
  _count?: {
    allowances: number
    deductions: number
  }
}

export type SalaryAllowanceWithRelations = SalaryAllowance & {
  salaryStructure: SalaryStructure & {
    employee: {
      id: string
      givenName: string
      surname: string
    }
  }
}

export type SalaryDeductionWithRelations = SalaryDeduction & {
  salaryStructure: SalaryStructure & {
    employee: {
      id: string
      givenName: string
      surname: string
    }
  }
}

// View Models
export type SalaryStructureListItem = {
  id: string
  teacherId: string
  teacherName: string
  employeeId: string | null
  basicSalary: number
  totalAllowances: number
  totalDeductions: number
  netSalary: number
  status: string
  effectiveFrom: Date
  effectiveTo: Date | null
  allowanceCount: number
  deductionCount: number
}

export type SalaryCalculationResult = {
  basicSalary: number
  allowances: {
    name: string
    amount: number
    isPercentage: boolean
    percentage: number | null
  }[]
  deductions: {
    name: string
    amount: number
    isPercentage: boolean
    percentage: number | null
  }[]
  totalAllowances: number
  totalDeductions: number
  grossSalary: number
  netSalary: number
  taxAmount: number
  socialSecurityAmount: number
}

export type StaffSalarySummary = {
  totalStaff: number
  activeStructures: number
  totalMonthlySalary: number
  averageSalary: number
  highestSalary: number
  lowestSalary: number
}

// Salary components
export type SalaryComponent = {
  name: string
  amount: number
  isPercentage: boolean
  percentage: number | null
  isRecurring: boolean
  description: string | null
}

// Calculator input
export type SalaryCalculatorInput = {
  basicSalary: number
  allowances: {
    name: string
    amount?: number
    percentage?: number
    isPercentage: boolean
  }[]
  deductions: {
    name: string
    amount?: number
    percentage?: number
    isPercentage: boolean
  }[]
  taxRate?: number
  socialSecurityRate?: number
}
