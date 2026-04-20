import { describe, it, expect, vi } from "vitest"

// The dictionaries module uses "server-only" — mock it so imports work in test
vi.mock("server-only", () => ({}))

import arDict from "@/components/internationalization/ar.json"
import enDict from "@/components/internationalization/en.json"

// ---------------------------------------------------------------------------
// Recursive key extraction utility
// ---------------------------------------------------------------------------
function getDeepKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      return getDeepKeys(value as Record<string, unknown>, fullKey)
    }
    return [fullKey]
  })
}

function getDeepValues(obj: Record<string, unknown>, prefix = ""): Array<{ key: string; value: unknown }> {
  return Object.entries(obj).flatMap(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      return getDeepValues(value as Record<string, unknown>, fullKey)
    }
    return [{ key: fullKey, value }]
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("i18n deep key matching", () => {
  const arKeys = getDeepKeys(arDict as Record<string, unknown>)
  const enKeys = getDeepKeys(enDict as Record<string, unknown>)
  const arKeySet = new Set(arKeys)
  const enKeySet = new Set(enKeys)

  it("all deep keys in ar.json exist in en.json", () => {
    const missingInEn = arKeys.filter((k) => !enKeySet.has(k))
    expect(
      missingInEn,
      `Keys present in ar.json but missing in en.json:\n${missingInEn.join("\n")}`
    ).toEqual([])
  })

  it("all deep keys in en.json exist in ar.json", () => {
    const missingInAr = enKeys.filter((k) => !arKeySet.has(k))
    expect(
      missingInAr,
      `Keys present in en.json but missing in ar.json:\n${missingInAr.join("\n")}`
    ).toEqual([])
  })

  // Some keys are intentionally empty (mobile layout lines, responsive breakpoints).
  // Maintain this allowlist so the test still catches accidental empties.
  const knownEmptyAr = new Set([
    "marketing.hero.titleMobileLine3",
  ])
  const knownEmptyEn = new Set([
    "about.boardOfDirectors.titleMobileLine1",
    "about.boardOfDirectors.titleMobileLine2",
  ])

  it("no unexpected empty string values in ar.json", () => {
    const arValues = getDeepValues(arDict as Record<string, unknown>)
    const empties = arValues.filter(
      ({ key, value }) =>
        typeof value === "string" && value.trim() === "" && !knownEmptyAr.has(key)
    )
    expect(
      empties.map((e) => e.key),
      `Unexpected empty string values in ar.json:\n${empties.map((e) => e.key).join("\n")}`
    ).toEqual([])
  })

  it("no unexpected empty string values in en.json", () => {
    const enValues = getDeepValues(enDict as Record<string, unknown>)
    const empties = enValues.filter(
      ({ key, value }) =>
        typeof value === "string" && value.trim() === "" && !knownEmptyEn.has(key)
    )
    expect(
      empties.map((e) => e.key),
      `Unexpected empty string values in en.json:\n${empties.map((e) => e.key).join("\n")}`
    ).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Section-level validation — ensure critical sections exist and match
// ---------------------------------------------------------------------------
describe("i18n section validation", () => {
  const requiredSections = [
    "auth",
    "common",
    "tracking",
    "invoices",
    "dashboard",
    "settings",
    "validation",
    "navigation",
  ]

  it.each(requiredSections)("section '%s' exists in both dictionaries", (section) => {
    expect(
      (arDict as Record<string, unknown>)[section],
      `ar.json missing section "${section}"`
    ).toBeDefined()
    expect(
      (enDict as Record<string, unknown>)[section],
      `en.json missing section "${section}"`
    ).toBeDefined()
  })

  it.each(requiredSections)("section '%s' has matching keys in both dictionaries", (section) => {
    const arSection = (arDict as Record<string, unknown>)[section]
    const enSection = (enDict as Record<string, unknown>)[section]
    if (typeof arSection !== "object" || typeof enSection !== "object") return

    const arSectionKeys = getDeepKeys(arSection as Record<string, unknown>).sort()
    const enSectionKeys = getDeepKeys(enSection as Record<string, unknown>).sort()
    expect(arSectionKeys).toEqual(enSectionKeys)
  })
})
