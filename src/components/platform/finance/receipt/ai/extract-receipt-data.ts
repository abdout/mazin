/**
 * AI-Powered Receipt Data Extraction (Stubbed)
 *
 * TODO: Install @ai-sdk/anthropic and implement actual extraction
 * This stub allows the build to pass without the AI dependencies
 */

"use server"

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

/**
 * Extract structured data from receipt image/PDF (Stubbed)
 * @param receiptId - Database ID of the receipt record
 * @param fileUrl - Public URL of the uploaded receipt file
 */
export async function extractReceiptData(
  receiptId: string,
  fileUrl: string
): Promise<{ success: boolean; data?: ExtractedReceiptData; error?: string }> {
  console.log("extractReceiptData called (stubbed):", { receiptId, fileUrl })

  // Return stubbed data for development
  return {
    success: true,
    data: {
      merchantName: "Sample Merchant",
      merchantAddress: "123 Sample Street",
      merchantContact: "+1-234-567-8900",
      transactionDate: new Date().toISOString().split("T")[0],
      transactionAmount: "100.00",
      currency: "SDG",
      receiptSummary: "Sample receipt for development",
      items: [
        {
          description: "Sample Item",
          quantity: 1,
          unitPrice: 100,
          totalPrice: 100,
        },
      ],
    },
  }
}

/**
 * Retry extraction for failed receipts (Stubbed)
 * @param receiptId - Database ID of the receipt record
 */
export async function retryExtraction(
  receiptId: string
): Promise<{ success: boolean; data?: ExtractedReceiptData; error?: string }> {
  console.log("retryExtraction called (stubbed):", { receiptId })

  return {
    success: false,
    error: "AI extraction not implemented - install @ai-sdk/anthropic",
  }
}
