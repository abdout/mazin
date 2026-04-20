import { describe, it, expect } from "vitest"
import {
  formatInvoiceNumber,
  VAT_RATE,
  FEE_CATEGORIES,
  QUICK_FEE_PRESETS,
  getStageFees,
  calculateFeesTotal,
} from "@/components/platform/invoice/config"
import type { FeeCategory, TrackingStageType } from "@prisma/client"

// =============================================================================
// formatInvoiceNumber
// =============================================================================

describe("formatInvoiceNumber", () => {
  it("formats as sequence/YY", () => {
    const result = formatInvoiceNumber(1044, new Date("2025-03-15"))
    expect(result).toBe("1044/25")
  })

  it("uses last 2 digits of year", () => {
    expect(formatInvoiceNumber(1, new Date("2030-01-01"))).toBe("1/30")
    expect(formatInvoiceNumber(99, new Date("2026-12-31"))).toBe("99/26")
  })

  it("defaults to current date when no date provided", () => {
    const now = new Date()
    const year = now.getFullYear().toString().slice(-2)
    expect(formatInvoiceNumber(500)).toBe(`500/${year}`)
  })

  it("handles single-digit sequence", () => {
    expect(formatInvoiceNumber(1, new Date("2025-06-01"))).toBe("1/25")
  })

  it("handles large sequence numbers", () => {
    expect(formatInvoiceNumber(99999, new Date("2025-06-01"))).toBe("99999/25")
  })
})

// =============================================================================
// VAT_RATE
// =============================================================================

describe("VAT_RATE", () => {
  it("equals 0.17 (17% Sudan standard)", () => {
    expect(VAT_RATE).toBe(0.17)
  })
})

// =============================================================================
// FEE_CATEGORIES
// =============================================================================

describe("FEE_CATEGORIES", () => {
  const expectedKeys: FeeCategory[] = [
    "DELIVERY_ORDER",
    "CUSTOMS_DECLARATION",
    "CUSTOMS_DUTY_RECEIPT",
    "INITIAL_PORT_INVOICE",
    "EXAMINATION",
    "QUALITY_STANDARDS",
    "CUSTOMS_LABORATORY",
    "MINISTRY_OF_TRADE",
    "CUSTOMS_SUPERVISION",
    "PORT_STORAGE_QUAY",
    "CONTAINER_MOVE",
    "CRANE_HIRE",
    "STEVEDORING",
    "LABOURERS_WAGES",
    "CHECKERS_WAGES",
    "OVERTIME_CHARGES",
    "TRANSPORTATION",
    "FUMIGATION",
    "DEMURRAGE",
    "STAMPS_FEES",
    "HEALTH_FEES",
    "COMMISSION",
    "VAT",
    "OTHER",
  ]

  it("contains all expected fee category keys", () => {
    for (const key of expectedKeys) {
      expect(FEE_CATEGORIES[key]).toBeDefined()
    }
  })

  it("each category has en, ar, defaultPrice, and category fields", () => {
    for (const key of expectedKeys) {
      const config = FEE_CATEGORIES[key]
      expect(typeof config.en).toBe("string")
      expect(config.en.length).toBeGreaterThan(0)
      expect(typeof config.ar).toBe("string")
      expect(config.ar.length).toBeGreaterThan(0)
      expect(typeof config.defaultPrice).toBe("number")
      expect(typeof config.category).toBe("string")
    }
  })

  it("category field is one of the valid types", () => {
    const validCategories = [
      "documentation",
      "inspection",
      "port",
      "labor",
      "transport",
      "fees",
      "tax",
      "other",
    ]
    for (const key of expectedKeys) {
      expect(validCategories).toContain(FEE_CATEGORIES[key].category)
    }
  })

  it("DELIVERY_ORDER has correct defaults", () => {
    const config = FEE_CATEGORIES.DELIVERY_ORDER
    expect(config.en).toBe("Delivery Order")
    expect(config.ar).toBe("اذن تسليم")
    expect(config.defaultPrice).toBe(737489)
    expect(config.category).toBe("documentation")
  })
})

// =============================================================================
// QUICK_FEE_PRESETS
// =============================================================================

describe("QUICK_FEE_PRESETS", () => {
  it("has BASIC_CLEARANCE preset", () => {
    expect(QUICK_FEE_PRESETS.BASIC_CLEARANCE).toBeDefined()
    expect(QUICK_FEE_PRESETS.BASIC_CLEARANCE.length).toBeGreaterThan(0)
  })

  it("has FULL_CLEARANCE preset", () => {
    expect(QUICK_FEE_PRESETS.FULL_CLEARANCE).toBeDefined()
    expect(QUICK_FEE_PRESETS.FULL_CLEARANCE.length).toBeGreaterThan(0)
  })

  it("has PORT_ONLY preset", () => {
    expect(QUICK_FEE_PRESETS.PORT_ONLY).toBeDefined()
    expect(QUICK_FEE_PRESETS.PORT_ONLY.length).toBeGreaterThan(0)
  })

  it("has CUSTOMS_ONLY preset", () => {
    expect(QUICK_FEE_PRESETS.CUSTOMS_ONLY).toBeDefined()
    expect(QUICK_FEE_PRESETS.CUSTOMS_ONLY.length).toBeGreaterThan(0)
  })

  it("all preset entries are valid FEE_CATEGORIES keys", () => {
    const allKeys = Object.keys(FEE_CATEGORIES)
    for (const [presetName, categories] of Object.entries(QUICK_FEE_PRESETS)) {
      for (const cat of categories) {
        expect(allKeys).toContain(cat)
      }
    }
  })

  it("BASIC_CLEARANCE contains expected categories", () => {
    expect(QUICK_FEE_PRESETS.BASIC_CLEARANCE).toContain("CUSTOMS_DECLARATION")
    expect(QUICK_FEE_PRESETS.BASIC_CLEARANCE).toContain("EXAMINATION")
    expect(QUICK_FEE_PRESETS.BASIC_CLEARANCE).toContain("VAT")
    expect(QUICK_FEE_PRESETS.BASIC_CLEARANCE).toContain("COMMISSION")
  })

  it("FULL_CLEARANCE is the largest preset", () => {
    expect(QUICK_FEE_PRESETS.FULL_CLEARANCE.length).toBeGreaterThan(
      QUICK_FEE_PRESETS.BASIC_CLEARANCE.length
    )
    expect(QUICK_FEE_PRESETS.FULL_CLEARANCE.length).toBeGreaterThan(
      QUICK_FEE_PRESETS.PORT_ONLY.length
    )
    expect(QUICK_FEE_PRESETS.FULL_CLEARANCE.length).toBeGreaterThan(
      QUICK_FEE_PRESETS.CUSTOMS_ONLY.length
    )
  })
})

// =============================================================================
// getStageFees
// =============================================================================

describe("getStageFees", () => {
  it("returns empty array for stages with no fees", () => {
    expect(getStageFees("PRE_ARRIVAL_DOCS")).toEqual([])
    expect(getStageFees("VESSEL_ARRIVAL")).toEqual([])
  })

  it("returns CUSTOMS_DECLARATION for the CUSTOMS_DECLARATION stage", () => {
    expect(getStageFees("CUSTOMS_DECLARATION")).toEqual(["CUSTOMS_DECLARATION"])
  })

  it("returns port-related fees for PORT_FEES stage", () => {
    const fees = getStageFees("PORT_FEES")
    expect(fees).toContain("PORT_STORAGE_QUAY")
    expect(fees).toContain("INITIAL_PORT_INVOICE")
    expect(fees).toContain("CONTAINER_MOVE")
    expect(fees).toContain("STEVEDORING")
  })

  it("returns CUSTOMS_DUTY_RECEIPT and VAT for CUSTOMS_PAYMENT stage", () => {
    const fees = getStageFees("CUSTOMS_PAYMENT")
    expect(fees).toContain("CUSTOMS_DUTY_RECEIPT")
    expect(fees).toContain("VAT")
  })

  it("returns array for every tracking stage type", () => {
    const allStages: TrackingStageType[] = [
      "PRE_ARRIVAL_DOCS",
      "VESSEL_ARRIVAL",
      "CUSTOMS_DECLARATION",
      "CUSTOMS_PAYMENT",
      "INSPECTION",
      "PORT_FEES",
      "QUALITY_STANDARDS",
      "RELEASE",
      "LOADING",
      "IN_TRANSIT",
      "DELIVERED",
    ]
    for (const stage of allStages) {
      expect(Array.isArray(getStageFees(stage))).toBe(true)
    }
  })
})

// =============================================================================
// calculateFeesTotal
// =============================================================================

describe("calculateFeesTotal", () => {
  it("calculates subtotal from default prices", () => {
    const fees = [
      { category: "DELIVERY_ORDER" as FeeCategory, quantity: 1 },
      { category: "COMMISSION" as FeeCategory, quantity: 1 },
    ]
    const result = calculateFeesTotal(fees)
    // DELIVERY_ORDER: 737489, COMMISSION: 1200000
    expect(result.subtotal).toBe(737489 + 1200000)
  })

  it("applies VAT at 17%", () => {
    const fees = [
      { category: "COMMISSION" as FeeCategory, quantity: 1 },
    ]
    const result = calculateFeesTotal(fees)
    expect(result.vat).toBeCloseTo(1200000 * 0.17, 2)
    expect(result.total).toBeCloseTo(1200000 * 1.17, 2)
  })

  it("respects quantity multiplier", () => {
    const fees = [
      { category: "STAMPS_FEES" as FeeCategory, quantity: 3 },
    ]
    const result = calculateFeesTotal(fees)
    // STAMPS_FEES default is 50000
    expect(result.subtotal).toBe(50000 * 3)
  })

  it("uses customPrice when provided, overriding defaultPrice", () => {
    const fees = [
      { category: "DELIVERY_ORDER" as FeeCategory, quantity: 1, customPrice: 500000 },
    ]
    const result = calculateFeesTotal(fees)
    expect(result.subtotal).toBe(500000)
  })

  it("returns zeros for empty fees array", () => {
    const result = calculateFeesTotal([])
    expect(result.subtotal).toBe(0)
    expect(result.vat).toBe(0)
    expect(result.total).toBe(0)
  })

  it("total equals subtotal + vat", () => {
    const fees = [
      { category: "TRANSPORTATION" as FeeCategory, quantity: 1 },
      { category: "LABOURERS_WAGES" as FeeCategory, quantity: 2 },
    ]
    const result = calculateFeesTotal(fees)
    expect(result.total).toBeCloseTo(result.subtotal + result.vat, 2)
  })

  it("handles multiple fees with mixed custom and default prices", () => {
    const fees = [
      { category: "DELIVERY_ORDER" as FeeCategory, quantity: 1, customPrice: 800000 },
      { category: "EXAMINATION" as FeeCategory, quantity: 1 },
      { category: "STAMPS_FEES" as FeeCategory, quantity: 2 },
    ]
    const result = calculateFeesTotal(fees)
    // 800000 + 700000 + 50000*2 = 1600000
    const expectedSubtotal = 800000 + 700000 + 100000
    expect(result.subtotal).toBe(expectedSubtotal)
    expect(result.vat).toBeCloseTo(expectedSubtotal * 0.17, 2)
  })
})
