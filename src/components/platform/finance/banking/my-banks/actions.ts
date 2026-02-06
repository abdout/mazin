"use server"

/**
 * My Banks Actions - Stubbed Implementation
 *
 * TODO: This requires:
 * 1. Prisma schema with BankAccount model
 * 2. Plaid API integration
 */

import type { BankAccount } from "@prisma/client"

export interface BankWithInfo extends BankAccount {
  institutionName?: string
  institutionLogo?: string
  primaryColor?: string
}

export async function getBanksForUser(userId: string): Promise<BankWithInfo[]> {
  // TODO: Implement with Prisma
  return []
}

export async function unlinkBank(bankId: string): Promise<{ success: boolean; error?: string }> {
  // TODO: Implement with Prisma
  return { success: false, error: "Bank unlinking not yet implemented" }
}

export async function refreshBankData(bankId: string): Promise<{ success: boolean; error?: string }> {
  // TODO: Implement with Plaid API
  return { success: false, error: "Bank refresh not yet implemented" }
}
