import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook } from "@testing-library/react"

const pathnameMock = vi.hoisted(() => vi.fn<() => string | null>())

vi.mock("next/navigation", () => ({
  usePathname: pathnameMock,
}))

import { useBreadcrumbs } from "@/hooks/use-breadcrumbs"

describe("useBreadcrumbs", () => {
  beforeEach(() => {
    pathnameMock.mockReset()
  })

  it("returns empty for null pathname", () => {
    pathnameMock.mockReturnValue(null)
    const { result } = renderHook(() => useBreadcrumbs())
    expect(result.current).toEqual([])
  })

  it("returns empty when only locale segment is present", () => {
    pathnameMock.mockReturnValue("/ar")
    const { result } = renderHook(() => useBreadcrumbs())
    expect(result.current).toEqual([])
  })

  it("uses mapped titles for known segments", () => {
    pathnameMock.mockReturnValue("/ar/dashboard/shipments")
    const { result } = renderHook(() => useBreadcrumbs())
    expect(result.current).toEqual([
      { title: "Dashboard", link: "/ar/dashboard" },
      { title: "Shipments", link: "/ar/dashboard/shipments" },
    ])
  })

  it("capitalizes unknown segments", () => {
    pathnameMock.mockReturnValue("/en/reports")
    const { result } = renderHook(() => useBreadcrumbs())
    expect(result.current).toEqual([{ title: "Reports", link: "/en/reports" }])
  })

  it("labels UUID segments as 'Details'", () => {
    const uuid = "12345678-1234-1234-1234-1234567890ab"
    pathnameMock.mockReturnValue(`/en/shipments/${uuid}`)
    const { result } = renderHook(() => useBreadcrumbs())
    expect(result.current).toEqual([
      { title: "Shipments", link: "/en/shipments" },
      { title: "Details", link: `/en/shipments/${uuid}` },
    ])
  })

  it("treats non-locale first segments as regular path parts", () => {
    // pathname without a locale — 'admin' is 5 chars, so isLocale=false
    pathnameMock.mockReturnValue("/admin/settings")
    const { result } = renderHook(() => useBreadcrumbs())
    expect(result.current[0]?.link).toBe("/en/admin")
  })
})
