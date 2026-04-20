"use server"

import { auth } from "@/auth"
import { extractReceipt, type ReceiptResult } from "@/lib/services/ocr"

interface ExtractedReceiptData {
  merchantName: string
  merchantAddress: string
  merchantContact: string
  transactionDate: string
  transactionAmount: string
  currency: string
  receiptSummary: string
  items: {
    description: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }[]
}

export async function extractReceiptData(
  receiptId: string,
  fileUrl: string
): Promise<{ success: boolean; data?: ExtractedReceiptData; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      success: false,
      error: "ANTHROPIC_API_KEY not configured",
    }
  }

  const result = await extractReceipt(fileUrl)

  if (!result.success) {
    return { success: false, error: result.error }
  }

  return {
    success: true,
    data: mapToLegacyFormat(result.data),
  }
}

export async function retryExtraction(
  receiptId: string
): Promise<{ success: boolean; data?: ExtractedReceiptData; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  return {
    success: false,
    error: "Retry requires the original file URL. Re-upload the receipt to extract.",
  }
}

function mapToLegacyFormat(data: ReceiptResult): ExtractedReceiptData {
  return {
    merchantName: data.merchantName,
    merchantAddress: data.merchantAddress ?? "",
    merchantContact: data.merchantContact ?? "",
    transactionDate: data.transactionDate,
    transactionAmount: String(data.total),
    currency: data.currency,
    receiptSummary: data.notes ?? `Receipt from ${data.merchantName}`,
    items: data.items,
  }
}
