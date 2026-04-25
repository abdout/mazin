import { z } from "zod"

export const acdSchema = z.object({
  shipmentId: z.string().cuid(),
  consignor: z.string().min(1),
  consignee: z.string().min(1),
  hsCode: z.string().min(1),
  cargoDescription: z.string().min(1),
  estimatedWeight: z.coerce.number().positive(),
  quantity: z.coerce.number().int().positive().optional(),
  vesselName: z.string().min(1),
  voyageNumber: z.string().optional(),
  portOfLoading: z.string().min(1),
  portOfDischarge: z.string().default("Port Sudan"),
  estimatedArrival: z.coerce.date(),
})

export type AcdData = z.input<typeof acdSchema>

export const ACD_MIN_DAYS_BEFORE_ARRIVAL = 5

/**
 * Sudanese customs rule (mandatory Jan 2026): the ACD must be filed at least
 * 5 days before the vessel arrives. Returns null if OK, or an error message.
 */
export function validateAcdPreArrival(
  estimatedArrival: Date,
  now: Date = new Date()
): string | null {
  const msPerDay = 1000 * 60 * 60 * 24
  const daysUntilArrival = (estimatedArrival.getTime() - now.getTime()) / msPerDay
  if (daysUntilArrival < ACD_MIN_DAYS_BEFORE_ARRIVAL) {
    return `ACD must be filed at least ${ACD_MIN_DAYS_BEFORE_ARRIVAL} days before vessel arrival (got ${daysUntilArrival.toFixed(1)} days).`
  }
  return null
}
