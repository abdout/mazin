"use server"

import { db } from "@/lib/db"
import { requireStaff } from "@/lib/auth-context"
import { requireCan } from "@/lib/authorization"

/**
 * HS code search for the declaration form autocomplete. Matches on the code
 * prefix or against the English/Arabic description.
 */
export async function searchHsCodes(query: string, limit = 20) {
  const ctx = await requireStaff()
  requireCan(ctx, "read", "customs")

  const q = query.trim()
  if (q.length < 2) return []

  return db.hsCode.findMany({
    where: {
      isActive: true,
      OR: [
        { code: { startsWith: q } },
        { description: { contains: q, mode: "insensitive" } },
        { descriptionAr: { contains: q } },
      ],
    },
    take: Math.min(50, Math.max(1, limit)),
    orderBy: { code: "asc" },
    select: {
      code: true,
      description: true,
      descriptionAr: true,
      category: true,
      customsDutyRate: true,
      vatRate: true,
      exciseRate: true,
      developmentFee: true,
    },
  })
}

export async function getHsCode(code: string) {
  const ctx = await requireStaff()
  requireCan(ctx, "read", "customs")

  return db.hsCode.findUnique({ where: { code } })
}

/**
 * Full landed-cost calculation for a CIF value under a given HS code.
 * All rates are percentages applied on the CIF base, except VAT which is
 * applied on CIF + customs duty + excise (standard Sudanese practice).
 */
export async function estimateDuty(hsCode: string, cifValue: number) {
  const ctx = await requireStaff()
  requireCan(ctx, "read", "customs")

  const code = await db.hsCode.findUnique({ where: { code: hsCode, isActive: true } })
  if (!code) throw new Error(`Unknown HS code: ${hsCode}`)

  const customs = (cifValue * Number(code.customsDutyRate)) / 100
  const excise = (cifValue * Number(code.exciseRate)) / 100
  const development = (cifValue * Number(code.developmentFee)) / 100
  const vatBase = cifValue + customs + excise
  const vat = (vatBase * Number(code.vatRate)) / 100

  return {
    cifValue,
    hsCode: code.code,
    rates: {
      customsDuty: Number(code.customsDutyRate),
      vat: Number(code.vatRate),
      excise: Number(code.exciseRate),
      developmentFee: Number(code.developmentFee),
    },
    breakdown: {
      customsDuty: customs,
      excise,
      developmentFee: development,
      vat,
    },
    total: customs + excise + development + vat,
  }
}
