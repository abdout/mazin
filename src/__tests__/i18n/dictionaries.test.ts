import { describe, it, expect, vi } from "vitest"

// Un-mock server-only for this test
vi.mock("server-only", () => ({}))

import arDict from "@/components/internationalization/ar.json"
import enDict from "@/components/internationalization/en.json"

describe("i18n dictionaries", () => {
  it("ar.json and en.json have the same top-level keys", () => {
    const arKeys = Object.keys(arDict).sort()
    const enKeys = Object.keys(enDict).sort()
    expect(arKeys).toEqual(enKeys)
  })

  it("error page keys exist in both locales", () => {
    expect(arDict.errorPage).toBeDefined()
    expect(enDict.errorPage).toBeDefined()
    expect(arDict.errorPage.title).toBeTruthy()
    expect(enDict.errorPage.title).toBeTruthy()
  })

  it("not found keys exist in both locales", () => {
    expect(arDict.notFound).toBeDefined()
    expect(enDict.notFound).toBeDefined()
    expect(arDict.notFound.title).toBeTruthy()
    expect(enDict.notFound.title).toBeTruthy()
  })

  it("common section has matching keys", () => {
    const arCommonKeys = Object.keys(arDict.common).sort()
    const enCommonKeys = Object.keys(enDict.common).sort()
    expect(arCommonKeys).toEqual(enCommonKeys)
  })

  it("auth section has matching keys", () => {
    const arAuthKeys = Object.keys(arDict.auth).sort()
    const enAuthKeys = Object.keys(enDict.auth).sort()
    expect(arAuthKeys).toEqual(enAuthKeys)
  })

  it("no empty string values in ar.json common section", () => {
    for (const [key, value] of Object.entries(arDict.common)) {
      expect(value, `ar.json common.${key} should not be empty`).toBeTruthy()
    }
  })

  it("no empty string values in en.json common section", () => {
    for (const [key, value] of Object.entries(enDict.common)) {
      expect(value, `en.json common.${key} should not be empty`).toBeTruthy()
    }
  })
})
