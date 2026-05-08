import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// We mock @react-pdf/renderer so the test runs without spinning up a real
// PDF renderer (and so we can simulate slow renders).
const renderToBufferMock = vi.fn()
vi.mock("@react-pdf/renderer", () => ({
  renderToBuffer: (doc: unknown) => renderToBufferMock(doc),
}))

import { renderPdfWithTimeout, PdfTimeoutError } from "@/lib/pdf-render"

describe("renderPdfWithTimeout", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns the rendered buffer when render completes in time", async () => {
    const buf = Buffer.from("pdf-bytes")
    renderToBufferMock.mockResolvedValueOnce(buf)

    const result = await renderPdfWithTimeout({}, 5000)

    expect(result).toBe(buf)
    expect(renderToBufferMock).toHaveBeenCalledTimes(1)
  })

  it("rejects with PdfTimeoutError when render exceeds the timeout", async () => {
    vi.useFakeTimers()
    // Render hangs forever.
    renderToBufferMock.mockReturnValueOnce(new Promise(() => {}))

    const promise = renderPdfWithTimeout({}, 100)
    vi.advanceTimersByTime(101)

    await expect(promise).rejects.toBeInstanceOf(PdfTimeoutError)
  })

  it("propagates the underlying renderer error", async () => {
    renderToBufferMock.mockRejectedValueOnce(new Error("font load failed"))

    await expect(renderPdfWithTimeout({}, 5000)).rejects.toThrow("font load failed")
  })
})
