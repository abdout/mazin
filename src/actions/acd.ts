"use server"

import { db } from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// ============================================
// Validation Schemas
// ============================================

const createACDSchema = z.object({
  shipmentId: z.string().min(1, "Shipment ID is required"),
  consignee: z.string().min(1, "Consignee is required"),
  consignor: z.string().min(1, "Consignor is required"),
  hsCode: z.string().min(1, "HS Code is required"),
  cargoDescription: z.string().min(1, "Cargo description is required"),
  estimatedWeight: z.coerce.number().positive("Estimated weight must be positive"),
  quantity: z.coerce.number().int().positive().optional(),
  vesselName: z.string().min(1, "Vessel name is required"),
  voyageNumber: z.string().optional(),
  portOfLoading: z.string().min(1, "Port of loading is required"),
  portOfDischarge: z.string().default("Port Sudan"),
  estimatedArrival: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
})

// ============================================
// Helper: Generate ACN Number
// ============================================

/**
 * Generate a unique ACN reference: ACN-{YYYYMM}-{5-digit-sequence}
 * Example: ACN-202601-00001
 */
async function generateACNNumber(): Promise<string> {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const prefix = `ACN-${year}${month}-`

  // Find the latest ACN in the current month
  const latest = await db.advanceCargoDeclaration.findFirst({
    where: {
      acnNumber: { startsWith: prefix },
    },
    orderBy: { acnNumber: "desc" },
    select: { acnNumber: true },
  })

  let sequence = 1
  if (latest) {
    const parts = latest.acnNumber.split("-")
    const sequencePart = parts[2]
    if (sequencePart) {
      const lastSequence = parseInt(sequencePart, 10)
      if (!isNaN(lastSequence)) {
        sequence = lastSequence + 1
      }
    }
  }

  return `${prefix}${String(sequence).padStart(5, "0")}`
}

// ============================================
// Server Actions
// ============================================

/**
 * Create an Advance Cargo Declaration (ACD)
 * Required before cargo loading at origin (Sudan law, mandatory Jan 2026)
 */
export async function createACD(data: z.input<typeof createACDSchema>) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const validated = createACDSchema.parse(data)

  // Verify shipment exists and user has access
  const shipment = await db.shipment.findFirst({
    where: {
      id: validated.shipmentId,
      userId: session.user.id,
    },
  })

  if (!shipment) {
    throw new Error("Shipment not found or access denied")
  }

  // Generate unique ACN number
  const acnNumber = await generateACNNumber()

  const acd = await db.advanceCargoDeclaration.create({
    data: {
      acnNumber,
      consignee: validated.consignee,
      consignor: validated.consignor,
      hsCode: validated.hsCode,
      cargoDescription: validated.cargoDescription,
      estimatedWeight: validated.estimatedWeight,
      quantity: validated.quantity,
      vesselName: validated.vesselName,
      voyageNumber: validated.voyageNumber,
      portOfLoading: validated.portOfLoading,
      portOfDischarge: validated.portOfDischarge,
      estimatedArrival: validated.estimatedArrival,
      shipmentId: validated.shipmentId,
      userId: session.user.id,
    },
    include: {
      shipment: {
        select: {
          shipmentNumber: true,
          trackingNumber: true,
        },
      },
    },
  })

  revalidatePath("/shipments")
  revalidatePath(`/shipments/${validated.shipmentId}`)

  return acd
}

/**
 * Get ACD details with validation status
 */
export async function getACD(acdId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const acd = await db.advanceCargoDeclaration.findFirst({
    where: {
      id: acdId,
      userId: session.user.id,
    },
    include: {
      shipment: {
        select: {
          id: true,
          shipmentNumber: true,
          trackingNumber: true,
          arrivalDate: true,
          status: true,
          vesselName: true,
        },
      },
    },
  })

  if (!acd) {
    throw new Error("ACD not found")
  }

  // Calculate validation eligibility
  let canValidate = false
  let daysUntilArrival: number | null = null

  if (acd.shipment.arrivalDate) {
    const now = new Date()
    const arrival = new Date(acd.shipment.arrivalDate)
    const diffMs = arrival.getTime() - now.getTime()
    daysUntilArrival = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    canValidate = daysUntilArrival >= 5 && acd.status === "SUBMITTED"
  }

  return {
    ...acd,
    validationInfo: {
      canValidate,
      daysUntilArrival,
      isValidated: acd.status === "VALIDATED",
      validatedAt: acd.validatedAt,
      validatedBy: acd.validatedBy,
    },
  }
}

/**
 * Validate an ACD (must be done at least 5 days before vessel arrival)
 * ACD must be in SUBMITTED status to be validated
 */
export async function validateACD(acdId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const acd = await db.advanceCargoDeclaration.findFirst({
    where: {
      id: acdId,
      userId: session.user.id,
    },
    include: {
      shipment: {
        select: {
          arrivalDate: true,
        },
      },
    },
  })

  if (!acd) {
    throw new Error("ACD not found")
  }

  if (acd.status !== "SUBMITTED") {
    throw new Error(
      `ACD must be in SUBMITTED status to validate. Current status: ${acd.status}`
    )
  }

  if (!acd.shipment.arrivalDate) {
    throw new Error(
      "Cannot validate ACD: shipment arrival date is not set"
    )
  }

  // Check the 5-day-before-arrival rule
  const now = new Date()
  const arrival = new Date(acd.shipment.arrivalDate)
  const diffMs = arrival.getTime() - now.getTime()
  const daysUntilArrival = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (daysUntilArrival < 5) {
    return {
      success: false,
      error: `ACD must be validated at least 5 days before vessel arrival. Days remaining: ${daysUntilArrival}. Validation deadline has passed.`,
      daysUntilArrival,
      requiredDays: 5,
    }
  }

  const validated = await db.advanceCargoDeclaration.update({
    where: { id: acdId },
    data: {
      status: "VALIDATED",
      validatedAt: new Date(),
      validatedBy: session.user.id,
    },
  })

  revalidatePath("/shipments")
  revalidatePath(`/shipments/${acd.shipmentId}`)

  return {
    success: true,
    acd: validated,
    daysUntilArrival,
  }
}

/**
 * Submit an ACD (change from DRAFT to SUBMITTED)
 */
export async function submitACD(acdId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const acd = await db.advanceCargoDeclaration.findFirst({
    where: {
      id: acdId,
      userId: session.user.id,
    },
  })

  if (!acd) {
    throw new Error("ACD not found")
  }

  if (acd.status !== "DRAFT") {
    throw new Error(
      `ACD can only be submitted from DRAFT status. Current status: ${acd.status}`
    )
  }

  const submitted = await db.advanceCargoDeclaration.update({
    where: { id: acdId },
    data: { status: "SUBMITTED" },
  })

  revalidatePath("/shipments")
  revalidatePath(`/shipments/${acd.shipmentId}`)

  return submitted
}

/**
 * List ACDs, optionally filtered by shipment
 */
export async function listACDs(shipmentId?: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const where: { userId: string; shipmentId?: string } = {
    userId: session.user.id,
  }

  if (shipmentId) {
    where.shipmentId = shipmentId
  }

  return db.advanceCargoDeclaration.findMany({
    where,
    include: {
      shipment: {
        select: {
          id: true,
          shipmentNumber: true,
          trackingNumber: true,
          arrivalDate: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })
}

/**
 * Update an ACD (only if in DRAFT status)
 */
export async function updateACD(
  acdId: string,
  data: Partial<z.input<typeof createACDSchema>>
) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const existing = await db.advanceCargoDeclaration.findFirst({
    where: {
      id: acdId,
      userId: session.user.id,
    },
  })

  if (!existing) {
    throw new Error("ACD not found")
  }

  if (existing.status !== "DRAFT") {
    throw new Error(
      `ACD can only be edited in DRAFT status. Current status: ${existing.status}`
    )
  }

  const updateData: Record<string, unknown> = {}

  if (data.consignee !== undefined) updateData.consignee = data.consignee
  if (data.consignor !== undefined) updateData.consignor = data.consignor
  if (data.hsCode !== undefined) updateData.hsCode = data.hsCode
  if (data.cargoDescription !== undefined)
    updateData.cargoDescription = data.cargoDescription
  if (data.estimatedWeight !== undefined)
    updateData.estimatedWeight = data.estimatedWeight
  if (data.quantity !== undefined) updateData.quantity = data.quantity
  if (data.vesselName !== undefined) updateData.vesselName = data.vesselName
  if (data.voyageNumber !== undefined)
    updateData.voyageNumber = data.voyageNumber
  if (data.portOfLoading !== undefined)
    updateData.portOfLoading = data.portOfLoading
  if (data.portOfDischarge !== undefined)
    updateData.portOfDischarge = data.portOfDischarge
  if (data.estimatedArrival !== undefined)
    updateData.estimatedArrival = data.estimatedArrival
      ? new Date(data.estimatedArrival)
      : null

  const updated = await db.advanceCargoDeclaration.update({
    where: { id: acdId },
    data: updateData,
  })

  revalidatePath("/shipments")
  revalidatePath(`/shipments/${existing.shipmentId}`)

  return updated
}

/**
 * Delete an ACD (only if in DRAFT status)
 */
export async function deleteACD(acdId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const acd = await db.advanceCargoDeclaration.findFirst({
    where: {
      id: acdId,
      userId: session.user.id,
    },
  })

  if (!acd) {
    throw new Error("ACD not found")
  }

  if (acd.status !== "DRAFT") {
    throw new Error(
      `ACD can only be deleted in DRAFT status. Current status: ${acd.status}`
    )
  }

  await db.advanceCargoDeclaration.delete({
    where: { id: acdId },
  })

  revalidatePath("/shipments")
  revalidatePath(`/shipments/${acd.shipmentId}`)

  return { success: true }
}
