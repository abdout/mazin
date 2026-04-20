"use server"

import { db } from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const createExchangeRateSchema = z.object({
  fromCurrency: z.string().min(3).max(3).default("USD"),
  toCurrency: z.string().min(3).max(3).default("SDG"),
  rate: z.coerce.number().positive(),
  source: z.string().optional(),
  effectiveDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : new Date())),
})

function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0
  if (typeof value === "number") return value
  return parseFloat(String(value))
}

export async function createExchangeRate(
  data: z.input<typeof createExchangeRateSchema>
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const validated = createExchangeRateSchema.parse(data)

  // Deactivate previous rates for this currency pair
  await db.exchangeRate.updateMany({
    where: {
      fromCurrency: validated.fromCurrency,
      toCurrency: validated.toCurrency,
      isActive: true,
    },
    data: { isActive: false },
  })

  const rate = await db.exchangeRate.create({
    data: {
      fromCurrency: validated.fromCurrency,
      toCurrency: validated.toCurrency,
      rate: validated.rate,
      source: validated.source,
      effectiveDate: validated.effectiveDate,
      isActive: true,
      userId: session.user.id,
    },
  })

  revalidatePath("/settings")
  revalidatePath("/finance")
  return rate
}

export async function getActiveExchangeRate(
  fromCurrency: string = "USD",
  toCurrency: string = "SDG"
) {
  const rate = await db.exchangeRate.findFirst({
    where: {
      fromCurrency,
      toCurrency,
      isActive: true,
    },
    orderBy: { effectiveDate: "desc" },
  })

  return rate ? { ...rate, rate: toNumber(rate.rate) } : null
}

export async function getExchangeRateHistory(
  fromCurrency: string = "USD",
  toCurrency: string = "SDG",
  limit: number = 30
) {
  const rates = await db.exchangeRate.findMany({
    where: { fromCurrency, toCurrency },
    orderBy: { effectiveDate: "desc" },
    take: limit,
    include: {
      user: { select: { name: true } },
    },
  })

  return rates.map((r) => ({ ...r, rate: toNumber(r.rate) }))
}

export async function convertCurrency(
  amount: number,
  fromCurrency: string = "USD",
  toCurrency: string = "SDG"
): Promise<{ converted: number; rate: number; effectiveDate: Date } | null> {
  const activeRate = await getActiveExchangeRate(fromCurrency, toCurrency)
  if (!activeRate) return null

  return {
    converted: Math.round(amount * activeRate.rate * 100) / 100,
    rate: activeRate.rate,
    effectiveDate: activeRate.effectiveDate,
  }
}
