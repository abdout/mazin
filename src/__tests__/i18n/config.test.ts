import { describe, it, expect } from "vitest"
import { i18n, localeConfig, isRTL, getDir } from "@/components/internationalization/config"

describe("i18n config", () => {
  it("defaultLocale is 'ar'", () => {
    expect(i18n.defaultLocale).toBe("ar")
  })

  it("locales contains exactly ['ar', 'en']", () => {
    expect(i18n.locales).toContain("ar")
    expect(i18n.locales).toContain("en")
    expect(i18n.locales).toHaveLength(2)
  })
})

describe("localeConfig", () => {
  it("ar config has RTL direction", () => {
    expect(localeConfig.ar.dir).toBe("rtl")
  })

  it("en config has LTR direction", () => {
    expect(localeConfig.en.dir).toBe("ltr")
  })

  it("ar config uses SDG currency", () => {
    expect(localeConfig.ar.currency).toBe("SDG")
  })

  it("en config uses USD currency", () => {
    expect(localeConfig.en.currency).toBe("USD")
  })

  it("ar config has Arabic native name", () => {
    expect(localeConfig.ar.nativeName).toBe("\u0627\u0644\u0639\u0631\u0628\u064A\u0629")
  })

  it("en config has English native name", () => {
    expect(localeConfig.en.nativeName).toBe("English")
  })

  it("both locales have a dateFormat defined", () => {
    expect(localeConfig.ar.dateFormat).toBeTruthy()
    expect(localeConfig.en.dateFormat).toBeTruthy()
  })
})

describe("isRTL", () => {
  it("returns true for 'ar'", () => {
    expect(isRTL("ar")).toBe(true)
  })

  it("returns false for 'en'", () => {
    expect(isRTL("en")).toBe(false)
  })
})

describe("getDir", () => {
  it("returns 'rtl' for 'ar'", () => {
    expect(getDir("ar")).toBe("rtl")
  })

  it("returns 'ltr' for 'en'", () => {
    expect(getDir("en")).toBe("ltr")
  })
})
