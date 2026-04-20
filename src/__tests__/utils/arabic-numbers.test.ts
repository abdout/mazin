import { describe, it, expect } from "vitest"
import {
  numberToArabicWords,
  formatArabicNumerals,
  formatCurrency,
} from "@/lib/utils/arabic-numbers"

// =============================================================================
// numberToArabicWords
// =============================================================================

describe("numberToArabicWords", () => {
  it("converts 0 with default currency (SDG)", () => {
    const result = numberToArabicWords(0)
    expect(result).toContain("صفر")
    expect(result).toContain("جنيه سوداني")
    expect(result).toContain("فقط")
    expect(result).toContain("لا غير")
  })

  it("converts single digit (1) to Arabic words", () => {
    const result = numberToArabicWords(1)
    expect(result).toContain("واحد")
    expect(result).toContain("جنيه سوداني")
  })

  it("converts single digit (5) to Arabic words", () => {
    const result = numberToArabicWords(5)
    expect(result).toContain("خمسة")
  })

  it("converts teens (11) to Arabic words", () => {
    const result = numberToArabicWords(11)
    expect(result).toContain("أحد عشر")
  })

  it("converts teens (15) to Arabic words", () => {
    const result = numberToArabicWords(15)
    expect(result).toContain("خمسة عشر")
  })

  it("converts teens (19) to Arabic words", () => {
    const result = numberToArabicWords(19)
    expect(result).toContain("تسعة عشر")
  })

  it("converts tens (20) to Arabic words", () => {
    const result = numberToArabicWords(20)
    expect(result).toContain("عشرون")
  })

  it("converts compound tens (21) to Arabic words", () => {
    const result = numberToArabicWords(21)
    expect(result).toContain("واحد")
    expect(result).toContain("وعشرون")
  })

  it("converts hundreds (100) to Arabic words", () => {
    const result = numberToArabicWords(100)
    expect(result).toContain("مائة")
  })

  it("converts hundreds (200) to Arabic words using dual", () => {
    const result = numberToArabicWords(200)
    expect(result).toContain("مئتان")
  })

  it("converts hundreds (350) to Arabic words", () => {
    const result = numberToArabicWords(350)
    expect(result).toContain("ثلاثمائة")
    expect(result).toContain("خمسون")
  })

  it("converts thousands (1000) with singular form", () => {
    const result = numberToArabicWords(1000)
    expect(result).toContain("ألف")
  })

  it("converts thousands (2000) with dual form", () => {
    const result = numberToArabicWords(2000)
    expect(result).toContain("ألفان")
  })

  it("converts thousands (5000) with plural 3-10 form", () => {
    const result = numberToArabicWords(5000)
    expect(result).toContain("آلاف")
  })

  it("converts thousands (15000) with plural 11+ form", () => {
    const result = numberToArabicWords(15000)
    expect(result).toContain("ألفاً")
  })

  it("converts millions (1000000) with singular form", () => {
    const result = numberToArabicWords(1_000_000)
    expect(result).toContain("مليون")
  })

  it("converts millions (2000000) with dual form", () => {
    const result = numberToArabicWords(2_000_000)
    expect(result).toContain("مليونان")
  })

  it("converts millions (5000000) with plural 3-10 form", () => {
    const result = numberToArabicWords(5_000_000)
    expect(result).toContain("ملايين")
  })

  it("converts the full example: 15,352,201 SDG", () => {
    const result = numberToArabicWords(15_352_201, "SDG")
    expect(result).toContain("خمسة عشر")
    expect(result).toContain("مليوناً")
    expect(result).toContain("ثلاثمائة")
    expect(result).toContain("ألفاً")
    expect(result).toContain("مئتان")
    expect(result).toContain("واحد")
    expect(result).toContain("جنيه سوداني")
    expect(result).toContain("فقط")
    expect(result).toContain("لا غير")
  })

  describe("decimal handling", () => {
    it("includes subunit when decimals exist", () => {
      const result = numberToArabicWords(100.5, "SDG")
      expect(result).toContain("مائة")
      expect(result).toContain("خمسون")
      expect(result).toContain("قرشاً")
    })

    it("does not include subunit for integer amounts", () => {
      const result = numberToArabicWords(100, "SDG")
      expect(result).not.toContain("قرش")
    })

    it("handles .90 decimal", () => {
      const result = numberToArabicWords(1.9, "SDG")
      expect(result).toContain("تسعون")
      expect(result).toContain("قرشاً")
    })

    it("handles .99 decimal", () => {
      const result = numberToArabicWords(0.99, "SDG")
      // integer part is 0 -> صفر
      expect(result).toContain("صفر")
      expect(result).toContain("تسعة")
      expect(result).toContain("وتسعون")
      expect(result).toContain("قرشاً")
    })
  })

  describe("currency variants", () => {
    it("uses SDG currency labels", () => {
      const result = numberToArabicWords(100, "SDG")
      expect(result).toContain("جنيه سوداني")
    })

    it("uses USD currency labels and subunit", () => {
      const result = numberToArabicWords(100.5, "USD")
      expect(result).toContain("دولار أمريكي")
      expect(result).toContain("سنتاً")
    })

    it("uses SAR currency labels and subunit", () => {
      const result = numberToArabicWords(100.25, "SAR")
      expect(result).toContain("ريال سعودي")
      expect(result).toContain("هللةاً")
    })

    it("falls back to SDG for unknown currency", () => {
      const result = numberToArabicWords(10, "EUR")
      expect(result).toContain("جنيه سوداني")
    })
  })

  it("wraps with فقط prefix and لا غير suffix", () => {
    const result = numberToArabicWords(1, "SDG")
    expect(result).toMatch(/^فقط/)
    expect(result).toMatch(/لا غير$/)
  })
})

// =============================================================================
// formatArabicNumerals
// =============================================================================

describe("formatArabicNumerals", () => {
  it("converts all digits 0-9 to Arabic-Indic numerals", () => {
    const result = formatArabicNumerals(1234567890)
    expect(result).toContain("١")
    expect(result).toContain("٢")
    expect(result).toContain("٣")
    expect(result).toContain("٤")
    expect(result).toContain("٥")
    expect(result).toContain("٦")
    expect(result).toContain("٧")
    expect(result).toContain("٨")
    expect(result).toContain("٩")
    expect(result).toContain("٠")
  })

  it("uses Arabic thousands separator (٬)", () => {
    const result = formatArabicNumerals(12345.67)
    expect(result).toContain("٬")
  })

  it("uses Arabic decimal separator (٫)", () => {
    const result = formatArabicNumerals(12345.67)
    expect(result).toContain("٫")
  })

  it("formats zero correctly", () => {
    expect(formatArabicNumerals(0)).toBe("٠٫٠٠")
  })

  it("always shows two decimal places", () => {
    const result = formatArabicNumerals(5)
    // 5.00 -> ٥٫٠٠
    expect(result).toBe("٥٫٠٠")
  })

  it("formats example: 12345.67 -> ١٢٬٣٤٥٫٦٧", () => {
    expect(formatArabicNumerals(12345.67)).toBe("١٢٬٣٤٥٫٦٧")
  })
})

// =============================================================================
// formatCurrency
// =============================================================================

describe("formatCurrency", () => {
  describe("Arabic locale", () => {
    it("formats SDG with Arabic symbol ج.س", () => {
      const result = formatCurrency(1000, "SDG", "ar")
      expect(result).toContain("ج.س")
      // Uses Arabic-Indic numerals
      expect(result).toContain("١")
    })

    it("formats USD with Arabic symbol دولار", () => {
      const result = formatCurrency(250.5, "USD", "ar")
      expect(result).toContain("دولار")
    })

    it("formats SAR with Arabic symbol ر.س", () => {
      const result = formatCurrency(99.99, "SAR", "ar")
      expect(result).toContain("ر.س")
    })
  })

  describe("English locale", () => {
    it("formats SDG with en-US number format", () => {
      const result = formatCurrency(1000, "SDG", "en")
      expect(result).toBe("1,000.00 SDG")
    })

    it("formats USD with en-US number format", () => {
      const result = formatCurrency(250.5, "USD", "en")
      expect(result).toBe("250.50 USD")
    })

    it("formats SAR with en-US number format", () => {
      const result = formatCurrency(99.99, "SAR", "en")
      expect(result).toBe("99.99 SAR")
    })
  })

  it("defaults to SDG when currency is unknown", () => {
    const result = formatCurrency(10, "EUR", "en")
    expect(result).toContain("SDG")
  })

  it("defaults to SDG and ar locale when arguments omitted", () => {
    const result = formatCurrency(10)
    expect(result).toContain("ج.س")
  })
})
