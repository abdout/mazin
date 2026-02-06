/**
 * Wallet Module - Server Actions (Stubbed)
 *
 * TODO: Implement with Prisma when Wallet models are added
 */

"use server"

export interface WalletActionResult {
  success: boolean
  data?: unknown
  error?: string
}

export async function createWallet(
  formData: FormData
): Promise<WalletActionResult> {
  return { success: false, error: "Wallet creation not yet implemented" }
}

export async function topupWallet(formData: FormData) {
  return { success: false, error: "Wallet top-up not yet implemented" }
}

export async function refundWallet(formData: FormData) {
  return { success: false, error: "Wallet refund not yet implemented" }
}

export async function getWallets(filters?: {
  type?: string
  isActive?: boolean
}) {
  return { success: true, data: [] }
}
