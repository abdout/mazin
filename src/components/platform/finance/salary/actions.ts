"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { logAudit } from "@/lib/audit"
import { requireStaff } from "@/lib/auth-context"
import { requireCan } from "@/lib/authorization"

const log = logger.forModule("finance.salary")

type ActionResult<T = void> = {
  success: boolean
  data?: T
  error?: string
}

// ============================================
// SALARY STRUCTURE ACTIONS
// ============================================

export async function getSalaryStructures(employeeId?: string): Promise<ActionResult<unknown[]>> {
  const ctx = await requireStaff()
  requireCan(ctx, "read", "finance")

  const rows = await db.salaryStructure.findMany({
    where: employeeId ? { employeeId } : undefined,
    include: {
      employee: { select: { id: true, fullName: true, employeeNumber: true } },
      allowances: true,
      deductions: true,
    },
    orderBy: { effectiveFrom: "desc" },
  })
  return { success: true, data: rows }
}

export async function getSalaryStructure(structureId: string): Promise<ActionResult<unknown>> {
  const ctx = await requireStaff()
  requireCan(ctx, "read", "finance")

  const row = await db.salaryStructure.findUnique({
    where: { id: structureId },
    include: { employee: true, allowances: true, deductions: true },
  })
  if (!row) return { success: false, error: "Salary structure not found" }
  return { success: true, data: row }
}

export async function createSalaryStructure(data: FormData): Promise<ActionResult<string>> {
  const ctx = await requireStaff()
  requireCan(ctx, "create", "finance")

  const employeeId = String(data.get("employeeId") ?? "").trim()
  const basicSalary = Number(data.get("basicSalary") ?? 0)
  const effectiveFrom = data.get("effectiveFrom")
    ? new Date(String(data.get("effectiveFrom")))
    : new Date()

  if (!employeeId || basicSalary <= 0) {
    return { success: false, error: "employeeId and positive basicSalary are required" }
  }

  const created = await db.salaryStructure.create({
    data: {
      employeeId,
      basicSalary,
      effectiveFrom,
      status: "ACTIVE",
    },
  })

  await logAudit({
    action: "RECORD_CREATE",
    actor: ctx,
    resource: "salary_structure",
    resourceId: created.id,
    metadata: { employeeId, basicSalary },
  })

  revalidatePath("/finance/salary")
  log.info("salary structure created", { id: created.id })
  return { success: true, data: created.id }
}

export async function updateSalaryStructure(
  structureId: string,
  data: FormData
): Promise<ActionResult> {
  const ctx = await requireStaff()
  requireCan(ctx, "update", "finance")

  const basicSalary = data.get("basicSalary") ? Number(data.get("basicSalary")) : undefined
  const effectiveTo = data.get("effectiveTo") ? new Date(String(data.get("effectiveTo"))) : undefined

  await db.salaryStructure.update({
    where: { id: structureId },
    data: {
      ...(basicSalary !== undefined && { basicSalary }),
      ...(effectiveTo !== undefined && { effectiveTo }),
    },
  })

  await logAudit({
    action: "RECORD_UPDATE",
    actor: ctx,
    resource: "salary_structure",
    resourceId: structureId,
  })

  revalidatePath("/finance/salary")
  return { success: true }
}

export async function deactivateSalaryStructure(structureId: string): Promise<ActionResult> {
  const ctx = await requireStaff()
  requireCan(ctx, "update", "finance")

  await db.salaryStructure.update({
    where: { id: structureId },
    data: { status: "INACTIVE", effectiveTo: new Date() },
  })

  await logAudit({
    action: "RECORD_UPDATE",
    actor: ctx,
    resource: "salary_structure",
    resourceId: structureId,
    metadata: { status: "INACTIVE" },
  })

  revalidatePath("/finance/salary")
  return { success: true }
}

// ============================================
// ALLOWANCE / DEDUCTION ACTIONS
// ============================================

export async function addAllowance(data: FormData): Promise<ActionResult<string>> {
  const ctx = await requireStaff()
  requireCan(ctx, "update", "finance")

  const salaryStructureId = String(data.get("salaryStructureId") ?? "")
  const name = String(data.get("name") ?? "")
  const type = String(data.get("type") ?? "OTHER")
  const amount = Number(data.get("amount") ?? 0)
  const isPercentage = data.get("isPercentage") === "true"

  if (!salaryStructureId || !name || amount <= 0) {
    return { success: false, error: "salaryStructureId, name, positive amount required" }
  }

  const row = await db.salaryAllowance.create({
    data: { salaryStructureId, name, type, amount, isPercentage },
  })

  revalidatePath("/finance/salary")
  return { success: true, data: row.id }
}

export async function updateAllowance(allowanceId: string, data: FormData): Promise<ActionResult> {
  const ctx = await requireStaff()
  requireCan(ctx, "update", "finance")

  const amount = data.get("amount") ? Number(data.get("amount")) : undefined
  const name = data.get("name") ? String(data.get("name")) : undefined

  await db.salaryAllowance.update({
    where: { id: allowanceId },
    data: {
      ...(amount !== undefined && { amount }),
      ...(name !== undefined && { name }),
    },
  })

  revalidatePath("/finance/salary")
  return { success: true }
}

export async function deleteAllowance(allowanceId: string): Promise<ActionResult> {
  const ctx = await requireStaff()
  requireCan(ctx, "update", "finance")

  await db.salaryAllowance.delete({ where: { id: allowanceId } })
  revalidatePath("/finance/salary")
  return { success: true }
}

export async function addDeduction(data: FormData): Promise<ActionResult<string>> {
  const ctx = await requireStaff()
  requireCan(ctx, "update", "finance")

  const salaryStructureId = String(data.get("salaryStructureId") ?? "")
  const name = String(data.get("name") ?? "")
  const type = String(data.get("type") ?? "OTHER")
  const amount = Number(data.get("amount") ?? 0)
  const isPercentage = data.get("isPercentage") === "true"

  if (!salaryStructureId || !name || amount <= 0) {
    return { success: false, error: "salaryStructureId, name, positive amount required" }
  }

  const row = await db.salaryDeduction.create({
    data: { salaryStructureId, name, type, amount, isPercentage },
  })

  revalidatePath("/finance/salary")
  return { success: true, data: row.id }
}

export async function updateDeduction(deductionId: string, data: FormData): Promise<ActionResult> {
  const ctx = await requireStaff()
  requireCan(ctx, "update", "finance")

  const amount = data.get("amount") ? Number(data.get("amount")) : undefined
  const name = data.get("name") ? String(data.get("name")) : undefined

  await db.salaryDeduction.update({
    where: { id: deductionId },
    data: {
      ...(amount !== undefined && { amount }),
      ...(name !== undefined && { name }),
    },
  })

  revalidatePath("/finance/salary")
  return { success: true }
}

export async function deleteDeduction(deductionId: string): Promise<ActionResult> {
  const ctx = await requireStaff()
  requireCan(ctx, "update", "finance")

  await db.salaryDeduction.delete({ where: { id: deductionId } })
  revalidatePath("/finance/salary")
  return { success: true }
}

// ============================================
// CALCULATION
// ============================================

/**
 * Resolve gross → net for a salary structure. Percentage allowances/deductions
 * compute against the basic salary; flat amounts apply directly.
 */
export async function calculateSalary(
  structureId: string,
  _period: { start: Date; end: Date }
): Promise<ActionResult<unknown>> {
  const ctx = await requireStaff()
  requireCan(ctx, "read", "finance")

  const structure = await db.salaryStructure.findUnique({
    where: { id: structureId },
    include: { allowances: true, deductions: true },
  })
  if (!structure) return { success: false, error: "Structure not found" }

  const basic = Number(structure.basicSalary)

  const allowanceTotal = structure.allowances.reduce((sum, a) => {
    return sum + (a.isPercentage ? (basic * Number(a.amount)) / 100 : Number(a.amount))
  }, 0)

  const gross = basic + allowanceTotal
  const taxableIncome = gross

  const deductionTotal = structure.deductions.reduce((sum, d) => {
    return sum + (d.isPercentage ? (basic * Number(d.amount)) / 100 : Number(d.amount))
  }, 0)

  return {
    success: true,
    data: {
      baseSalary: basic,
      allowances: structure.allowances,
      totalAllowances: allowanceTotal,
      grossSalary: gross,
      taxableIncome,
      taxAmount: 0, // Sudan individual income tax not modeled here — add when policy finalized.
      deductions: structure.deductions,
      totalDeductions: deductionTotal,
      netSalary: gross - deductionTotal,
    },
  }
}

export async function applySalaryIncrement(
  structureId: string,
  data: FormData
): Promise<ActionResult> {
  const ctx = await requireStaff()
  requireCan(ctx, "update", "finance")

  const incrementPct = Number(data.get("incrementPct") ?? 0)
  if (incrementPct <= 0) return { success: false, error: "incrementPct must be positive" }

  const current = await db.salaryStructure.findUnique({ where: { id: structureId } })
  if (!current) return { success: false, error: "Structure not found" }

  const newBasic = Number(current.basicSalary) * (1 + incrementPct / 100)
  await db.salaryStructure.update({
    where: { id: structureId },
    data: { basicSalary: newBasic },
  })

  await logAudit({
    action: "RECORD_UPDATE",
    actor: ctx,
    resource: "salary_structure",
    resourceId: structureId,
    metadata: { incrementPct, oldBasic: Number(current.basicSalary), newBasic },
  })

  revalidatePath("/finance/salary")
  return { success: true }
}

// ============================================
// REPORTING
// ============================================

export async function getSalarySummary(): Promise<ActionResult<unknown>> {
  const ctx = await requireStaff()
  requireCan(ctx, "read", "finance")

  const [totalStructures, activeStructures, allSalaries] = await Promise.all([
    db.salaryStructure.count(),
    db.salaryStructure.count({ where: { status: "ACTIVE" } }),
    db.salaryStructure.findMany({
      where: { status: "ACTIVE" },
      select: { basicSalary: true },
    }),
  ])

  const totalBasic = allSalaries.reduce((s, r) => s + Number(r.basicSalary), 0)
  const averageSalary = allSalaries.length > 0 ? totalBasic / allSalaries.length : 0

  return {
    success: true,
    data: {
      totalStructures,
      activeStructures,
      totalAllowances: await db.salaryAllowance.count(),
      totalDeductions: await db.salaryDeduction.count(),
      averageSalary,
    },
  }
}
