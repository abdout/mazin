// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

import { createFeeTemplateSchema, type CreateFeeTemplateInput } from "./validation"

const log = logger.forModule("fees")

type ActionResult<T = void> = {
  success: boolean
  data?: T
  error?: string
}

function serialize(row: {
  id: string
  code: string
  name: string
  nameAr: string | null
  description: string | null
  feeType: string
  calculationType: string
  amount: unknown
  percentage: unknown
  minAmount: unknown
  maxAmount: unknown
  isGovernmentFee: boolean
  isTaxable: boolean
  taxRate: unknown
  isActive: boolean
  applicableStages: unknown
  createdAt: Date
  updatedAt: Date
}) {
  return {
    ...row,
    amount: row.amount != null ? Number(row.amount) : null,
    percentage: row.percentage != null ? Number(row.percentage) : null,
    minAmount: row.minAmount != null ? Number(row.minAmount) : null,
    maxAmount: row.maxAmount != null ? Number(row.maxAmount) : null,
    taxRate: row.taxRate != null ? Number(row.taxRate) : null,
  }
}

export async function listFeeTemplates(params?: {
  feeType?: string
  isActive?: boolean
}): Promise<ActionResult<ReturnType<typeof serialize>[]>> {
  try {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    const where: Record<string, unknown> = { userId: session.user.id }
    if (params?.feeType) where.feeType = params.feeType
    if (typeof params?.isActive === "boolean") where.isActive = params.isActive

    const rows = await db.feeTemplate.findMany({
      where,
      orderBy: [{ isActive: "desc" }, { feeType: "asc" }, { name: "asc" }],
    })
    return { success: true, data: rows.map(serialize) }
  } catch (err) {
    log.error("Failed to list fee templates", err as Error)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load templates",
    }
  }
}

export async function getFeeTemplate(id: string): Promise<ActionResult<ReturnType<typeof serialize>>> {
  try {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    const row = await db.feeTemplate.findFirst({
      where: { id, userId: session.user.id },
    })
    if (!row) return { success: false, error: "Template not found" }
    return { success: true, data: serialize(row) }
  } catch (err) {
    log.error("Failed to fetch fee template", err as Error)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch template",
    }
  }
}

function prepareWriteData(input: CreateFeeTemplateInput) {
  return {
    code: input.code.trim(),
    name: input.name.trim(),
    nameAr: input.nameAr ? input.nameAr.trim() : null,
    description: input.description ? input.description.trim() : null,
    feeType: input.feeType,
    calculationType: input.calculationType,
    amount: input.amount ?? null,
    percentage:
      input.percentage !== undefined && input.percentage !== null
        ? input.percentage / 100 // schema stores as decimal 0-1
        : null,
    minAmount: input.minAmount ?? null,
    maxAmount: input.maxAmount ?? null,
    isGovernmentFee: input.isGovernmentFee,
    isTaxable: input.isTaxable,
    taxRate: input.taxRate ?? null,
    isActive: input.isActive,
  }
}

export async function createFeeTemplate(
  raw: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    const parsed = createFeeTemplateSchema.safeParse(raw)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid template",
      }
    }

    const row = await db.feeTemplate.create({
      data: {
        ...prepareWriteData(parsed.data),
        userId: session.user.id,
      },
      select: { id: true },
    })

    revalidatePath("/finance/fees")
    return { success: true, data: { id: row.id } }
  } catch (err) {
    log.error("Failed to create fee template", err as Error)
    if (err instanceof z.ZodError) {
      return { success: false, error: err.issues[0]?.message ?? "Invalid template" }
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create template",
    }
  }
}

export async function updateFeeTemplate(
  id: string,
  raw: unknown
): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    const existing = await db.feeTemplate.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true },
    })
    if (!existing) return { success: false, error: "Template not found" }

    const parsed = createFeeTemplateSchema.safeParse(raw)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid template",
      }
    }

    await db.feeTemplate.update({
      where: { id },
      data: prepareWriteData(parsed.data),
    })

    revalidatePath("/finance/fees")
    return { success: true }
  } catch (err) {
    log.error("Failed to update fee template", err as Error)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update template",
    }
  }
}

export async function deleteFeeTemplate(id: string): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    const existing = await db.feeTemplate.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true },
    })
    if (!existing) return { success: false, error: "Template not found" }

    await db.feeTemplate.delete({ where: { id } })

    revalidatePath("/finance/fees")
    return { success: true }
  } catch (err) {
    log.error("Failed to delete fee template", err as Error)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete template",
    }
  }
}

export async function toggleFeeTemplate(
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    const existing = await db.feeTemplate.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true },
    })
    if (!existing) return { success: false, error: "Template not found" }

    await db.feeTemplate.update({ where: { id }, data: { isActive } })
    revalidatePath("/finance/fees")
    return { success: true }
  } catch (err) {
    log.error("Failed to toggle fee template", err as Error)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to toggle template",
    }
  }
}
