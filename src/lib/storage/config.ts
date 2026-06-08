/**
 * Storage configuration: folder map, MIME allowlists, and size limits.
 *
 * Adapted from `~/hogwarts/src/components/file/config.ts`. Folder names mirror
 * Mazin's document taxonomy (declaration, BL, invoice, packing list, etc.) so
 * S3 prefixes are self-documenting.
 */

/** Logical upload "kind" — drives folder, MIME allowlist, and size cap. */
export type UploadKind =
  | "shipment-document" // BL, Commercial Invoice, Packing List, COO, IM Form, ACD…
  | "receipt" // bank screenshots, customs receipts, port receipts
  | "invoice-pdf" // generated clearance invoices, statements
  | "avatar" // user / client logo
  | "company-logo"
  | "pod-photo" // proof-of-delivery photos
  | "inspection-photo" // mobile inspection capture
  | "chat-attachment" // internal messaging attachments
  | "other"

interface KindConfig {
  /** S3 key prefix; final key becomes `{userId}/{folder}/{nanoid}.{ext}`. */
  folder: string
  /** Max bytes accepted client-side AND server-side. */
  maxSize: number
  /** MIME allowlist (or "*" for any). */
  mimeTypes: string[]
}

const MB = 1024 * 1024

export const STORAGE_CONFIG: Record<UploadKind, KindConfig> = {
  "shipment-document": {
    folder: "shipment-documents",
    maxSize: 25 * MB,
    mimeTypes: ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic"],
  },
  receipt: {
    folder: "receipts",
    maxSize: 10 * MB,
    mimeTypes: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
  },
  "invoice-pdf": {
    folder: "invoices",
    maxSize: 10 * MB,
    mimeTypes: ["application/pdf"],
  },
  avatar: {
    folder: "avatars",
    maxSize: 2 * MB,
    mimeTypes: ["image/jpeg", "image/png", "image/webp"],
  },
  "company-logo": {
    folder: "logos",
    maxSize: 5 * MB,
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
  },
  "pod-photo": {
    folder: "pod",
    maxSize: 10 * MB,
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/heic"],
  },
  "inspection-photo": {
    folder: "inspections",
    maxSize: 10 * MB,
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/heic"],
  },
  "chat-attachment": {
    folder: "chat",
    maxSize: 25 * MB,
    mimeTypes: [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
  },
  other: {
    folder: "other",
    maxSize: 25 * MB,
    mimeTypes: [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "text/csv",
      "text/plain",
    ],
  },
}

export interface UploadValidationError {
  code: "TOO_LARGE" | "BAD_MIME" | "EMPTY"
  message: string
}

export function validateUpload(
  file: { size: number; type: string },
  kind: UploadKind
): UploadValidationError | null {
  const cfg = STORAGE_CONFIG[kind]
  if (file.size === 0) {
    return { code: "EMPTY", message: "File is empty" }
  }
  if (file.size > cfg.maxSize) {
    const maxMb = Math.round(cfg.maxSize / MB)
    return {
      code: "TOO_LARGE",
      message: `File exceeds ${maxMb}MB limit for ${kind}`,
    }
  }
  if (!cfg.mimeTypes.includes(file.type)) {
    return {
      code: "BAD_MIME",
      message: `MIME type ${file.type} is not allowed for ${kind}`,
    }
  }
  return null
}
