import { describe, it, expect } from "vitest"
import { validateUpload, STORAGE_CONFIG } from "@/lib/storage/config"

describe("validateUpload", () => {
  it("rejects empty files", () => {
    const err = validateUpload({ size: 0, type: "application/pdf" }, "shipment-document")
    expect(err?.code).toBe("EMPTY")
  })

  it("rejects files over the per-kind size cap", () => {
    const err = validateUpload(
      { size: STORAGE_CONFIG["avatar"].maxSize + 1, type: "image/png" },
      "avatar"
    )
    expect(err?.code).toBe("TOO_LARGE")
  })

  it("rejects MIME types not on the allowlist", () => {
    const err = validateUpload({ size: 1024, type: "application/zip" }, "receipt")
    expect(err?.code).toBe("BAD_MIME")
  })

  it("accepts valid PDFs for shipment-document kind", () => {
    expect(
      validateUpload({ size: 5000, type: "application/pdf" }, "shipment-document")
    ).toBeNull()
  })

  it("accepts JPEG inspection photos", () => {
    expect(
      validateUpload({ size: 500_000, type: "image/jpeg" }, "inspection-photo")
    ).toBeNull()
  })

  it("each kind has a folder + cap + at least one MIME", () => {
    for (const cfg of Object.values(STORAGE_CONFIG)) {
      expect(cfg.folder).toMatch(/^[a-z-]+$/)
      expect(cfg.maxSize).toBeGreaterThan(0)
      expect(cfg.mimeTypes.length).toBeGreaterThan(0)
    }
  })
})
