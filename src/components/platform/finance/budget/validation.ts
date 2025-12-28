/**
 * Budget Module - Validation Schemas
 *
 * TODO: Will use Prisma BudgetStatus enum when schema is added
 */

import { z } from "zod"

import { BudgetStatus } from "./config"

export const budgetSchema = z
  .object({
    name: z.string().min(1, "Budget name is required").max(200),
    fiscalYearId: z.string().min(1, "Fiscal year is required"),
    totalAmount: z.number().min(0, "Total amount must be non-negative"),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    status: z.enum(["DRAFT", "PENDING_APPROVAL", "APPROVED", "ACTIVE", "CLOSED"]).default("DRAFT"),
    description: z.string().max(500).optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must be on or after start date",
  })

export const budgetAllocationSchema = z.object({
  budgetId: z.string().min(1, "Budget is required"),
  categoryId: z.string().min(1, "Category is required"),
  allocatedAmount: z.number().min(0.01, "Amount must be greater than 0"),
  description: z.string().max(500).optional(),
})

export const budgetFilterSchema = z.object({
  status: z.enum(["DRAFT", "PENDING_APPROVAL", "APPROVED", "ACTIVE", "CLOSED"]).optional(),
  fiscalYearId: z.string().optional(),
  search: z.string().optional(),
})
