"use server"

/**
 * Payroll Module - Server Actions
 * Full Prisma implementation for payroll processing
 */

import { revalidatePath } from "next/cache"

import { auth } from "@/auth"
import { db } from "@/lib/db"

type ActionResult<T = void> = {
  success: boolean
  data?: T
  error?: string
}

// ============================================================================
// TYPES
// ============================================================================

export interface PayrollRun {
  id: string
  payrollCode: string
  name: string
  period: string
  status: string
  periodStart: Date
  periodEnd: Date
  payDate: Date | null
  totalGross: number
  totalDeductions: number
  totalNet: number
  processedAt: Date | null
  processedBy: string | null
  approvedAt: Date | null
  approvedBy: string | null
  paidAt: Date | null
  notes: string | null
  employeeCount: number
  createdAt: Date
}

export interface PayrollItem {
  id: string
  employeeId: string
  employeeName: string
  employeeCode: string
  basicSalary: number
  housingAllowance: number
  transportAllowance: number
  mealAllowance: number
  otherAllowances: number
  overtimeHours: number
  overtimeAmount: number
  socialSecurity: number
  incomeTax: number
  otherDeductions: number
  loanDeduction: number
  grossAmount: number
  totalDeductions: number
  netAmount: number
  status: string
  paidAt: Date | null
  notes: string | null
}

export interface Employee {
  id: string
  employeeCode: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  department: string | null
  position: string | null
  status: string
  hireDate: Date
  employmentType: string
  bankName: string | null
  accountNumber: string | null
  salary: {
    basicSalary: number
    grossSalary: number
    netSalary: number
  } | null
}

export interface PayrollSummary {
  totalRuns: number
  completedRuns: number
  pendingRuns: number
  totalEmployees: number
  monthlyPayroll: number
  yearToDatePayroll: number
  averageNetSalary: number
}

// ============================================================================
// PAYROLL RUN QUERIES
// ============================================================================

export async function getPayrollRuns(
  status?: string
): Promise<ActionResult<PayrollRun[]>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const where: any = { userId: session.user.id }
    if (status) {
      where.status = status
    }

    const payrolls = await db.payroll.findMany({
      where,
      orderBy: { periodStart: "desc" },
      include: {
        _count: {
          select: { items: true },
        },
      },
    })

    return {
      success: true,
      data: payrolls.map((p) => ({
        id: p.id,
        payrollCode: p.payrollCode,
        name: p.name,
        period: p.period,
        status: p.status,
        periodStart: p.periodStart,
        periodEnd: p.periodEnd,
        payDate: p.payDate,
        totalGross: Number(p.totalGross),
        totalDeductions: Number(p.totalDeductions),
        totalNet: Number(p.totalNet),
        processedAt: p.processedAt,
        processedBy: p.processedBy,
        approvedAt: p.approvedAt,
        approvedBy: p.approvedBy,
        paidAt: p.paidAt,
        notes: p.notes,
        employeeCount: p._count.items,
        createdAt: p.createdAt,
      })),
    }
  } catch (error) {
    console.error("Error fetching payroll runs:", error)
    return { success: false, error: "Failed to fetch payroll runs" }
  }
}

export async function getPayrollRun(
  runId: string
): Promise<ActionResult<PayrollRun & { items: PayrollItem[] }>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const payroll = await db.payroll.findFirst({
      where: { id: runId, userId: session.user.id },
      include: {
        items: {
          include: {
            employee: {
              select: {
                id: true,
                employeeCode: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: { items: true },
        },
      },
    })

    if (!payroll) {
      return { success: false, error: "Payroll run not found" }
    }

    return {
      success: true,
      data: {
        id: payroll.id,
        payrollCode: payroll.payrollCode,
        name: payroll.name,
        period: payroll.period,
        status: payroll.status,
        periodStart: payroll.periodStart,
        periodEnd: payroll.periodEnd,
        payDate: payroll.payDate,
        totalGross: Number(payroll.totalGross),
        totalDeductions: Number(payroll.totalDeductions),
        totalNet: Number(payroll.totalNet),
        processedAt: payroll.processedAt,
        processedBy: payroll.processedBy,
        approvedAt: payroll.approvedAt,
        approvedBy: payroll.approvedBy,
        paidAt: payroll.paidAt,
        notes: payroll.notes,
        employeeCount: payroll._count.items,
        createdAt: payroll.createdAt,
        items: payroll.items.map((item) => ({
          id: item.id,
          employeeId: item.employeeId,
          employeeName: `${item.employee.firstName} ${item.employee.lastName}`,
          employeeCode: item.employee.employeeCode,
          basicSalary: Number(item.basicSalary),
          housingAllowance: Number(item.housingAllowance),
          transportAllowance: Number(item.transportAllowance),
          mealAllowance: Number(item.mealAllowance),
          otherAllowances: Number(item.otherAllowances),
          overtimeHours: Number(item.overtimeHours),
          overtimeAmount: Number(item.overtimeAmount),
          socialSecurity: Number(item.socialSecurity),
          incomeTax: Number(item.incomeTax),
          otherDeductions: Number(item.otherDeductions),
          loanDeduction: Number(item.loanDeduction),
          grossAmount: Number(item.grossAmount),
          totalDeductions: Number(item.totalDeductions),
          netAmount: Number(item.netAmount),
          status: item.status,
          paidAt: item.paidAt,
          notes: item.notes,
        })),
      },
    }
  } catch (error) {
    console.error("Error fetching payroll run:", error)
    return { success: false, error: "Failed to fetch payroll run" }
  }
}

// ============================================================================
// PAYROLL RUN CRUD
// ============================================================================

export async function createPayrollRun(params: {
  name: string
  period: string
  periodStart: Date
  periodEnd: Date
  payDate?: Date
  employeeIds?: string[]
  notes?: string
}): Promise<ActionResult<string>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    // Generate payroll code
    const count = await db.payroll.count({ where: { userId: session.user.id } })
    const payrollCode = `PR-${params.period}-${String(count + 1).padStart(3, "0")}`

    // Get employees (either specified or all active)
    const employeeWhere: any = { userId: session.user.id, status: "ACTIVE" }
    if (params.employeeIds && params.employeeIds.length > 0) {
      employeeWhere.id = { in: params.employeeIds }
    }

    const employees = await db.employee.findMany({
      where: employeeWhere,
      include: {
        salary: true,
      },
    })

    if (employees.length === 0) {
      return { success: false, error: "No active employees found" }
    }

    // Calculate payroll items
    let totalGross = 0
    let totalDeductions = 0
    let totalNet = 0

    const itemsData = employees.map((emp) => {
      const salary = emp.salary
      if (!salary) {
        // Use defaults if no salary record
        const basicSalary = 0
        return {
          employeeId: emp.id,
          basicSalary,
          housingAllowance: 0,
          transportAllowance: 0,
          mealAllowance: 0,
          otherAllowances: 0,
          overtimeHours: 0,
          overtimeAmount: 0,
          socialSecurity: 0,
          incomeTax: 0,
          otherDeductions: 0,
          loanDeduction: 0,
          grossAmount: basicSalary,
          totalDeductions: 0,
          netAmount: basicSalary,
          status: "PENDING",
        }
      }

      const basicSalary = Number(salary.basicSalary)
      const housingAllowance = Number(salary.housingAllowance)
      const transportAllowance = Number(salary.transportAllowance)
      const mealAllowance = Number(salary.mealAllowance)
      const otherAllowances = Number(salary.otherAllowances)

      const grossAmount = basicSalary + housingAllowance + transportAllowance + mealAllowance + otherAllowances

      // Calculate deductions
      const socialSecurityRate = Number(salary.socialSecurityRate) / 100
      const taxRate = Number(salary.taxRate) / 100
      const socialSecurity = grossAmount * socialSecurityRate
      const incomeTax = grossAmount * taxRate
      const otherDeductions = Number(salary.otherDeductions)
      const deductions = socialSecurity + incomeTax + otherDeductions

      const netAmount = grossAmount - deductions

      totalGross += grossAmount
      totalDeductions += deductions
      totalNet += netAmount

      return {
        employeeId: emp.id,
        basicSalary,
        housingAllowance,
        transportAllowance,
        mealAllowance,
        otherAllowances,
        overtimeHours: 0,
        overtimeAmount: 0,
        socialSecurity,
        incomeTax,
        otherDeductions,
        loanDeduction: 0,
        grossAmount,
        totalDeductions: deductions,
        netAmount,
        status: "PENDING",
      }
    })

    // Create payroll with items
    const payroll = await db.payroll.create({
      data: {
        payrollCode,
        name: params.name,
        period: params.period,
        status: "DRAFT",
        periodStart: params.periodStart,
        periodEnd: params.periodEnd,
        payDate: params.payDate,
        totalGross,
        totalDeductions,
        totalNet,
        notes: params.notes,
        userId: session.user.id,
        items: {
          create: itemsData,
        },
      },
    })

    revalidatePath("/finance/payroll")

    return { success: true, data: payroll.id }
  } catch (error) {
    console.error("Error creating payroll run:", error)
    return { success: false, error: "Failed to create payroll run" }
  }
}

export async function deletePayrollRun(runId: string): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const payroll = await db.payroll.findFirst({
      where: { id: runId, userId: session.user.id },
    })

    if (!payroll) {
      return { success: false, error: "Payroll run not found" }
    }

    if (payroll.status === "PAID") {
      return { success: false, error: "Cannot delete a paid payroll run" }
    }

    // Delete payroll (items cascade delete)
    await db.payroll.delete({ where: { id: runId } })

    revalidatePath("/finance/payroll")

    return { success: true }
  } catch (error) {
    console.error("Error deleting payroll run:", error)
    return { success: false, error: "Failed to delete payroll run" }
  }
}

// ============================================================================
// SALARY SLIP GENERATION
// ============================================================================

export async function generateSalarySlips(
  payrollRunId: string,
  employeeIds?: string[]
): Promise<ActionResult<number>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const payroll = await db.payroll.findFirst({
      where: { id: payrollRunId, userId: session.user.id },
      include: { items: true },
    })

    if (!payroll) {
      return { success: false, error: "Payroll run not found" }
    }

    // Filter items by employee IDs if provided
    let itemsToProcess = payroll.items
    if (employeeIds && employeeIds.length > 0) {
      itemsToProcess = payroll.items.filter((item) =>
        employeeIds.includes(item.employeeId)
      )
    }

    // Mark items as processing (salary slips generated)
    await db.payrollItem.updateMany({
      where: {
        id: { in: itemsToProcess.map((i) => i.id) },
      },
      data: {
        status: "PENDING",
      },
    })

    // Update payroll status
    await db.payroll.update({
      where: { id: payrollRunId },
      data: { status: "PROCESSING" },
    })

    revalidatePath("/finance/payroll")

    return { success: true, data: itemsToProcess.length }
  } catch (error) {
    console.error("Error generating salary slips:", error)
    return { success: false, error: "Failed to generate salary slips" }
  }
}

// ============================================================================
// APPROVAL WORKFLOW
// ============================================================================

export async function approvePayroll(
  payrollRunId: string,
  notes?: string
): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const payroll = await db.payroll.findFirst({
      where: { id: payrollRunId, userId: session.user.id },
    })

    if (!payroll) {
      return { success: false, error: "Payroll run not found" }
    }

    if (payroll.status !== "PROCESSING" && payroll.status !== "PENDING_APPROVAL") {
      return { success: false, error: "Payroll is not in a state that can be approved" }
    }

    await db.$transaction([
      // Update payroll status
      db.payroll.update({
        where: { id: payrollRunId },
        data: {
          status: "APPROVED",
          approvedAt: new Date(),
          approvedBy: session.user.id,
          notes: notes ? `${payroll.notes || ""}\nApproval notes: ${notes}` : payroll.notes,
        },
      }),
      // Update all items to approved
      db.payrollItem.updateMany({
        where: { payrollId: payrollRunId },
        data: { status: "APPROVED" },
      }),
    ])

    revalidatePath("/finance/payroll")

    return { success: true }
  } catch (error) {
    console.error("Error approving payroll:", error)
    return { success: false, error: "Failed to approve payroll" }
  }
}

export async function rejectPayroll(
  payrollRunId: string,
  reason: string
): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const payroll = await db.payroll.findFirst({
      where: { id: payrollRunId, userId: session.user.id },
    })

    if (!payroll) {
      return { success: false, error: "Payroll run not found" }
    }

    await db.payroll.update({
      where: { id: payrollRunId },
      data: {
        status: "CANCELLED",
        notes: `${payroll.notes || ""}\nRejection reason: ${reason}`,
      },
    })

    revalidatePath("/finance/payroll")

    return { success: true }
  } catch (error) {
    console.error("Error rejecting payroll:", error)
    return { success: false, error: "Failed to reject payroll" }
  }
}

// ============================================================================
// PAYMENT PROCESSING
// ============================================================================

export async function processPayments(
  payrollRunId: string,
  bankAccountId?: string
): Promise<ActionResult<number>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const payroll = await db.payroll.findFirst({
      where: { id: payrollRunId, userId: session.user.id },
      include: {
        items: {
          where: { status: "APPROVED" },
          include: {
            employee: true,
          },
        },
      },
    })

    if (!payroll) {
      return { success: false, error: "Payroll run not found" }
    }

    if (payroll.status !== "APPROVED") {
      return { success: false, error: "Payroll must be approved before processing payments" }
    }

    const now = new Date()
    let processedCount = 0

    // Process each item
    await db.$transaction(async (tx) => {
      for (const item of payroll.items) {
        // Mark item as paid
        await tx.payrollItem.update({
          where: { id: item.id },
          data: {
            status: "PAID",
            paidAt: now,
          },
        })

        // Create transaction if bank account provided
        if (bankAccountId) {
          const bankAccount = await tx.bankAccount.findFirst({
            where: { id: bankAccountId, userId: session.user.id },
          })

          if (bankAccount) {
            const newBalance = Number(bankAccount.currentBalance) - Number(item.netAmount)

            await tx.transaction.create({
              data: {
                transactionDate: now,
                description: `Salary payment: ${item.employee.firstName} ${item.employee.lastName} - ${payroll.period}`,
                reference: payroll.payrollCode,
                type: "DEBIT",
                category: "SALARY",
                amount: item.netAmount,
                currency: "SDG",
                balanceAfter: newBalance,
                status: "COMPLETED",
                payrollId: payroll.id,
                userId: session.user.id,
                bankAccountId,
              },
            })

            await tx.bankAccount.update({
              where: { id: bankAccountId },
              data: {
                currentBalance: newBalance,
                availableBalance: newBalance,
              },
            })
          }
        }

        processedCount++
      }

      // Update payroll as paid
      await tx.payroll.update({
        where: { id: payrollRunId },
        data: {
          status: "PAID",
          paidAt: now,
          payDate: now,
        },
      })
    })

    revalidatePath("/finance/payroll")
    revalidatePath("/finance/banking")
    revalidatePath("/finance/dashboard")

    return { success: true, data: processedCount }
  } catch (error) {
    console.error("Error processing payments:", error)
    return { success: false, error: "Failed to process payments" }
  }
}

// ============================================================================
// INDIVIDUAL SLIP QUERIES
// ============================================================================

export async function getEmployeeSalarySlips(
  employeeId: string,
  limit?: number
): Promise<ActionResult<PayrollItem[]>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const items = await db.payrollItem.findMany({
      where: {
        employeeId,
        payroll: { userId: session.user.id },
      },
      take: limit || 10,
      orderBy: { createdAt: "desc" },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
          },
        },
        payroll: {
          select: { period: true, payrollCode: true },
        },
      },
    })

    return {
      success: true,
      data: items.map((item) => ({
        id: item.id,
        employeeId: item.employeeId,
        employeeName: `${item.employee.firstName} ${item.employee.lastName}`,
        employeeCode: item.employee.employeeCode,
        basicSalary: Number(item.basicSalary),
        housingAllowance: Number(item.housingAllowance),
        transportAllowance: Number(item.transportAllowance),
        mealAllowance: Number(item.mealAllowance),
        otherAllowances: Number(item.otherAllowances),
        overtimeHours: Number(item.overtimeHours),
        overtimeAmount: Number(item.overtimeAmount),
        socialSecurity: Number(item.socialSecurity),
        incomeTax: Number(item.incomeTax),
        otherDeductions: Number(item.otherDeductions),
        loanDeduction: Number(item.loanDeduction),
        grossAmount: Number(item.grossAmount),
        totalDeductions: Number(item.totalDeductions),
        netAmount: Number(item.netAmount),
        status: item.status,
        paidAt: item.paidAt,
        notes: item.notes,
      })),
    }
  } catch (error) {
    console.error("Error fetching employee salary slips:", error)
    return { success: false, error: "Failed to fetch salary slips" }
  }
}

export async function getSalarySlip(
  slipId: string
): Promise<ActionResult<PayrollItem>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const item = await db.payrollItem.findFirst({
      where: {
        id: slipId,
        payroll: { userId: session.user.id },
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    if (!item) {
      return { success: false, error: "Salary slip not found" }
    }

    return {
      success: true,
      data: {
        id: item.id,
        employeeId: item.employeeId,
        employeeName: `${item.employee.firstName} ${item.employee.lastName}`,
        employeeCode: item.employee.employeeCode,
        basicSalary: Number(item.basicSalary),
        housingAllowance: Number(item.housingAllowance),
        transportAllowance: Number(item.transportAllowance),
        mealAllowance: Number(item.mealAllowance),
        otherAllowances: Number(item.otherAllowances),
        overtimeHours: Number(item.overtimeHours),
        overtimeAmount: Number(item.overtimeAmount),
        socialSecurity: Number(item.socialSecurity),
        incomeTax: Number(item.incomeTax),
        otherDeductions: Number(item.otherDeductions),
        loanDeduction: Number(item.loanDeduction),
        grossAmount: Number(item.grossAmount),
        totalDeductions: Number(item.totalDeductions),
        netAmount: Number(item.netAmount),
        status: item.status,
        paidAt: item.paidAt,
        notes: item.notes,
      },
    }
  } catch (error) {
    console.error("Error fetching salary slip:", error)
    return { success: false, error: "Failed to fetch salary slip" }
  }
}

// ============================================================================
// EMPLOYEE MANAGEMENT
// ============================================================================

export async function getEmployees(): Promise<ActionResult<Employee[]>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const employees = await db.employee.findMany({
      where: { userId: session.user.id },
      orderBy: [{ status: "asc" }, { firstName: "asc" }],
      include: {
        salary: {
          select: {
            basicSalary: true,
            grossSalary: true,
            netSalary: true,
          },
        },
      },
    })

    return {
      success: true,
      data: employees.map((emp) => ({
        id: emp.id,
        employeeCode: emp.employeeCode,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        phone: emp.phone,
        department: emp.department,
        position: emp.position,
        status: emp.status,
        hireDate: emp.hireDate,
        employmentType: emp.employmentType,
        bankName: emp.bankName,
        accountNumber: emp.accountNumber,
        salary: emp.salary
          ? {
              basicSalary: Number(emp.salary.basicSalary),
              grossSalary: Number(emp.salary.grossSalary),
              netSalary: Number(emp.salary.netSalary),
            }
          : null,
      })),
    }
  } catch (error) {
    console.error("Error fetching employees:", error)
    return { success: false, error: "Failed to fetch employees" }
  }
}

export async function createEmployee(params: {
  employeeCode: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  department?: string
  position?: string
  hireDate: Date
  employmentType?: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "TEMPORARY"
  bankName?: string
  bankBranch?: string
  accountNumber?: string
  iban?: string
  salary?: {
    basicSalary: number
    housingAllowance?: number
    transportAllowance?: number
    mealAllowance?: number
    otherAllowances?: number
    socialSecurityRate?: number
    taxRate?: number
  }
}): Promise<ActionResult<string>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const employee = await db.employee.create({
      data: {
        employeeCode: params.employeeCode,
        firstName: params.firstName,
        lastName: params.lastName,
        email: params.email,
        phone: params.phone,
        department: params.department,
        position: params.position,
        hireDate: params.hireDate,
        employmentType: params.employmentType || "FULL_TIME",
        bankName: params.bankName,
        bankBranch: params.bankBranch,
        accountNumber: params.accountNumber,
        iban: params.iban,
        userId: session.user.id,
        salary: params.salary
          ? {
              create: {
                basicSalary: params.salary.basicSalary,
                housingAllowance: params.salary.housingAllowance || 0,
                transportAllowance: params.salary.transportAllowance || 0,
                mealAllowance: params.salary.mealAllowance || 0,
                otherAllowances: params.salary.otherAllowances || 0,
                socialSecurityRate: params.salary.socialSecurityRate || 8,
                taxRate: params.salary.taxRate || 0,
                grossSalary:
                  params.salary.basicSalary +
                  (params.salary.housingAllowance || 0) +
                  (params.salary.transportAllowance || 0) +
                  (params.salary.mealAllowance || 0) +
                  (params.salary.otherAllowances || 0),
                totalDeductions:
                  ((params.salary.basicSalary +
                    (params.salary.housingAllowance || 0) +
                    (params.salary.transportAllowance || 0) +
                    (params.salary.mealAllowance || 0) +
                    (params.salary.otherAllowances || 0)) *
                    ((params.salary.socialSecurityRate || 8) +
                      (params.salary.taxRate || 0))) /
                  100,
                netSalary:
                  params.salary.basicSalary +
                  (params.salary.housingAllowance || 0) +
                  (params.salary.transportAllowance || 0) +
                  (params.salary.mealAllowance || 0) +
                  (params.salary.otherAllowances || 0) -
                  ((params.salary.basicSalary +
                    (params.salary.housingAllowance || 0) +
                    (params.salary.transportAllowance || 0) +
                    (params.salary.mealAllowance || 0) +
                    (params.salary.otherAllowances || 0)) *
                    ((params.salary.socialSecurityRate || 8) +
                      (params.salary.taxRate || 0))) /
                    100,
              },
            }
          : undefined,
      },
    })

    revalidatePath("/finance/payroll")

    return { success: true, data: employee.id }
  } catch (error) {
    console.error("Error creating employee:", error)
    return { success: false, error: "Failed to create employee" }
  }
}

export async function updateEmployeeSalary(
  employeeId: string,
  params: {
    basicSalary: number
    housingAllowance?: number
    transportAllowance?: number
    mealAllowance?: number
    otherAllowances?: number
    socialSecurityRate?: number
    taxRate?: number
  }
): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const employee = await db.employee.findFirst({
      where: { id: employeeId, userId: session.user.id },
    })

    if (!employee) {
      return { success: false, error: "Employee not found" }
    }

    const grossSalary =
      params.basicSalary +
      (params.housingAllowance || 0) +
      (params.transportAllowance || 0) +
      (params.mealAllowance || 0) +
      (params.otherAllowances || 0)

    const totalDeductions =
      (grossSalary *
        ((params.socialSecurityRate || 8) + (params.taxRate || 0))) /
      100

    const netSalary = grossSalary - totalDeductions

    await db.salary.upsert({
      where: { employeeId },
      create: {
        employeeId,
        basicSalary: params.basicSalary,
        housingAllowance: params.housingAllowance || 0,
        transportAllowance: params.transportAllowance || 0,
        mealAllowance: params.mealAllowance || 0,
        otherAllowances: params.otherAllowances || 0,
        socialSecurityRate: params.socialSecurityRate || 8,
        taxRate: params.taxRate || 0,
        grossSalary,
        totalDeductions,
        netSalary,
      },
      update: {
        basicSalary: params.basicSalary,
        housingAllowance: params.housingAllowance || 0,
        transportAllowance: params.transportAllowance || 0,
        mealAllowance: params.mealAllowance || 0,
        otherAllowances: params.otherAllowances || 0,
        socialSecurityRate: params.socialSecurityRate || 8,
        taxRate: params.taxRate || 0,
        grossSalary,
        totalDeductions,
        netSalary,
      },
    })

    revalidatePath("/finance/payroll")

    return { success: true }
  } catch (error) {
    console.error("Error updating employee salary:", error)
    return { success: false, error: "Failed to update salary" }
  }
}

// ============================================================================
// REPORTING ACTIONS
// ============================================================================

export async function getPayrollSummary(): Promise<ActionResult<PayrollSummary>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const now = new Date()
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const [
      totalRuns,
      completedRuns,
      pendingRuns,
      totalEmployees,
      monthlyPayroll,
      yearToDatePayroll,
      avgSalary,
    ] = await Promise.all([
      db.payroll.count({ where: { userId: session.user.id } }),
      db.payroll.count({
        where: { userId: session.user.id, status: "PAID" },
      }),
      db.payroll.count({
        where: {
          userId: session.user.id,
          status: { in: ["DRAFT", "PROCESSING", "PENDING_APPROVAL", "APPROVED"] },
        },
      }),
      db.employee.count({
        where: { userId: session.user.id, status: "ACTIVE" },
      }),
      db.payroll.aggregate({
        where: {
          userId: session.user.id,
          status: "PAID",
          periodStart: { gte: startOfMonth },
          periodEnd: { lte: endOfMonth },
        },
        _sum: { totalNet: true },
      }),
      db.payroll.aggregate({
        where: {
          userId: session.user.id,
          status: "PAID",
          periodStart: { gte: startOfYear },
        },
        _sum: { totalNet: true },
      }),
      db.salary.aggregate({
        where: {
          employee: { userId: session.user.id, status: "ACTIVE" },
        },
        _avg: { netSalary: true },
      }),
    ])

    return {
      success: true,
      data: {
        totalRuns,
        completedRuns,
        pendingRuns,
        totalEmployees,
        monthlyPayroll: Number(monthlyPayroll._sum.totalNet || 0),
        yearToDatePayroll: Number(yearToDatePayroll._sum.totalNet || 0),
        averageNetSalary: Number(avgSalary._avg.netSalary || 0),
      },
    }
  } catch (error) {
    console.error("Error fetching payroll summary:", error)
    return {
      success: false,
      error: "Failed to fetch payroll summary",
    }
  }
}

// Legacy function name for compatibility
export async function getTeacherSalarySlips(
  teacherId: string,
  limit?: number
): Promise<ActionResult<PayrollItem[]>> {
  return getEmployeeSalarySlips(teacherId, limit)
}
