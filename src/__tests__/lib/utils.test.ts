import { describe, it, expect } from "vitest"
import { cn } from "@/lib/utils"

describe("cn (classname merger)", () => {
  it("joins multiple class strings with spaces", () => {
    expect(cn("a", "b", "c")).toBe("a b c")
  })

  it("filters out falsy values", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b")
  })

  it("resolves tailwind conflicts, last one wins", () => {
    // twMerge removes earlier conflicting utility for the same property.
    expect(cn("p-2", "p-4")).toBe("p-4")
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500")
  })

  it("supports conditional object syntax from clsx", () => {
    expect(cn({ "is-active": true, "is-open": false })).toBe("is-active")
  })

  it("supports array input", () => {
    expect(cn(["a", "b"], "c")).toBe("a b c")
  })

  it("returns empty string for no input", () => {
    expect(cn()).toBe("")
  })
})
