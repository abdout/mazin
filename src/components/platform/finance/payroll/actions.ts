"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { auth } from "@/auth"
import { PayrollRunStatus, PayrollItemStatus, EmployeeStatus } from "@prisma/client"
import { z } from "zod"
import {
  TAX_BRACKETS,
  SOCIAL_SECURITY_RATE,
  STANDARD_WORKING_DAYS,
  OVERTIME_MULTIPLIERS,
} from "./config"

// Types
type ActionResult<T = void> = {
  success: boolean
  data?: T
  error?: string
}

// Validation schemas
const createPayrollRunSchema = z.object({
  periodMonth: z.number().min(1).max(12),
  periodYear: z.number().min(2020).max(2100),
  bankAccountId: z.string().optional(),
})

const createEmployeeSchema = z.object({
  employeeNo: z.string().min(1, "Employee number is required"),
  givenName: z.string().min(1, "Given name is required"),
  surname: z.string().min(1, "Surname is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  hireDate: z.date().optional(),
  bankName: z.string().optional(),
  bankBranch: z.string().optional(),
  accountNumber: z.string().optional(),
  basicSalary: z.number().positive("Basic salary must be positive"),
})

// Helper: Generate run number
function generateRunNumber(month: number, year: number): string {
  return `PR-${year}-${month.toString().padStart(2, "0")}`
}

// Helper: Generate slip number
function generateSlipNumber(runNumber: string, index: number): string {
  return `${runNumber}-${(index + 1).toString().padStart(3, "0")}`
}

// Helper: Calculate progressive tax
function calculateProgressiveTax(grossSalary: number): number {
  let tax = 0
  let remainingIncome = grossSalary

  for (const bracket of TAX_BRACKETS) {
    if (remainingIncome <= 0) break

    const taxableInBracket = bracket.to
      ? Math.min(remainingIncome, bracket.to - bracket.from)
      : remainingIncome

    tax += (taxableInBracket * bracket.rate) / 100
    remainingIncome -= taxableInBracket
  }

  return Math.round(tax * 100) / 100
}

// Helper: Calculate social security
function calculateSocialSecurity(grossSalary: number): number {
  return Math.round((grossSalary * SOCIAL_SECURITY_RATE) / 100 * 100) / 100
}

// ============================================
// EMPLOYEE MANAGEMENT
// ============================================

export async function getEmployees(
  status?: EmployeeStatus
): Promise<ActionResult<unknown[]>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const employees = await db.employee.findMany({
      where: status ? { status } : undefined,
      include: {
        salaryStructures: {
          where: { status: "ACTIVE" },
          take: 1,
          orderBy: { effectiveFrom: "desc" },
        },
      },
      orderBy: { surname: "asc" },
    })

    return { success: true, data: employees }
  } catch (error) {
    console.error("Error fetching employees:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch employees",
    }
  }
}

export async function getEmployee(employeeId: string): Promise<ActionResult<unknown>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const employee = await db.employee.findUnique({
      where: { id: employeeId },
      include: {
        salaryStructures: {
          include: {
            allowances: true,
            deductions: true,
          },
          orderBy: { effectiveFrom: "desc" },
        },
        payrollItems: {
          take: 12,
          orderBy: { createdAt: "desc" },
          include: {
            payrollRun: {
              select: {
                runNumber: true,
                periodMonth: true,
                periodYear: true,
              },
            },
          },
        },
      },
    })

    if (!employee) {
      return { success: false, error: "Employee not found" }
    }

    return { success: true, data: employee }
  } catch (error) {
    console.error("Error fetching employee:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch employee",
    }
  }
}

export async function createEmployee(
  input: z.infer<typeof createEmployeeSchema>
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const validated = createEmployeeSchema.parse(input)

    const result = await db.$transaction(async (tx) => {
      // Create employee
      const employee = await tx.employee.create({
        data: {
          employeeNo: validated.employeeNo,
          givenName: validated.givenName,
          surname: validated.surname,
          email: validated.email || null,
          phone: validated.phone,
          jobTitle: validated.jobTitle,
          department: validated.department,
          hireDate: validated.hireDate || new Date(),
          bankName: validated.bankName,
          bankBranch: validated.bankBranch,
          accountNumber: validated.accountNumber,
          status: "ACTIVE",
        },
      })

      // Create initial salary structure
      await tx.salaryStructure.create({
        data: {
          employeeId: employee.id,
          basicSalary: validated.basicSalary,
          status: "ACTIVE",
          effectiveFrom: new Date(),
        },
      })

      return employee
    })

    revalidatePath("/finance/payroll")

    return { success: true, data: { id: result.id } }
  } catch (error) {
    console.error("Error creating employee:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Validation error" }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create employee",
    }
  }
}

export async function updateEmployee(
  employeeId: string,
  input: Partial<z.infer<typeof createEmployeeSchema>>
): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const { basicSalary, ...employeeData } = input

    await db.$transaction(async (tx) => {
      // Update employee info
      if (Object.keys(employeeData).length > 0) {
        await tx.employee.update({
          where: { id: employeeId },
          data: employeeData,
        })
      }

      // Update salary if provided
      if (basicSalary !== undefined) {
        // Deactivate current structure
        await tx.salaryStructure.updateMany({
          where: {
            employeeId,
            status: "ACTIVE",
          },
          data: {
            status: "INACTIVE",
            effectiveTo: new Date(),
          },
        })

        // Create new structure
        await tx.salaryStructure.create({
          data: {
            employeeId,
            basicSalary,
            status: "ACTIVE",
            effectiveFrom: new Date(),
          },
        })
      }
    })

    revalidatePath("/finance/payroll")

    return { success: true }
  } catch (error) {
    console.error("Error updating employee:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update employee",
    }
  }
}

// ============================================
// PAYROLL RUN ACTIONS
// ============================================

export async function getPayrollRuns(
  status?: PayrollRunStatus
): Promise<ActionResult<unknown[]>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const runs = await db.payrollRun.findMany({
      where: status ? { status } : undefined,
      include: {
        _count: {
          select: { items: true },
        },
        bankAccount: {
          select: {
            id: true,
            accountName: true,
            bankName: true,
          },
        },
      },
      orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
    })

    return {
      success: true,
      data: runs.map((r) => ({
        ...r,
        totalGross: Number(r.totalGross),
        totalNet: Number(r.totalNet),
        employeeCount: r._count.items,
      })),
    }
  } catch (error) {
    console.error("Error fetching payroll runs:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch payroll runs",
    }
  }
}

export async function getPayrollRun(runId: string): Promise<ActionResult<unknown>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const run = await db.payrollRun.findUnique({
      where: { id: runId },
      include: {
        items: {
          include: {
            employee: {
              select: {
                id: true,
                employeeNo: true,
                givenName: true,
                surname: true,
                jobTitle: true,
                bankName: true,
                accountNumber: true,
              },
            },
          },
          orderBy: { employee: { surname: "asc" } },
        },
        bankAccount: true,
        processedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!run) {
      return { success: false, error: "Payroll run not found" }
    }

    return {
      success: true,
      data: {
        ...run,
        totalGross: Number(run.totalGross),
        totalNet: Number(run.totalNet),
        items: run.items.map((item) => ({
          ...item,
          basicSalary: Number(item.basicSalary),
          totalAllowances: Number(item.totalAllowances),
          grossSalary: Number(item.grossSalary),
          totalDeductions: Number(item.totalDeductions),
          netSalary: Number(item.netSalary),
          incomeTax: Number(item.incomeTax),
          socialSecurity: Number(item.socialSecurity),
          overtimeAmount: Number(item.overtimeAmount),
          overtimeHours: Number(item.overtimeHours),
        })),
      },
    }
  } catch (error) {
    console.error("Error fetching payroll run:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch payroll run",
    }
  }
}

export async function createPayrollRun(
  input: z.infer<typeof createPayrollRunSchema>
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const validated = createPayrollRunSchema.parse(input)

    // Check if run already exists for this period
    const existing = await db.payrollRun.findFirst({
      where: {
        periodMonth: validated.periodMonth,
        periodYear: validated.periodYear,
      },
    })

    if (existing) {
      return {
        success: false,
        error: `Payroll run for ${validated.periodMonth}/${validated.periodYear} already exists`,
      }
    }

    // Get active employees with salary structures
    const employees = await db.employee.findMany({
      where: { status: "ACTIVE" },
      include: {
        salaryStructures: {
          where: { status: "ACTIVE" },
          take: 1,
          include: {
            allowances: true,
            deductions: true,
          },
        },
      },
    })

    if (employees.length === 0) {
      return { success: false, error: "No active employees found" }
    }

    const runNumber = generateRunNumber(validated.periodMonth, validated.periodYear)
    const periodStart = new Date(validated.periodYear, validated.periodMonth - 1, 1)
    const periodEnd = new Date(validated.periodYear, validated.periodMonth, 0)

    const result = await db.$transaction(async (tx) => {
      // Create payroll run
      const run = await tx.payrollRun.create({
        data: {
          runNumber,
          periodMonth: validated.periodMonth,
          periodYear: validated.periodYear,
          periodStart,
          periodEnd,
          bankAccountId: validated.bankAccountId,
          status: "DRAFT",
        },
      })

      let totalGross = 0
      let totalNet = 0

      // Generate payroll items for each employee
      for (let i = 0; i < employees.length; i++) {
        const emp = employees[i]
        if (!emp) continue
        const salary = emp.salaryStructures[0]

        if (!salary) continue

        const basicSalary = Number(salary.basicSalary)

        // Calculate allowances
        let totalAllowances = 0
        for (const allowance of salary.allowances) {
          if (allowance.isPercentage) {
            totalAllowances += basicSalary * (Number(allowance.amount) / 100)
          } else {
            totalAllowances += Number(allowance.amount)
          }
        }

        const grossSalary = basicSalary + totalAllowances

        // Calculate deductions
        const incomeTax = calculateProgressiveTax(grossSalary)
        const socialSecurity = calculateSocialSecurity(grossSalary)

        let totalDeductions = incomeTax + socialSecurity
        for (const deduction of salary.deductions) {
          if (deduction.isPercentage) {
            totalDeductions += grossSalary * (Number(deduction.amount) / 100)
          } else {
            totalDeductions += Number(deduction.amount)
          }
        }

        const netSalary = grossSalary - totalDeductions

        await tx.payrollItem.create({
          data: {
            slipNumber: generateSlipNumber(runNumber, i),
            payrollRunId: run.id,
            employeeId: emp.id,
            basicSalary,
            totalAllowances,
            grossSalary,
            incomeTax,
            socialSecurity,
            totalDeductions,
            netSalary,
            workingDays: STANDARD_WORKING_DAYS,
            status: "PENDING",
          },
        })

        totalGross += grossSalary
        totalNet += netSalary
      }

      // Update run totals
      await tx.payrollRun.update({
        where: { id: run.id },
        data: { totalGross, totalNet },
      })

      return run
    })

    revalidatePath("/finance/payroll")

    return { success: true, data: { id: result.id } }
  } catch (error) {
    console.error("Error creating payroll run:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Validation error" }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create payroll run",
    }
  }
}

// ============================================
// APPROVAL WORKFLOW
// ============================================

export async function approvePayroll(
  payrollRunId: string
): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const run = await db.payrollRun.findUnique({
      where: { id: payrollRunId },
    })

    if (!run) {
      return { success: false, error: "Payroll run not found" }
    }

    if (run.status !== "DRAFT" && run.status !== "PENDING_APPROVAL") {
      return { success: false, error: `Cannot approve payroll in ${run.status} status` }
    }

    await db.$transaction(async (tx) => {
      await tx.payrollRun.update({
        where: { id: payrollRunId },
        data: {
          status: "APPROVED",
          approvedAt: new Date(),
        },
      })

      await tx.payrollItem.updateMany({
        where: { payrollRunId },
        data: { status: "APPROVED" },
      })
    })

    revalidatePath("/finance/payroll")

    return { success: true }
  } catch (error) {
    console.error("Error approving payroll:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to approve payroll",
    }
  }
}

export async function cancelPayroll(
  payrollRunId: string,
  reason?: string
): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const run = await db.payrollRun.findUnique({
      where: { id: payrollRunId },
    })

    if (!run) {
      return { success: false, error: "Payroll run not found" }
    }

    if (run.status === "COMPLETED") {
      return { success: false, error: "Cannot cancel completed payroll" }
    }

    await db.$transaction(async (tx) => {
      await tx.payrollRun.update({
        where: { id: payrollRunId },
        data: { status: "CANCELLED" },
      })

      await tx.payrollItem.updateMany({
        where: { payrollRunId },
        data: { status: "CANCELLED" },
      })
    })

    revalidatePath("/finance/payroll")

    return { success: true }
  } catch (error) {
    console.error("Error cancelling payroll:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to cancel payroll",
    }
  }
}

// ============================================
// PAYMENT PROCESSING
// ============================================

export async function processPayments(
  payrollRunId: string
): Promise<ActionResult<{ processedCount: number; totalAmount: number }>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const run = await db.payrollRun.findUnique({
      where: { id: payrollRunId },
      include: {
        bankAccount: true,
        items: {
          where: { status: "APPROVED" },
          include: {
            employee: true,
          },
        },
      },
    })

    if (!run) {
      return { success: false, error: "Payroll run not found" }
    }

    if (run.status !== "APPROVED") {
      return { success: false, error: "Payroll must be approved before processing" }
    }

    if (!run.bankAccountId || !run.bankAccount) {
      return { success: false, error: "No bank account assigned to payroll" }
    }

    let processedCount = 0
    let totalAmount = 0

    await db.$transaction(async (tx) => {
      // Update run status to processing
      await tx.payrollRun.update({
        where: { id: payrollRunId },
        data: {
          status: "PROCESSING",
          processedById: session.user!.id,
        },
      })

      let currentBalance = Number(run.bankAccount!.currentBalance)

      for (const item of run.items) {
        const netSalary = Number(item.netSalary)

        // Create bank transaction
        const transaction = await tx.bankTransaction.create({
          data: {
            transactionRef: `PAY-${item.slipNumber}`,
            type: "DEBIT",
            amount: netSalary,
            balanceAfter: currentBalance - netSalary,
            description: `Salary payment - ${item.employee.givenName} ${item.employee.surname}`,
            reference: item.slipNumber,
            transactionDate: new Date(),
            sourceType: "PAYROLL",
            sourceId: item.id,
            bankAccountId: run.bankAccountId!,
          },
        })

        currentBalance -= netSalary

        // Update payroll item
        await tx.payrollItem.update({
          where: { id: item.id },
          data: {
            status: "PAID",
            transactionId: transaction.id,
            paidAt: new Date(),
          },
        })

        processedCount++
        totalAmount += netSalary
      }

      // Update bank account balance
      await tx.bankAccount.update({
        where: { id: run.bankAccountId! },
        data: { currentBalance },
      })

      // Mark run as completed
      await tx.payrollRun.update({
        where: { id: payrollRunId },
        data: {
          status: "COMPLETED",
          processedAt: new Date(),
        },
      })
    })

    revalidatePath("/finance/payroll")
    revalidatePath("/finance/banking")

    return {
      success: true,
      data: { processedCount, totalAmount },
    }
  } catch (error) {
    console.error("Error processing payments:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process payments",
    }
  }
}

// ============================================
// INDIVIDUAL SLIP ACTIONS
// ============================================

export async function getSalarySlip(slipId: string): Promise<ActionResult<unknown>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const slip = await db.payrollItem.findUnique({
      where: { id: slipId },
      include: {
        employee: true,
        payrollRun: true,
        transaction: true,
      },
    })

    if (!slip) {
      return { success: false, error: "Salary slip not found" }
    }

    return {
      success: true,
      data: {
        ...slip,
        basicSalary: Number(slip.basicSalary),
        totalAllowances: Number(slip.totalAllowances),
        grossSalary: Number(slip.grossSalary),
        totalDeductions: Number(slip.totalDeductions),
        netSalary: Number(slip.netSalary),
        incomeTax: Number(slip.incomeTax),
        socialSecurity: Number(slip.socialSecurity),
        overtimeAmount: Number(slip.overtimeAmount),
        overtimeHours: Number(slip.overtimeHours),
      },
    }
  } catch (error) {
    console.error("Error fetching salary slip:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch salary slip",
    }
  }
}

export async function getEmployeeSalarySlips(
  employeeId: string,
  limit: number = 12
): Promise<ActionResult<unknown[]>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const slips = await db.payrollItem.findMany({
      where: { employeeId },
      include: {
        payrollRun: {
          select: {
            runNumber: true,
            periodMonth: true,
            periodYear: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    })

    return {
      success: true,
      data: slips.map((s) => ({
        ...s,
        basicSalary: Number(s.basicSalary),
        totalAllowances: Number(s.totalAllowances),
        grossSalary: Number(s.grossSalary),
        totalDeductions: Number(s.totalDeductions),
        netSalary: Number(s.netSalary),
      })),
    }
  } catch (error) {
    console.error("Error fetching employee slips:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch salary slips",
    }
  }
}

// ============================================
// REPORTING ACTIONS
// ============================================

export async function getPayrollSummary(): Promise<ActionResult<{
  totalRuns: number
  draftRuns: number
  pendingApproval: number
  approvedRuns: number
  completedRuns: number
  totalEmployees: number
  activeEmployees: number
  totalPaidThisYear: number
}>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const currentYear = new Date().getFullYear()

    const [
      totalRuns,
      draftRuns,
      pendingApproval,
      approvedRuns,
      completedRuns,
      totalEmployees,
      activeEmployees,
      yearPayments,
    ] = await Promise.all([
      db.payrollRun.count(),
      db.payrollRun.count({ where: { status: "DRAFT" } }),
      db.payrollRun.count({ where: { status: "PENDING_APPROVAL" } }),
      db.payrollRun.count({ where: { status: "APPROVED" } }),
      db.payrollRun.count({ where: { status: "COMPLETED" } }),
      db.employee.count(),
      db.employee.count({ where: { status: "ACTIVE" } }),
      db.payrollRun.aggregate({
        where: {
          periodYear: currentYear,
          status: "COMPLETED",
        },
        _sum: { totalNet: true },
      }),
    ])

    return {
      success: true,
      data: {
        totalRuns,
        draftRuns,
        pendingApproval,
        approvedRuns,
        completedRuns,
        totalEmployees,
        activeEmployees,
        totalPaidThisYear: Number(yearPayments._sum.totalNet || 0),
      },
    }
  } catch (error) {
    console.error("Error fetching payroll summary:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch summary",
    }
  }
}

export async function deletePayrollRun(runId: string): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const run = await db.payrollRun.findUnique({
      where: { id: runId },
    })

    if (!run) {
      return { success: false, error: "Payroll run not found" }
    }

    if (run.status === "COMPLETED" || run.status === "PROCESSING") {
      return { success: false, error: "Cannot delete processed payroll run" }
    }

    await db.$transaction(async (tx) => {
      await tx.payrollItem.deleteMany({
        where: { payrollRunId: runId },
      })

      await tx.payrollRun.delete({
        where: { id: runId },
      })
    })

    revalidatePath("/finance/payroll")

    return { success: true }
  } catch (error) {
    console.error("Error deleting payroll run:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete payroll run",
    }
  }
}
