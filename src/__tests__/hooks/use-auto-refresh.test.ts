import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useAutoRefresh } from "@/components/table/use-auto-refresh"

describe("useAutoRefresh", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("reports isRunning=true after mount when enabled", () => {
    const onRefresh = vi.fn()
    const { result } = renderHook(() =>
      useAutoRefresh({ onRefresh, enabled: true, pauseOnBlur: false })
    )
    expect(result.current.isRunning).toBe(true)
  })

  it("reports isRunning=false when disabled", () => {
    const onRefresh = vi.fn()
    const { result } = renderHook(() =>
      useAutoRefresh({ onRefresh, enabled: false, pauseOnBlur: false })
    )
    expect(result.current.isRunning).toBe(false)
  })

  it("calls onRefresh at each interval tick", async () => {
    const onRefresh = vi.fn()
    renderHook(() =>
      useAutoRefresh({
        onRefresh,
        enabled: true,
        interval: 1000,
        pauseOnBlur: false,
      })
    )

    expect(onRefresh).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })
    expect(onRefresh).toHaveBeenCalledTimes(1)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })
    expect(onRefresh).toHaveBeenCalledTimes(2)
  })

  it("stop() halts interval and sets isRunning=false", async () => {
    const onRefresh = vi.fn()
    const { result } = renderHook(() =>
      useAutoRefresh({
        onRefresh,
        enabled: true,
        interval: 1000,
        pauseOnBlur: false,
      })
    )

    expect(result.current.isRunning).toBe(true)

    act(() => {
      result.current.stop()
    })

    expect(result.current.isRunning).toBe(false)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000)
    })

    expect(onRefresh).not.toHaveBeenCalled()
  })

  it("start() resumes interval after stop", async () => {
    const onRefresh = vi.fn()
    const { result } = renderHook(() =>
      useAutoRefresh({
        onRefresh,
        enabled: true,
        interval: 1000,
        pauseOnBlur: false,
      })
    )

    act(() => {
      result.current.stop()
    })
    expect(result.current.isRunning).toBe(false)

    act(() => {
      result.current.start()
    })
    expect(result.current.isRunning).toBe(true)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })
    expect(onRefresh).toHaveBeenCalledTimes(1)
  })

  it("refreshOnMount triggers an immediate refresh", async () => {
    const onRefresh = vi.fn()
    renderHook(() =>
      useAutoRefresh({
        onRefresh,
        enabled: true,
        interval: 10000,
        refreshOnMount: true,
        pauseOnBlur: false,
      })
    )

    // Let microtasks drain
    await act(async () => {
      await Promise.resolve()
    })

    expect(onRefresh).toHaveBeenCalledTimes(1)
  })

  it("invokes onError when onRefresh throws", async () => {
    const onRefresh = vi.fn().mockRejectedValue(new Error("boom"))
    const onError = vi.fn()
    renderHook(() =>
      useAutoRefresh({
        onRefresh,
        onError,
        enabled: true,
        interval: 1000,
        pauseOnBlur: false,
      })
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })

    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError.mock.calls[0]![0]).toBeInstanceOf(Error)
  })
})
