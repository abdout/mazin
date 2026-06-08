"use server"

/**
 * Server-side upload entrypoint.
 *
 * Single round-trip: client posts FormData → action validates → SHA-256 +
 * S3 PutObject → FileRecord row → returns the public URL. For files >25MB
 * we'd switch to pre-signed PUT, but Mazin's documents (BL, Invoice, PL,
 * receipts) are uniformly under that ceiling.
 *
 * Lifted from `~/hogwarts/src/components/file/upload/actions.ts` and adapted:
 * - dropped multi-tenant `schoolId` scoping
 * - replaced category/type taxonomy with Mazin's `UploadKind`
 * - SHA-256 added so we can dedupe identical re-uploads (same hash → same row)
 */

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import {
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3"
import crypto from "node:crypto"
import { customAlphabet } from "nanoid"

import { getS3Client, getBucketName, getS3Url } from "./s3-client"
import { getCloudFrontUrl, extractKeyFromUrl } from "./cloudfront-url"
import { invalidateCache } from "./cloudfront"
import { STORAGE_CONFIG, validateUpload, type UploadKind } from "./config"

const log = logger.forModule("storage.upload")

const idAlphabet = "0123456789abcdefghijklmnopqrstuvwxyz"
const nanoid = customAlphabet(idAlphabet, 18)

export interface UploadResult {
  fileId: string
  s3Key: string
  url: string
  contentType: string
  size: number
  sha256: string
}

export interface UploadOptions {
  kind: UploadKind
  /** Defaults to `public` (CloudFront-cached). Use `private` for signed URLs. */
  access?: "public" | "private"
  /** Free-form key/value pairs stored on the row + as S3 object metadata. */
  metadata?: Record<string, string>
  /** Original client filename, for downloads + display. */
  originalName?: string
}

/**
 * Upload a single file. Server-side only — never call from a client component.
 */
export async function uploadFile(
  file: File | Blob,
  options: UploadOptions
): Promise<UploadResult> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const cfg = STORAGE_CONFIG[options.kind]
  const error = validateUpload({ size: file.size, type: file.type }, options.kind)
  if (error) throw new Error(error.message)

  const buffer = Buffer.from(await file.arrayBuffer())
  const sha256 = crypto.createHash("sha256").update(buffer).digest("hex")

  // Dedup: if this user already uploaded an identical file for the same kind,
  // reuse the existing row instead of putting another copy.
  const existing = await db.fileRecord.findFirst({
    where: { uploadedById: session.user.id, sha256, kind: options.kind },
  })
  if (existing) {
    return {
      fileId: existing.id,
      s3Key: existing.s3Key,
      url: existing.url,
      contentType: existing.contentType,
      size: existing.size,
      sha256,
    }
  }

  const ext = inferExtension(options.originalName, file.type)
  const s3Key = `${session.user.id}/${cfg.folder}/${nanoid()}${ext ? `.${ext}` : ""}`

  try {
    await getS3Client().send(
      new PutObjectCommand({
        Bucket: getBucketName(),
        Key: s3Key,
        Body: buffer,
        ContentType: file.type || "application/octet-stream",
        Metadata: options.metadata,
        // Long-lived cache for media; the URL itself is unique per upload so
        // changing content always changes URL.
        CacheControl: "public, max-age=31536000, immutable",
      })
    )
  } catch (err) {
    log.error("S3 PutObject failed", err as Error, { kind: options.kind, s3Key })
    throw new Error("Upload to S3 failed")
  }

  const url =
    options.access === "private" ? getS3Url(s3Key) : getCloudFrontUrl(s3Key)

  const record = await db.fileRecord.create({
    data: {
      s3Key,
      url,
      contentType: file.type || "application/octet-stream",
      size: file.size,
      sha256,
      kind: options.kind,
      uploadedById: session.user.id,
      access: options.access ?? "public",
      originalName: options.originalName,
      metadata: options.metadata as never,
    },
  })

  return {
    fileId: record.id,
    s3Key,
    url,
    contentType: record.contentType,
    size: record.size,
    sha256,
  }
}

/**
 * Delete an uploaded file — drops both the S3 object and the FileRecord row.
 * Cache invalidation is best-effort: a stale CloudFront entry is harmless once
 * the row is gone, but invalidating keeps the CDN tidy.
 */
export async function deleteFile(fileId: string): Promise<boolean> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const record = await db.fileRecord.findUnique({ where: { id: fileId } })
  if (!record) return false

  // Only the uploader (or an ADMIN) can delete. Mazin is single-tenant so this
  // is the only ownership check we need.
  if (record.uploadedById !== session.user.id && session.user.role !== "ADMIN") {
    throw new Error("Forbidden")
  }

  try {
    await getS3Client().send(
      new DeleteObjectCommand({ Bucket: getBucketName(), Key: record.s3Key })
    )
  } catch (err) {
    log.error("S3 DeleteObject failed (continuing with row delete)", err as Error, {
      s3Key: record.s3Key,
    })
  }

  await db.fileRecord.delete({ where: { id: fileId } })
  await invalidateCache([`/${record.s3Key}`])
  return true
}

/**
 * Look up an existing FileRecord by its public URL or raw S3 key. Used when
 * external systems (OCR, downstream actions) hand us a URL string and we need
 * to find the FileRecord that backs it.
 */
export async function findFileByUrl(url: string) {
  const key = extractKeyFromUrl(url)
  return db.fileRecord.findFirst({ where: { OR: [{ url }, { s3Key: key }] } })
}

function inferExtension(originalName: string | undefined, mime: string): string {
  if (originalName) {
    const m = originalName.match(/\.([a-zA-Z0-9]+)$/)
    if (m) return m[1]!.toLowerCase()
  }
  return mimeToExt(mime)
}

function mimeToExt(mime: string): string {
  switch (mime) {
    case "application/pdf":
      return "pdf"
    case "image/jpeg":
      return "jpg"
    case "image/png":
      return "png"
    case "image/webp":
      return "webp"
    case "image/heic":
      return "heic"
    case "image/svg+xml":
      return "svg"
    case "text/csv":
      return "csv"
    case "text/plain":
      return "txt"
    default:
      return ""
  }
}
