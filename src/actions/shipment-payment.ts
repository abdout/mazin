"use server"

import { db } from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { PaymentPayee, ShipmentPaymentStatus, TrackingStageType } from "@prisma/client"

const createPaymentSchema = z.object({
  shipmentId: z.string(),
  payee: z.enum([
    "CUSTOMS",
    "SEA_PORTS",
    "SHIPPING_LINE",
    "SSMO",
    "MINISTRY_OF_TRADE",
    "TRANSPORT",
    "CLEARING_AGENT",
    "OTHER",
  ]),
  payeeName: z.string().optional(),
  amount: z.coerce.number().positive(),
  currency: z.string().default("SDG"),
  method: z
    .enum(["CASH", "BANK_TRANSFER", "CHECK", "CREDIT_CARD", "MOBILE_PAYMENT"])
    .optional(),
  referenceNo: z.string().optional(),
  receiptNo: z.string().optional(),
  dueDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  paidDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  stageType: z
    .enum([
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
    ])
    .optional(),
  documentUrl: z.string().optional(),
  notes: z.string().optional(),
})

const updatePaymentSchema = createPaymentSchema.partial().omit({ shipmentId: true })

function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0
  if (typeof value === "number") return value
  return parseFloat(String(value))
}

export async function createShipmentPayment(
  data: z.input<typeof createPaymentSchema>
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const validated = createPaymentSchema.parse(data)

  const shipment = await db.shipment.findFirst({
    where: { id: validated.shipmentId, userId: session.user.id },
  })
  if (!shipment) throw new Error("Shipment not found")

  const status: ShipmentPaymentStatus = validated.paidDate ? "PAID" : "PENDING"

  const payment = await db.shipmentPayment.create({
    data: {
      payee: validated.payee as PaymentPayee,
      payeeName: validated.payeeName,
      amount: validated.amount,
      currency: validated.currency,
      method: validated.method,
      referenceNo: validated.referenceNo,
      receiptNo: validated.receiptNo,
      dueDate: validated.dueDate,
      paidDate: validated.paidDate,
      stageType: validated.stageType as TrackingStageType | undefined,
      documentUrl: validated.documentUrl,
      notes: validated.notes,
      status,
      shipmentId: validated.shipmentId,
      userId: session.user.id,
    },
  })

  revalidatePath(`/project`)
  return payment
}

export async function getShipmentPayments(shipmentId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const shipment = await db.shipment.findFirst({
    where: { id: shipmentId, userId: session.user.id },
  })
  if (!shipment) throw new Error("Shipment not found")

  const payments = await db.shipmentPayment.findMany({
    where: { shipmentId },
    orderBy: { createdAt: "asc" },
  })

  return payments.map((p) => ({
    ...p,
    amount: toNumber(p.amount),
  }))
}

export async function getPaymentSummary(shipmentId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const payments = await db.shipmentPayment.findMany({
    where: {
      shipmentId,
      shipment: { userId: session.user.id },
    },
  })

  const byPayee: Record<string, { total: number; paid: number; pending: number; count: number }> = {}
  let totalAmount = 0
  let totalPaid = 0
  let totalPending = 0

  for (const p of payments) {
    const amount = toNumber(p.amount)
    const isPaid = p.status === "PAID" || p.status === "CONFIRMED"

    if (!byPayee[p.payee]) {
      byPayee[p.payee] = { total: 0, paid: 0, pending: 0, count: 0 }
    }

    const entry = byPayee[p.payee]!
    entry.total += amount
    entry.count++
    if (isPaid) {
      entry.paid += amount
      totalPaid += amount
    } else {
      entry.pending += amount
      totalPending += amount
    }
    totalAmount += amount
  }

  return {
    totalAmount: Math.round(totalAmount * 100) / 100,
    totalPaid: Math.round(totalPaid * 100) / 100,
    totalPending: Math.round(totalPending * 100) / 100,
    paymentCount: payments.length,
    byPayee,
  }
}

export async function updateShipmentPayment(
  paymentId: string,
  data: z.input<typeof updatePaymentSchema>
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const payment = await db.shipmentPayment.findFirst({
    where: { id: paymentId, userId: session.user.id },
  })
  if (!payment) throw new Error("Payment not found")

  const validated = updatePaymentSchema.parse(data)
  const updateData: Record<string, unknown> = {}

  if (validated.payee !== undefined) updateData.payee = validated.payee
  if (validated.payeeName !== undefined) updateData.payeeName = validated.payeeName
  if (validated.amount !== undefined) updateData.amount = validated.amount
  if (validated.currency !== undefined) updateData.currency = validated.currency
  if (validated.method !== undefined) updateData.method = validated.method
  if (validated.referenceNo !== undefined) updateData.referenceNo = validated.referenceNo
  if (validated.receiptNo !== undefined) updateData.receiptNo = validated.receiptNo
  if (validated.dueDate !== undefined) updateData.dueDate = validated.dueDate
  if (validated.paidDate !== undefined) updateData.paidDate = validated.paidDate
  if (validated.stageType !== undefined) updateData.stageType = validated.stageType
  if (validated.documentUrl !== undefined) updateData.documentUrl = validated.documentUrl
  if (validated.notes !== undefined) updateData.notes = validated.notes

  if (validated.paidDate && payment.status === "PENDING") {
    updateData.status = "PAID"
  }

  const updated = await db.shipmentPayment.update({
    where: { id: paymentId },
    data: updateData,
  })

  revalidatePath(`/project`)
  return updated
}

export async function markPaymentConfirmed(paymentId: string, receiptNo?: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const payment = await db.shipmentPayment.findFirst({
    where: { id: paymentId, userId: session.user.id },
  })
  if (!payment) throw new Error("Payment not found")

  const updated = await db.shipmentPayment.update({
    where: { id: paymentId },
    data: {
      status: "CONFIRMED",
      receiptNo: receiptNo ?? payment.receiptNo,
      paidDate: payment.paidDate ?? new Date(),
    },
  })

  revalidatePath(`/project`)
  return updated
}

export async function deleteShipmentPayment(paymentId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const payment = await db.shipmentPayment.findFirst({
    where: { id: paymentId, userId: session.user.id },
  })
  if (!payment) throw new Error("Payment not found")

  await db.shipmentPayment.delete({ where: { id: paymentId } })
  revalidatePath(`/project`)
}
