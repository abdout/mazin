import { z } from "zod"
import { validateContainerNumber } from "@/lib/validation/customs-refs"

export const shipmentIntakeSchema = z.object({
  // Cargo
  type: z.enum(["IMPORT", "EXPORT"]),
  description: z.string().min(1, "Description is required"),
  weight: z.coerce.number().positive().optional(),
  quantity: z.coerce.number().int().positive().optional(),
  // ISO 6346 check-digit-validated. Empty string allowed (optional field on intake).
  containerNumber: z
    .string()
    .optional()
    .refine(
      (v) => !v || validateContainerNumber(v),
      "Invalid ISO 6346 container number (check digit mismatch)"
    ),
  vesselName: z.string().optional(),

  // Parties
  consignor: z.string().min(1, "Shipper is required"),
  consignee: z.string().min(1, "Consignee is required"),

  // Dates
  arrivalDate: z.coerce.date().optional(),
  departureDate: z.coerce.date().optional(),

  // Demurrage
  freeDays: z.coerce.number().int().min(0).default(14),
  demurrageDailyRate: z.coerce.number().nonnegative().optional(),

  // Associations
  clientId: z.string().cuid().optional(),
  projectId: z.string().cuid().optional(),

  publicTrackingEnabled: z.boolean().default(true),
})

export type ShipmentIntakeData = z.input<typeof shipmentIntakeSchema>

export const stageTransitionSchema = z.object({
  shipmentId: z.string().cuid(),
  stageType: z.enum([
    "PRE_ARRIVAL_DOCS",
    "VESSEL_ARRIVAL",
    "CUSTOMS_DECLARATION",
    "CUSTOMS_PAYMENT",
    "INSPECTION",
    "PORT_FEES",
    "QUALITY_STANDARDS",
    "RELEASE",
    "LOADING",
    "IN_TRANSIT",
    "DELIVERED",
  ]),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "SKIPPED"]),
  notes: z.string().max(2000).optional(),
})

export type StageTransitionData = z.input<typeof stageTransitionSchema>
