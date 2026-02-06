/**
 * Receipt Module - Server Actions (Stubbed)
 *
 * TODO: Implement with Prisma when ExpenseReceipt model is added
 */

"use server"

import type {
  ExpenseReceipt,
  GetReceiptsResponse,
  ServerActionResponse,
  UploadReceiptResponse,
} from "./types"

export async function uploadReceipt(
  formData: FormData
): Promise<ServerActionResponse<UploadReceiptResponse>> {
  return {
    success: false,
    error: "Receipt upload not yet implemented",
  }
}

export async function getReceipts(input?: {
  userId?: string
  status?: "pending" | "processing" | "processed" | "error"
  limit?: number
  offset?: number
  startDate?: Date
  endDate?: Date
}): Promise<ServerActionResponse<GetReceiptsResponse>> {
  return {
    success: true,
    data: {
      receipts: [],
      total: 0,
    },
  }
}

export async function getReceiptById(
  id: string
): Promise<ServerActionResponse<ExpenseReceipt>> {
  return {
    success: false,
    error: "Receipt not found",
  }
}

export async function deleteReceipt(id: string): Promise<ServerActionResponse> {
  return {
    success: false,
    error: "Receipt deletion not yet implemented",
  }
}

export async function retryReceiptExtraction(
  id: string
): Promise<ServerActionResponse> {
  return {
    success: false,
    error: "Receipt extraction retry not yet implemented",
  }
}
