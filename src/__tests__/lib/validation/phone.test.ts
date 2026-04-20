import { describe, it, expect } from "vitest"

import { normalizeSudanPhone, isValidSudanPhone } from "@/lib/validation/phone"

describe("normalizeSudanPhone", () => {
  describe("valid inputs", () => {
    it("keeps an already E.164-formatted number", () => {
      expect(normalizeSudanPhone("+249912345678")).toBe("+249912345678")
    })

    it("converts international dial prefix 00249 to +249", () => {
      expect(normalizeSudanPhone("00249912345678")).toBe("+249912345678")
    })

    it("converts local trunk prefix 0 to +249", () => {
      expect(normalizeSudanPhone("0912345678")).toBe("+249912345678")
    })

    it("adds +249 when no country code is present", () => {
      expect(normalizeSudanPhone("912345678")).toBe("+249912345678")
    })

    it("accepts spaces inside an international number", () => {
      expect(normalizeSudanPhone("+249 91 234 5678")).toBe("+249912345678")
    })

    it("accepts dashes inside a local number", () => {
      expect(normalizeSudanPhone("091-234-5678")).toBe("+249912345678")
    })

    it("accepts parentheses around the area code", () => {
      expect(normalizeSudanPhone("(091) 234 5678")).toBe("+249912345678")
    })

    it("accepts the '1' mobile prefix", () => {
      expect(normalizeSudanPhone("0112345678")).toBe("+249112345678")
    })

    it("accepts a tab-separated international format", () => {
      expect(normalizeSudanPhone("+249\t912345678")).toBe("+249912345678")
    })
  })

  describe("invalid inputs", () => {
    it("rejects an empty string", () => {
      expect(normalizeSudanPhone("")).toBeNull()
    })

    it("rejects a whitespace-only string", () => {
      expect(normalizeSudanPhone("   ")).toBeNull()
    })

    it("rejects a string with no digits", () => {
      expect(normalizeSudanPhone("abc-def")).toBeNull()
    })

    it("rejects a number that is too short", () => {
      expect(normalizeSudanPhone("091234567")).toBeNull()
    })

    it("rejects a number that is too long", () => {
      expect(normalizeSudanPhone("09123456789")).toBeNull()
    })

    it("rejects an unsupported mobile prefix (e.g. '2')", () => {
      expect(normalizeSudanPhone("0212345678")).toBeNull()
    })

    it("rejects an unsupported mobile prefix (e.g. '5')", () => {
      expect(normalizeSudanPhone("912345678".replace("9", "5"))).toBeNull()
    })

    it("rejects non-string inputs via runtime check", () => {
      // @ts-expect-error - intentionally passing non-string
      expect(normalizeSudanPhone(undefined)).toBeNull()
      // @ts-expect-error - intentionally passing non-string
      expect(normalizeSudanPhone(null)).toBeNull()
      // @ts-expect-error - intentionally passing non-string
      expect(normalizeSudanPhone(123)).toBeNull()
    })
  })

  describe("output format", () => {
    it("always produces exactly 13 characters for valid inputs", () => {
      const result = normalizeSudanPhone("0912345678")
      expect(result).not.toBeNull()
      expect(result).toHaveLength(13)
    })

    it("always starts with +249 for valid inputs", () => {
      const result = normalizeSudanPhone("912345678")
      expect(result?.startsWith("+249")).toBe(true)
    })
  })
})

describe("isValidSudanPhone", () => {
  it("returns true for a valid number", () => {
    expect(isValidSudanPhone("+249912345678")).toBe(true)
    expect(isValidSudanPhone("0912345678")).toBe(true)
    expect(isValidSudanPhone("0112345678")).toBe(true)
  })

  it("returns false for an invalid number", () => {
    expect(isValidSudanPhone("")).toBe(false)
    expect(isValidSudanPhone("not-a-phone")).toBe(false)
    expect(isValidSudanPhone("0212345678")).toBe(false)
    expect(isValidSudanPhone("091234567")).toBe(false)
  })
})
