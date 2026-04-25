import { describe, it, expect } from "vitest"
import { siteConfig } from "@/lib/site"

describe("siteConfig", () => {
  it("exposes core site metadata", () => {
    expect(siteConfig.name).toBeTruthy()
    expect(siteConfig.description).toContain("Port Sudan")
    expect(siteConfig.url).toMatch(/^https:\/\//)
    expect(siteConfig.ogImage).toMatch(/^https:\/\//)
  })

  it("includes github link", () => {
    expect(siteConfig.links.github).toMatch(/^https:\/\/github\.com\//)
  })

  it("has bilingual keywords (Arabic + English)", () => {
    const arabicChars = /[\u0600-\u06FF]/
    const hasArabic = siteConfig.keywords.some((k) => arabicChars.test(k))
    const hasEnglish = siteConfig.keywords.some((k) => /^[a-zA-Z\s]+$/.test(k))

    expect(hasArabic).toBe(true)
    expect(hasEnglish).toBe(true)
  })
})
