// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// The report types we actually render today. Kept in code so the dictionary
// stays driven by strings (not enums) — labels are resolved at render time.
export const REPORT_KEYS = ["pnl", "aging", "wallet", "cashflow"] as const
export type ReportKey = (typeof REPORT_KEYS)[number]
