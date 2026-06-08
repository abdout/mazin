import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/auth", () => ({ auth: vi.fn() }))

// Mock the S3 client send method so we don't actually hit AWS during tests.
const sendMock = vi.fn().mockResolvedValue({})
vi.mock("@aws-sdk/client-s3", async (orig) => {
  const actual = (await orig()) as Record<string, unknown>
  return {
    ...actual,
    S3Client: vi.fn().mockImplementation(() => ({ send: sendMock })),
  }
})

vi.mock("@/lib/storage/s3-client", () => ({
  getS3Client: () => ({ send: sendMock }),
  getBucketName: () => "mazin-test",
  getS3Url: (key: string) => `https://mazin-test.s3.us-east-1.amazonaws.com/${key}`,
}))

vi.mock("@/lib/storage/cloudfront", () => ({
  invalidateCache: vi.fn().mockResolvedValue(undefined),
}))

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { uploadFile, deleteFile } from "@/lib/storage/upload"

describe("uploadFile", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue({ user: { id: "u-1", role: "ADMIN" } } as never)
    vi.mocked(db.fileRecord.findFirst).mockResolvedValue(null as never)
    vi.mocked(db.fileRecord.create).mockImplementation(
      (args: never) =>
        Promise.resolve({
          ...((args as { data: unknown }).data as Record<string, unknown>),
          id: "f-1",
          createdAt: new Date(),
          updatedAt: new Date(),
        }) as never
    )
  })

  it("rejects unauthenticated callers", async () => {
    vi.mocked(auth).mockResolvedValue(null as never)
    const file = new File([new Uint8Array([1, 2, 3])], "x.pdf", {
      type: "application/pdf",
    })
    await expect(uploadFile(file, { kind: "shipment-document" })).rejects.toThrow(
      "Unauthorized"
    )
  })

  it("rejects MIME types outside the allowlist", async () => {
    const file = new File([new Uint8Array([1, 2])], "bad.zip", {
      type: "application/zip",
    })
    await expect(uploadFile(file, { kind: "receipt" })).rejects.toThrow(
      /not allowed/i
    )
    expect(sendMock).not.toHaveBeenCalled()
  })

  it("dedupes by SHA-256 — re-upload returns existing row, no S3 PUT", async () => {
    const buf = new Uint8Array([0x70, 0x44, 0x46]) // tiny PDF-ish payload
    const file = new File([buf], "a.pdf", { type: "application/pdf" })

    vi.mocked(db.fileRecord.findFirst).mockResolvedValue({
      id: "existing-1",
      s3Key: "u-1/shipment-documents/old.pdf",
      url: "https://cdn/u-1/shipment-documents/old.pdf",
      contentType: "application/pdf",
      size: 3,
    } as never)

    const result = await uploadFile(file, {
      kind: "shipment-document",
      originalName: "a.pdf",
    })
    expect(result.fileId).toBe("existing-1")
    expect(sendMock).not.toHaveBeenCalled()
  })

  it("PUTs to S3 + creates a FileRecord on first upload", async () => {
    const file = new File([new Uint8Array([1, 2, 3])], "bl.pdf", {
      type: "application/pdf",
    })

    const result = await uploadFile(file, {
      kind: "shipment-document",
      originalName: "bl.pdf",
    })

    expect(sendMock).toHaveBeenCalledTimes(1)
    expect(db.fileRecord.create).toHaveBeenCalled()
    expect(result.s3Key).toMatch(/^u-1\/shipment-documents\/[a-z0-9]+\.pdf$/)
    expect(result.size).toBe(3)
    expect(result.sha256).toMatch(/^[0-9a-f]{64}$/)
  })
})

describe("deleteFile", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue({ user: { id: "u-1", role: "ADMIN" } } as never)
  })

  it("returns false when the FileRecord is missing", async () => {
    vi.mocked(db.fileRecord.findUnique).mockResolvedValue(null)
    expect(await deleteFile("missing")).toBe(false)
  })

  it("forbids non-owner non-admin", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "u-2", role: "CLERK" },
    } as never)
    vi.mocked(db.fileRecord.findUnique).mockResolvedValue({
      id: "f-1",
      s3Key: "u-1/r/abc.pdf",
      uploadedById: "u-1",
    } as never)
    await expect(deleteFile("f-1")).rejects.toThrow("Forbidden")
  })

  it("drops S3 + DB row when owner deletes", async () => {
    vi.mocked(db.fileRecord.findUnique).mockResolvedValue({
      id: "f-1",
      s3Key: "u-1/r/abc.pdf",
      uploadedById: "u-1",
    } as never)
    vi.mocked(db.fileRecord.delete).mockResolvedValue({} as never)
    expect(await deleteFile("f-1")).toBe(true)
    expect(sendMock).toHaveBeenCalled()
    expect(db.fileRecord.delete).toHaveBeenCalledWith({ where: { id: "f-1" } })
  })
})
