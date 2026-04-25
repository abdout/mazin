// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Ordered options for the fee-type dropdown. Kept in code (not dict) so the
// Zod enum stays in sync; labels are resolved via dictionary at render time.
export const FEE_TYPES = [
  "CLEARANCE_SERVICE",
  "DOCUMENTATION",
  "CUSTOMS_DUTY",
  "PORT_CHARGE",
  "TERMINAL_CHARGE",
  "TRANSPORTATION",
  "INSPECTION",
  "STORAGE",
  "DEMURRAGE",
  "HANDLING",
  "OTHER",
] as const

export const CALC_TYPES = [
  "FIXED",
  "PERCENTAGE_OF_VALUE",
  "PER_UNIT",
  "PER_CONTAINER",
  "PER_WEIGHT",
  "TIERED",
] as const
