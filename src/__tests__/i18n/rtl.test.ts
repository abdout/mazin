import { describe, it, expect } from "vitest"
import { i18n, isRTL, getDir, localeConfig } from "@/components/internationalization/config"

describe("i18n config (RTL helpers)", () => {
  it("defaults to Arabic", () => {
    expect(i18n.defaultLocale).toBe("ar")
  })

  it("supports ar and en", () => {
    expect(i18n.locales).toContain("ar")
    expect(i18n.locales).toContain("en")
  })

  describe("isRTL", () => {
    it("returns true for ar", () => {
      expect(isRTL("ar")).toBe(true)
    })

    it("returns false for en", () => {
      expect(isRTL("en")).toBe(false)
    })
  })

  describe("getDir", () => {
    it("returns rtl for ar", () => {
      expect(getDir("ar")).toBe("rtl")
    })

    it("returns ltr for en", () => {
      expect(getDir("en")).toBe("ltr")
    })
  })

  describe("localeConfig", () => {
    it("includes native names", () => {
      expect(localeConfig.ar.nativeName).toBe("العربية")
      expect(localeConfig.en.nativeName).toBe("English")
    })

    it("uses SDG for Arabic, USD for English", () => {
      expect(localeConfig.ar.currency).toBe("SDG")
      expect(localeConfig.en.currency).toBe("USD")
    })
  })
})
