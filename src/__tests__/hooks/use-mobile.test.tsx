import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useIsMobile } from "@/hooks/use-mobile"

describe("useIsMobile", () => {
  let listeners: Array<() => void> = []
  let matches = false

  beforeEach(() => {
    listeners = []
    matches = false

    vi.stubGlobal("matchMedia", (_query: string) => ({
      matches,
      media: _query,
      addEventListener: (_type: string, cb: () => void) => {
        listeners.push(cb)
      },
      removeEventListener: (_type: string, cb: () => void) => {
        listeners = listeners.filter((l) => l !== cb)
      },
      onchange: null,
      dispatchEvent: () => false,
      addListener: () => {},
      removeListener: () => {},
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function setViewport(width: number) {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: width,
    })
  }

  it("returns true when viewport is below mobile breakpoint", () => {
    setViewport(500)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it("returns false when viewport is at or above breakpoint", () => {
    setViewport(1024)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it("updates when media query change fires", () => {
    setViewport(1024)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)

    act(() => {
      setViewport(500)
      listeners.forEach((cb) => cb())
    })
    expect(result.current).toBe(true)
  })

  it("removes its listener on unmount", () => {
    setViewport(1024)
    const { unmount } = renderHook(() => useIsMobile())
    expect(listeners.length).toBe(1)
    unmount()
    expect(listeners.length).toBe(0)
  })
})
