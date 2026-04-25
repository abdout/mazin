"use server"

/**
 * Receipt actions backed by the Prisma `Receipt` model. `uploadReceipt`
 * remains a stub until file storage (S3/R2) is wired — OCR extraction depends
 * on the uploaded file, so the retry is a no-op today.
 */

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { logAudit } from "@/lib/audit"
import { requireStaff } from "@/lib/auth-context"
import { requireCan } from "@/lib/authorization"

import type {
  ExpenseReceipt,
  GetReceiptsResponse,
  ReceiptStatus,
  ServerActionResponse,
  UploadReceiptResponse,
} from "./types"
import type { Receipt } from "@prisma/client"

const log = logger.forModule("finance.receipt")

function statusFromPrisma(s: Receipt["status"]): ReceiptStatus {
  switch (s) {
    case "VERIFIED":
    case "POSTED":
      return "processed"
    case "CANCELLED":
      return "error"
    case "PENDING":
    default:
      return "pending"
  }
}

function adapt(receipt: Receipt): ExpenseReceipt {
  return {
    id: receipt.id,
    schoolId: "", // legacy shape — single-tenant, always empty
    userId: receipt.userId,
    fileName: receipt.fileName ?? "",
    fileDisplayName: receipt.fileName,
    fileUrl: receipt.fileUrl ?? "",
    fileSize: receipt.fileSize ?? 0,
    mimeType: "application/octet-stream",
    status: statusFromPrisma(receipt.status),
    merchantName: receipt.partyName,
    merchantAddress: null,
    merchantContact: null,
    transactionDate: receipt.receiptDate,
    transactionAmount: Number(receipt.amount),
    currency: receipt.currency,
    receiptSummary: receipt.description,
    items: null,
    uploadedAt: receipt.createdAt,
    processedAt: receipt.extractedAt,
    createdAt: receipt.createdAt,
    updatedAt: receipt.updatedAt,
  }
}

export async function uploadReceipt(
  _formData: FormData
): Promise<ServerActionResponse<UploadReceiptResponse>> {
  await requireStaff()
  return {
    success: false,
    error: "Receipt upload requires file storage configuration (S3/R2) — not yet available.",
  }
}

export async function getReceipts(input?: {
  userId?: string
  status?: ReceiptStatus
  limit?: number
  offset?: number
  startDate?: Date
  endDate?: Date
}): Promise<ServerActionResponse<GetReceiptsResponse>> {
  const ctx = await requireStaff()
  requireCan(ctx, "read", "finance")

  const limit = Math.min(100, Math.max(1, input?.limit ?? 20))
  const offset = Math.max(0, input?.offset ?? 0)

  const where: Record<string, unknown> = {}
  if (input?.userId) where.userId = input.userId
  if (input?.startDate || input?.endDate) {
    where.receiptDate = {
      ...(input.startDate && { gte: input.startDate }),
      ...(input.endDate && { lte: input.endDate }),
    }
  }

  const [rows, total] = await Promise.all([
    db.receipt.findMany({ where, orderBy: { receiptDate: "desc" }, take: limit, skip: offset }),
    db.receipt.count({ where }),
  ])

  return {
    success: true,
    data: { receipts: rows.map(adapt), total },
  }
}

export async function getReceiptById(id: string): Promise<ServerActionResponse<ExpenseReceipt>> {
  const ctx = await requireStaff()
  requireCan(ctx, "read", "finance")

  const receipt = await db.receipt.findUnique({ where: { id } })
  if (!receipt) return { success: false, error: "Receipt not found" }

  return { success: true, data: adapt(receipt) }
}

export async function deleteReceipt(id: string): Promise<ServerActionResponse> {
  const ctx = await requireStaff()
  requireCan(ctx, "delete", "finance")

  const receipt = await db.receipt.findUnique({ where: { id } })
  if (!receipt) return { success: false, error: "Receipt not found" }

  await db.receipt.delete({ where: { id } })
  await logAudit({
    action: "RECORD_DELETE",
    actor: ctx,
    resource: "receipt",
    resourceId: id,
    metadata: { receiptNumber: receipt.receiptNumber, amount: Number(receipt.amount) },
  })

  revalidatePath("/finance/receipt")
  log.info("receipt deleted", { id })
  return { success: true }
}

export async function retryReceiptExtraction(id: string): Promise<ServerActionResponse> {
  const ctx = await requireStaff()
  requireCan(ctx, "update", "finance")

  const receipt = await db.receipt.findUnique({ where: { id } })
  if (!receipt) return { success: false, error: "Receipt not found" }
  if (!receipt.fileUrl) {
    return { success: false, error: "No file attached — nothing to extract" }
  }

  // OCR extraction isn't wired yet. Reset status to PENDING so a future
  // extraction pipeline can pick it up.
  await db.receipt.update({
    where: { id },
    data: { status: "PENDING", extractedAt: null, extractedData: undefined },
  })

  await logAudit({
    action: "RECORD_UPDATE",
    actor: ctx,
    resource: "receipt",
    resourceId: id,
    metadata: { operation: "retry_extraction" },
  })

  revalidatePath("/finance/receipt")
  return { success: true }
}
