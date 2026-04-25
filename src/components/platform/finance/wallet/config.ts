// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Stored as regular decimals (not cents) — matches Prisma's Decimal(15,2).
export const WALLET_LIMITS = {
  MIN_DEPOSIT: 0.01,
  MAX_DEPOSIT: 100_000_000,
  MIN_DRAWDOWN: 0.01,
  MAX_DRAWDOWN: 100_000_000,
} as const
