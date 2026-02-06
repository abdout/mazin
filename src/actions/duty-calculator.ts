"use server"

import { db } from "@/lib/db"
import { auth } from "@/auth"
import { z } from "zod"

// ============================================
// Types
// ============================================

export interface DutyCalculationInput {
  hsCode: string
  cifValue: number // Cost + Insurance + Freight
  currency: "SDG" | "USD" | "SAR"
}

export interface DutyCalculationResult {
  hsCode: string
  hsDescription: string
  cifValue: number
  currency: string
  customsDuty: number
  vat: number
  exciseDuty: number
  developmentFee: number
  totalDuty: number
  effectiveRate: number // Total duty as percentage of CIF
  breakdown: {
    customsDutyRate: number
    vatRate: number
    exciseRate: number
    developmentFeeRate: number
    vatBase: number // The base on which VAT is calculated
  }
}

// ============================================
// Validation Schemas
// ============================================

const calculateDutySchema = z.object({
  hsCode: z.string().min(1, "HS Code is required"),
  cifValue: z.coerce.number().positive("CIF value must be positive"),
  currency: z.enum(["SDG", "USD", "SAR"]).default("SDG"),
})

// ============================================
// Helper: Convert Prisma Decimal to number
// ============================================

function toNumber(value: unknown): number {
  if (typeof value === "number") return value
  return parseFloat(String(value))
}

// ============================================
// Server Actions
// ============================================

/**
 * Look up an HS code and return its rates
 */
export async function lookupHsCode(code: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  // Normalize the code (remove dots and spaces for flexible matching)
  const normalized = code.replace(/[\s.]/g, "")

  // Try exact match first
  let hsCode = await db.hsCode.findFirst({
    where: {
      code: code,
      isActive: true,
    },
  })

  // If no exact match, try partial match (code starts with input)
  if (!hsCode) {
    hsCode = await db.hsCode.findFirst({
      where: {
        code: { startsWith: normalized.substring(0, 4) },
        isActive: true,
      },
    })
  }

  if (!hsCode) {
    return null
  }

  return {
    id: hsCode.id,
    code: hsCode.code,
    description: hsCode.description,
    descriptionAr: hsCode.descriptionAr,
    category: hsCode.category,
    rates: {
      customsDutyRate: toNumber(hsCode.customsDutyRate),
      vatRate: toNumber(hsCode.vatRate),
      exciseRate: toNumber(hsCode.exciseRate),
      developmentFee: toNumber(hsCode.developmentFee),
    },
  }
}

/**
 * Search HS codes by code or description (for autocomplete)
 * Returns up to 20 results
 */
export async function searchHsCodes(query: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  if (!query || query.length < 2) {
    return []
  }

  const results = await db.hsCode.findMany({
    where: {
      isActive: true,
      OR: [
        { code: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { descriptionAr: { contains: query, mode: "insensitive" } },
        { category: { contains: query, mode: "insensitive" } },
      ],
    },
    orderBy: { code: "asc" },
    take: 20,
  })

  return results.map((hs) => ({
    id: hs.id,
    code: hs.code,
    description: hs.description,
    descriptionAr: hs.descriptionAr,
    category: hs.category,
    rates: {
      customsDutyRate: toNumber(hs.customsDutyRate),
      vatRate: toNumber(hs.vatRate),
      exciseRate: toNumber(hs.exciseRate),
      developmentFee: toNumber(hs.developmentFee),
    },
  }))
}

/**
 * Calculate all duties for a given HS code and CIF value
 *
 * Formula:
 * - customsDuty = cifValue * customsDutyRate / 100
 * - exciseDuty = cifValue * exciseRate / 100
 * - developmentFee = cifValue * developmentFeeRate / 100
 * - VAT base = cifValue + customsDuty + exciseDuty
 * - vat = vatBase * vatRate / 100
 * - totalDuty = customsDuty + exciseDuty + developmentFee + vat
 * - effectiveRate = (totalDuty / cifValue) * 100
 */
export async function calculateDuty(
  input: z.input<typeof calculateDutySchema>
): Promise<DutyCalculationResult> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const validated = calculateDutySchema.parse(input)

  // Look up the HS code
  const hsCode = await db.hsCode.findFirst({
    where: {
      code: validated.hsCode,
      isActive: true,
    },
  })

  if (!hsCode) {
    throw new Error(`HS Code "${validated.hsCode}" not found`)
  }

  const cifValue = validated.cifValue
  const customsDutyRate = toNumber(hsCode.customsDutyRate)
  const vatRate = toNumber(hsCode.vatRate)
  const exciseRate = toNumber(hsCode.exciseRate)
  const developmentFeeRate = toNumber(hsCode.developmentFee)

  // Calculate individual duties
  const customsDuty = cifValue * customsDutyRate / 100
  const exciseDuty = cifValue * exciseRate / 100
  const developmentFee = cifValue * developmentFeeRate / 100

  // VAT is calculated on (cifValue + customsDuty + exciseDuty)
  const vatBase = cifValue + customsDuty + exciseDuty
  const vat = vatBase * vatRate / 100

  // Total
  const totalDuty = customsDuty + exciseDuty + developmentFee + vat
  const effectiveRate = cifValue > 0 ? (totalDuty / cifValue) * 100 : 0

  // Round all monetary values to 2 decimal places
  return {
    hsCode: hsCode.code,
    hsDescription: hsCode.description,
    cifValue: Math.round(cifValue * 100) / 100,
    currency: validated.currency,
    customsDuty: Math.round(customsDuty * 100) / 100,
    vat: Math.round(vat * 100) / 100,
    exciseDuty: Math.round(exciseDuty * 100) / 100,
    developmentFee: Math.round(developmentFee * 100) / 100,
    totalDuty: Math.round(totalDuty * 100) / 100,
    effectiveRate: Math.round(effectiveRate * 100) / 100,
    breakdown: {
      customsDutyRate,
      vatRate,
      exciseRate,
      developmentFeeRate,
      vatBase: Math.round(vatBase * 100) / 100,
    },
  }
}

// ============================================
// Seed Data: Common Sudan HS Codes
// ============================================

export const COMMON_HS_CODES = [
  {
    code: "0207",
    description: "Poultry meat and edible offal",
    descriptionAr: "لحوم الدواجن وأحشائها الصالحة للأكل",
    customsDutyRate: 3,
    vatRate: 17,
    exciseRate: 0,
    developmentFee: 0,
    category: "Food",
  },
  {
    code: "1001",
    description: "Wheat and meslin",
    descriptionAr: "القمح والمزيج",
    customsDutyRate: 0,
    vatRate: 0,
    exciseRate: 0,
    developmentFee: 0,
    category: "Food",
  },
  {
    code: "1006",
    description: "Rice",
    descriptionAr: "الأرز",
    customsDutyRate: 3,
    vatRate: 17,
    exciseRate: 0,
    developmentFee: 0,
    category: "Food",
  },
  {
    code: "1701",
    description: "Cane or beet sugar",
    descriptionAr: "سكر القصب أو البنجر",
    customsDutyRate: 3,
    vatRate: 17,
    exciseRate: 0,
    developmentFee: 0,
    category: "Food",
  },
  {
    code: "2523",
    description: "Portland cement, aluminous cement",
    descriptionAr: "الأسمنت البورتلاندي والأسمنت الألوميني",
    customsDutyRate: 10,
    vatRate: 17,
    exciseRate: 0,
    developmentFee: 0,
    category: "Construction",
  },
  {
    code: "2710",
    description: "Petroleum oils and oils from bituminous minerals",
    descriptionAr: "زيوت البترول والزيوت المعدنية القارية",
    customsDutyRate: 0,
    vatRate: 0,
    exciseRate: 0,
    developmentFee: 0,
    category: "Petroleum",
  },
  {
    code: "3004",
    description: "Medicaments in measured doses",
    descriptionAr: "الأدوية بجرعات محددة",
    customsDutyRate: 0,
    vatRate: 0,
    exciseRate: 0,
    developmentFee: 0,
    category: "Pharmaceuticals",
  },
  {
    code: "4011",
    description: "New pneumatic tires, of rubber",
    descriptionAr: "إطارات هوائية جديدة من المطاط",
    customsDutyRate: 25,
    vatRate: 17,
    exciseRate: 0,
    developmentFee: 0,
    category: "Vehicles",
  },
  {
    code: "7210",
    description: "Flat-rolled products of iron or non-alloy steel, clad, plated or coated",
    descriptionAr: "منتجات مسطحة من الحديد أو الصلب غير المخلوط، مكسوة أو مطلية",
    customsDutyRate: 10,
    vatRate: 17,
    exciseRate: 0,
    developmentFee: 0,
    category: "Steel",
  },
  {
    code: "7213",
    description: "Bars and rods of iron or non-alloy steel, hot-rolled",
    descriptionAr: "قضبان وعيدان من الحديد أو الصلب غير المخلوط، مدلفنة على الساخن",
    customsDutyRate: 10,
    vatRate: 17,
    exciseRate: 0,
    developmentFee: 0,
    category: "Steel",
  },
  {
    code: "8471",
    description: "Automatic data processing machines (computers)",
    descriptionAr: "آلات المعالجة الآلية للبيانات (الحواسيب)",
    customsDutyRate: 0,
    vatRate: 17,
    exciseRate: 0,
    developmentFee: 0,
    category: "Electronics",
  },
  {
    code: "8517",
    description: "Telephone sets, including smartphones",
    descriptionAr: "أجهزة الهاتف بما في ذلك الهواتف الذكية",
    customsDutyRate: 10,
    vatRate: 17,
    exciseRate: 0,
    developmentFee: 0,
    category: "Electronics",
  },
  {
    code: "8528",
    description: "Monitors and projectors; television receivers",
    descriptionAr: "الشاشات وأجهزة العرض؛ أجهزة استقبال التلفزيون",
    customsDutyRate: 25,
    vatRate: 17,
    exciseRate: 0,
    developmentFee: 0,
    category: "Electronics",
  },
  {
    code: "8703",
    description: "Motor cars and vehicles for transport of persons",
    descriptionAr: "سيارات ومركبات لنقل الأشخاص",
    customsDutyRate: 40,
    vatRate: 17,
    exciseRate: 15,
    developmentFee: 0,
    category: "Vehicles",
  },
  {
    code: "8704",
    description: "Motor vehicles for transport of goods (trucks)",
    descriptionAr: "مركبات آلية لنقل البضائع (شاحنات)",
    customsDutyRate: 15,
    vatRate: 17,
    exciseRate: 0,
    developmentFee: 0,
    category: "Vehicles",
  },
  {
    code: "8711",
    description: "Motorcycles and cycles with auxiliary motor",
    descriptionAr: "الدراجات النارية والدراجات ذات المحرك المساعد",
    customsDutyRate: 25,
    vatRate: 17,
    exciseRate: 10,
    developmentFee: 0,
    category: "Vehicles",
  },
  {
    code: "6109",
    description: "T-shirts, singlets and other vests, knitted",
    descriptionAr: "قمصان وفانلات وسترات أخرى، محبوكة",
    customsDutyRate: 25,
    vatRate: 17,
    exciseRate: 0,
    developmentFee: 0,
    category: "Textiles",
  },
  {
    code: "6403",
    description: "Footwear with outer soles of rubber, plastics or leather",
    descriptionAr: "أحذية ذات نعل خارجي من المطاط أو البلاستيك أو الجلد",
    customsDutyRate: 25,
    vatRate: 17,
    exciseRate: 0,
    developmentFee: 0,
    category: "Textiles",
  },
  {
    code: "9401",
    description: "Seats and furniture (excluding medical or dental)",
    descriptionAr: "مقاعد وأثاث (باستثناء الطبي أو السني)",
    customsDutyRate: 25,
    vatRate: 17,
    exciseRate: 0,
    developmentFee: 0,
    category: "Furniture",
  },
  {
    code: "8415",
    description: "Air conditioning machines",
    descriptionAr: "أجهزة تكييف الهواء",
    customsDutyRate: 25,
    vatRate: 17,
    exciseRate: 0,
    developmentFee: 0,
    category: "Electronics",
  },
] as const
