/**
 * Port Sudan demurrage calculation.
 *
 * Free time (default 14 days) starts from the demurrage start date (usually
 * vessel arrival + container unloading). After the free window expires, the
 * shipper owes a per-day rate until cargo is released.
 */

export interface DemurrageInput {
  demurrageStartDate: Date | null | undefined
  freeDays: number
  demurrageDailyRate: number | null | undefined
  now?: Date
}

export interface DemurrageResult {
  daysElapsed: number
  freeDaysRemaining: number
  chargeableDays: number
  amount: number
  inFreeWindow: boolean
}

export function calculateDemurrage(input: DemurrageInput): DemurrageResult {
  const now = input.now ?? new Date()
  const rate = input.demurrageDailyRate ?? 0
  const freeDays = Math.max(0, input.freeDays ?? 0)

  if (!input.demurrageStartDate) {
    return { daysElapsed: 0, freeDaysRemaining: freeDays, chargeableDays: 0, amount: 0, inFreeWindow: true }
  }

  const msPerDay = 1000 * 60 * 60 * 24
  const daysElapsed = Math.max(0, Math.floor((now.getTime() - input.demurrageStartDate.getTime()) / msPerDay))
  const chargeableDays = Math.max(0, daysElapsed - freeDays)
  const freeDaysRemaining = Math.max(0, freeDays - daysElapsed)

  return {
    daysElapsed,
    freeDaysRemaining,
    chargeableDays,
    amount: chargeableDays * rate,
    inFreeWindow: chargeableDays === 0,
  }
}
