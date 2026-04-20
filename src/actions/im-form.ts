"use server"

import { db } from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const createIMFormSchema = z.object({
  shipmentId: z.string(),
  imNumber: z.string().min(1),
  bankName: z.string().min(1),
  bankBranch: z.string().optional(),
  bankContactPerson: z.string().optional(),
  approvedAmount: z.coerce.number().positive(),
  currency: z.string().default("USD"),
  exchangeRate: z.coerce.number().positive().optional(),
  proformaInvoiceValue: z.coerce.number().positive(),
  proformaInvoiceRef: z.string().optional(),
  commercialInvoiceValue: z.coerce.number().positive().optional(),
  commercialInvoiceRef: z.string().optional(),
  issueDate: z.string().transform((val) => new Date(val)),
  expiryDate: z.string().transform((val) => new Date(val)),
  notes: z.string().optional(),
})

const updateIMFormSchema = createIMFormSchema.partial().omit({ shipmentId: true })

function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0
  if (typeof value === "number") return value
  return parseFloat(String(value))
}

export async function createIMForm(data: z.input<typeof createIMFormSchema>) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const validated = createIMFormSchema.parse(data)

  const shipment = await db.shipment.findFirst({
    where: { id: validated.shipmentId, userId: session.user.id },
  })
  if (!shipment) throw new Error("Shipment not found")

  const imForm = await db.iMForm.create({
    data: {
      imNumber: validated.imNumber,
      bankName: validated.bankName,
      bankBranch: validated.bankBranch,
      bankContactPerson: validated.bankContactPerson,
      approvedAmount: validated.approvedAmount,
      currency: validated.currency,
      exchangeRate: validated.exchangeRate,
      proformaInvoiceValue: validated.proformaInvoiceValue,
      proformaInvoiceRef: validated.proformaInvoiceRef,
      commercialInvoiceValue: validated.commercialInvoiceValue,
      commercialInvoiceRef: validated.commercialInvoiceRef,
      issueDate: validated.issueDate,
      expiryDate: validated.expiryDate,
      notes: validated.notes,
      shipmentId: validated.shipmentId,
      createdById: session.user.id,
    },
  })

  revalidatePath(`/project`)
  return imForm
}

export async function getIMForms(shipmentId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const shipment = await db.shipment.findFirst({
    where: { id: shipmentId, userId: session.user.id },
  })
  if (!shipment) throw new Error("Shipment not found")

  const forms = await db.iMForm.findMany({
    where: { shipmentId },
    orderBy: { createdAt: "desc" },
  })

  return forms.map((f) => ({
    ...f,
    approvedAmount: toNumber(f.approvedAmount),
    exchangeRate: toNumber(f.exchangeRate),
    proformaInvoiceValue: toNumber(f.proformaInvoiceValue),
    commercialInvoiceValue: toNumber(f.commercialInvoiceValue),
  }))
}

export async function getIMForm(imFormId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const form = await db.iMForm.findFirst({
    where: { id: imFormId, shipment: { userId: session.user.id } },
    include: {
      shipment: {
        select: { shipmentNumber: true, consignee: true },
      },
    },
  })

  if (!form) throw new Error("IM Form not found")

  return {
    ...form,
    approvedAmount: toNumber(form.approvedAmount),
    exchangeRate: toNumber(form.exchangeRate),
    proformaInvoiceValue: toNumber(form.proformaInvoiceValue),
    commercialInvoiceValue: toNumber(form.commercialInvoiceValue),
  }
}

export async function updateIMForm(
  imFormId: string,
  data: z.input<typeof updateIMFormSchema>
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const form = await db.iMForm.findFirst({
    where: { id: imFormId, shipment: { userId: session.user.id } },
  })
  if (!form) throw new Error("IM Form not found")

  const validated = updateIMFormSchema.parse(data)
  const updateData: Record<string, unknown> = {}

  if (validated.imNumber !== undefined) updateData.imNumber = validated.imNumber
  if (validated.bankName !== undefined) updateData.bankName = validated.bankName
  if (validated.bankBranch !== undefined) updateData.bankBranch = validated.bankBranch
  if (validated.bankContactPerson !== undefined) updateData.bankContactPerson = validated.bankContactPerson
  if (validated.approvedAmount !== undefined) updateData.approvedAmount = validated.approvedAmount
  if (validated.currency !== undefined) updateData.currency = validated.currency
  if (validated.exchangeRate !== undefined) updateData.exchangeRate = validated.exchangeRate
  if (validated.proformaInvoiceValue !== undefined) updateData.proformaInvoiceValue = validated.proformaInvoiceValue
  if (validated.proformaInvoiceRef !== undefined) updateData.proformaInvoiceRef = validated.proformaInvoiceRef
  if (validated.commercialInvoiceValue !== undefined) updateData.commercialInvoiceValue = validated.commercialInvoiceValue
  if (validated.commercialInvoiceRef !== undefined) updateData.commercialInvoiceRef = validated.commercialInvoiceRef
  if (validated.issueDate !== undefined) updateData.issueDate = validated.issueDate
  if (validated.expiryDate !== undefined) updateData.expiryDate = validated.expiryDate
  if (validated.notes !== undefined) updateData.notes = validated.notes

  // Auto-detect value mismatch
  const proforma = validated.proformaInvoiceValue ?? toNumber(form.proformaInvoiceValue)
  const commercial = validated.commercialInvoiceValue ?? toNumber(form.commercialInvoiceValue)
  if (proforma > 0 && commercial > 0) {
    const variance = Math.abs(commercial - proforma) / proforma
    if (variance > 0.05) {
      updateData.status = "VALUE_MISMATCH"
    }
  }

  // Auto-detect expiry
  const expiryDate = validated.expiryDate ?? form.expiryDate
  if (new Date() > new Date(expiryDate)) {
    updateData.status = "EXPIRED"
  }

  const updated = await db.iMForm.update({
    where: { id: imFormId },
    data: updateData,
  })

  revalidatePath(`/project`)
  return updated
}

export async function deleteIMForm(imFormId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const form = await db.iMForm.findFirst({
    where: { id: imFormId, shipment: { userId: session.user.id } },
  })
  if (!form) throw new Error("IM Form not found")

  await db.iMForm.delete({ where: { id: imFormId } })
  revalidatePath(`/project`)
}

export async function checkIMFormExpiry() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const expiredForms = await db.iMForm.updateMany({
    where: {
      status: "ACTIVE",
      expiryDate: { lt: new Date() },
      shipment: { userId: session.user.id },
    },
    data: { status: "EXPIRED" },
  })

  revalidatePath(`/project`)
  return { expiredCount: expiredForms.count }
}
