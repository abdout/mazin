import { describe, it, expect } from "vitest"
import {
  validateContainerNumber,
  validateBLNumber,
  validateACN,
  validateManifestRef,
  validateIMNumber,
  validateDeclarationNumber,
} from "@/lib/validation/customs-refs"

describe("validateContainerNumber (ISO 6346)", () => {
  // Check-digit-correct numbers computed from the ISO 6346 algorithm. If you
  // change the letter-value table, regenerate these.
  it.each([
    ["MAEU1234567", true],   // computed check = 7
    ["CMAU1234564", true],   // computed check = 4
    ["CMAU1234567", false],  // wrong check digit
    ["MAEU0000000", false],  // wrong check digit
    ["MAEU12345AB", false],  // non-digit at check position
  ])("%s -> %s", (input, expected) => {
    expect(validateContainerNumber(input)).toBe(expected)
  })

  it("rejects malformed length", () => {
    expect(validateContainerNumber("MAEU12345")).toBe(false)
    expect(validateContainerNumber("MAEU12345678")).toBe(false)
    expect(validateContainerNumber("")).toBe(false)
  })

  it("trims + upper-cases input before validating", () => {
    expect(validateContainerNumber(" maeu1234567 ")).toBe(true)
  })
})

describe("validateBLNumber", () => {
  // The strict regex is the CMA CGM format documented in reference-numbers.md.
  // Eastern Shipping (`OSLPKGPZU…`) and Al Arbab (`VCLPKG…`) currently bypass
  // this validator — they have their own line-specific shapes.
  it("accepts CMA CGM 3-letter + 7-digit", () => {
    expect(validateBLNumber("GGZ2339767")).toBe(true)
    expect(validateBLNumber("cma1234567")).toBe(true) // case-insensitive after trim
  })
  it("rejects bad shapes", () => {
    expect(validateBLNumber("MA12345678")).toBe(false)
    expect(validateBLNumber("MAEU1234567")).toBe(false) // 4-letter prefix is a container, not a CMA BL
    expect(validateBLNumber("MAEU123456")).toBe(false)
  })
})

describe("validateACN", () => {
  it("accepts ACN-YYYYMM-NNNNN", () => {
    expect(validateACN("ACN-202601-12345")).toBe(true)
  })
  it("rejects without prefix or wrong digit count", () => {
    expect(validateACN("202601-12345")).toBe(false)
    expect(validateACN("ACN-202601-1234")).toBe(false)
  })
})

describe("validateManifestRef", () => {
  it("accepts PZUS0/PZUS1 + year + seq", () => {
    expect(validateManifestRef("PZUS0 2025 1419")).toBe(true)
    expect(validateManifestRef("PZUS1 2026 0001")).toBe(true)
  })
  it("rejects other ports or shapes", () => {
    expect(validateManifestRef("PZUS2 2025 1419")).toBe(false)
    expect(validateManifestRef("PZUS0-2025-1419")).toBe(false)
  })
})

describe("validateIMNumber", () => {
  it("accepts varied bank prefixes + separators", () => {
    expect(validateIMNumber("FB-12345678")).toBe(true)
    expect(validateIMNumber("KCB12345678")).toBe(true)
    expect(validateIMNumber("IM-2026-00001")).toBe(true)
    expect(validateIMNumber("IM/2026/0001")).toBe(true)
  })
  it("rejects too-short / non-letter prefix", () => {
    expect(validateIMNumber("12345678")).toBe(false) // no letter prefix
    expect(validateIMNumber("X-123")).toBe(false) // too short
    expect(validateIMNumber("FB 12345678")).toBe(false) // whitespace
  })
})

describe("validateDeclarationNumber", () => {
  it("accepts Sudan customs declaration shapes", () => {
    expect(validateDeclarationNumber("PZUS0 25/00123")).toBe(true)
    expect(validateDeclarationNumber("PZUS1 26/9999")).toBe(true)
  })
  it("rejects garbage", () => {
    expect(validateDeclarationNumber("PZUS25/123")).toBe(false) // missing space
    expect(validateDeclarationNumber("XY 25/123")).toBe(false)  // prefix too short
    expect(validateDeclarationNumber("PZUS0-25-123")).toBe(false)
  })
})
