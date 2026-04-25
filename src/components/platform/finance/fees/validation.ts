// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

const feeTypeEnum = z.enum([
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
] as const)

const calcTypeEnum = z.enum([
  "FIXED",
  "PERCENTAGE_OF_VALUE",
  "PER_UNIT",
  "PER_CONTAINER",
  "PER_WEIGHT",
  "TIERED",
] as const)

const moneyAmount = z.number().min(0).max(100_000_000).optional().nullable()
const percentage = z.number().min(0).max(100).optional().nullable()

export const createFeeTemplateSchema = z
  .object({
    code: z.string().trim().min(1).max(32),
    name: z.string().trim().min(1).max(120),
    nameAr: z.string().trim().max(120).optional().or(z.literal("")),
    description: z.string().trim().max(500).optional().or(z.literal("")),
    feeType: feeTypeEnum,
    calculationType: calcTypeEnum.default("FIXED"),
    amount: moneyAmount,
    percentage,
    minAmount: moneyAmount,
    maxAmount: moneyAmount,
    isGovernmentFee: z.boolean().default(false),
    isTaxable: z.boolean().default(false),
    taxRate: percentage,
    isActive: z.boolean().default(true),
  })
  .superRefine((val, ctx) => {
    // FIXED templates need an amount; PERCENTAGE_OF_VALUE needs a percentage.
    // Other calc types are kept flexible so the template can be built for
    // tiered / per-unit pricing without forcing a shape here.
    if (val.calculationType === "FIXED") {
      if (val.amount === undefined || val.amount === null) {
        ctx.addIssue({
          code: "custom",
          path: ["amount"],
          message: "Fixed-fee templates require an amount.",
        })
      }
    }
    if (val.calculationType === "PERCENTAGE_OF_VALUE") {
      if (val.percentage === undefined || val.percentage === null) {
        ctx.addIssue({
          code: "custom",
          path: ["percentage"],
          message: "Percentage-fee templates require a percentage.",
        })
      }
    }
    if (
      val.minAmount !== undefined &&
      val.minAmount !== null &&
      val.maxAmount !== undefined &&
      val.maxAmount !== null &&
      val.maxAmount < val.minAmount
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["maxAmount"],
        message: "Max must be greater than min.",
      })
    }
  })

export type CreateFeeTemplateInput = z.infer<typeof createFeeTemplateSchema>
