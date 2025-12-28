/**
 * Plaid Integration - Stubbed Implementation
 *
 * TODO: To enable Plaid integration:
 * 1. npm install plaid
 * 2. Add PLAID_CLIENT_ID, PLAID_SECRET, PLAID_ENV to .env
 * 3. Uncomment and update this file
 */

// Placeholder Plaid client
export const plaidClient = {
  linkTokenCreate: async () => {
    throw new Error("Plaid integration not configured. Please install plaid package and set up environment variables.")
  },
  itemPublicTokenExchange: async () => {
    throw new Error("Plaid integration not configured.")
  },
  accountsGet: async () => {
    throw new Error("Plaid integration not configured.")
  },
  transactionsGet: async () => {
    throw new Error("Plaid integration not configured.")
  },
  institutionsGetById: async () => {
    throw new Error("Plaid integration not configured.")
  },
}

// Placeholder for Plaid configuration
export const PLAID_CONFIG = {
  clientId: process.env.PLAID_CLIENT_ID || "",
  secret: process.env.PLAID_SECRET || "",
  env: (process.env.PLAID_ENV || "sandbox") as "sandbox" | "development" | "production",
}

/**
 * Check if Plaid is configured
 */
export function isPlaidConfigured(): boolean {
  return Boolean(PLAID_CONFIG.clientId && PLAID_CONFIG.secret)
}
