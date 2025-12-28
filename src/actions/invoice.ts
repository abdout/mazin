"use server"

import { db } from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { InvoiceStatus } from "@prisma/client"
import type { Locale } from "@/components/internationalization"

const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.coerce.number().int().positive("Quantity must be positive"),
  unitPrice: z.coerce.number().positive("Unit price must be positive"),
})

const createInvoiceSchema = z.object({
  shipmentId: z.string().optional(),
  currency: z.enum(["SDG", "USD", "SAR"]),
  dueDate: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
})

export async function createInvoice(formData: z.input<typeof createInvoiceSchema>) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const validated = createInvoiceSchema.parse(formData)

  // Calculate totals
  const subtotal = validated.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  )
  const tax = subtotal * 0.15 // 15% VAT
  const total = subtotal + tax

  // Generate invoice number
  const count = await db.invoice.count()
  const invoiceNumber = `INV-${String(count + 1).padStart(5, "0")}`

  const invoice = await db.invoice.create({
    data: {
      invoiceNumber,
      userId: session.user.id,
      shipmentId: validated.shipmentId || null,
      currency: validated.currency,
      subtotal,
      tax,
      total,
      dueDate: validated.dueDate,
      notes: validated.notes,
      items: {
        create: validated.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
        })),
      },
    },
    include: { items: true },
  })

  revalidatePath("/invoice")
  return invoice
}

export async function getInvoices(filters?: { status?: InvoiceStatus }) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  return db.invoice.findMany({
    where: {
      userId: session.user.id,
      ...(filters?.status && { status: filters.status }),
    },
    include: { items: true, shipment: true },
    orderBy: { createdAt: "desc" },
  })
}

export async function getInvoice(id: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  return db.invoice.findFirst({
    where: { id, userId: session.user.id },
    include: { items: true, shipment: true },
  })
}

export async function updateInvoiceStatus(id: string, status: InvoiceStatus) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const invoice = await db.invoice.update({
    where: { id },
    data: {
      status,
      ...(status === "PAID" && { paidAt: new Date() }),
    },
  })

  revalidatePath("/invoice")
  revalidatePath(`/invoice/${id}`)
  return invoice
}

export async function deleteInvoice(id: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  await db.invoice.delete({ where: { id } })
  revalidatePath("/invoice")
}

// Update invoice schema - includes optional item IDs for existing items
const updateInvoiceItemSchema = z.object({
  id: z.string().optional(), // Existing item ID
  description: z.string().min(1, "Description is required"),
  quantity: z.coerce.number().int().positive("Quantity must be positive"),
  unitPrice: z.coerce.number().positive("Unit price must be positive"),
})

const updateInvoiceSchema = z.object({
  shipmentId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  currency: z.enum(["SDG", "USD", "SAR"]),
  dueDate: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
  notes: z.string().optional().nullable(),
  items: z.array(updateInvoiceItemSchema).min(1, "At least one item is required"),
})

export async function updateInvoice(
  id: string,
  formData: z.input<typeof updateInvoiceSchema>
) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  // Verify ownership and get existing invoice
  const existingInvoice = await db.invoice.findFirst({
    where: { id, userId: session.user.id },
    include: { items: true },
  })

  if (!existingInvoice) {
    throw new Error("Invoice not found")
  }

  // Business rule: Cannot edit PAID or CANCELLED invoices
  if (existingInvoice.status === "PAID" || existingInvoice.status === "CANCELLED") {
    throw new Error("Cannot edit a paid or cancelled invoice")
  }

  const validated = updateInvoiceSchema.parse(formData)

  // Calculate totals
  const subtotal = validated.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  )
  const tax = subtotal * 0.15
  const total = subtotal + tax

  // Determine which items to delete (those in DB but not in new list)
  const newItemIds = validated.items
    .filter(i => i.id)
    .map(i => i.id!)
  const itemsToDelete = existingInvoice.items
    .filter(i => !newItemIds.includes(i.id))
    .map(i => i.id)

  // Use transaction for atomic update
  const invoice = await db.$transaction(async (tx) => {
    // Delete removed items
    if (itemsToDelete.length > 0) {
      await tx.invoiceItem.deleteMany({
        where: { id: { in: itemsToDelete } },
      })
    }

    // Update existing items and create new ones
    for (const item of validated.items) {
      if (item.id) {
        // Update existing item
        await tx.invoiceItem.update({
          where: { id: item.id },
          data: {
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
          },
        })
      } else {
        // Create new item
        await tx.invoiceItem.create({
          data: {
            invoiceId: id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
          },
        })
      }
    }

    // Update invoice totals and other fields
    return tx.invoice.update({
      where: { id },
      data: {
        shipmentId: validated.shipmentId || null,
        clientId: validated.clientId || null,
        currency: validated.currency,
        subtotal,
        tax,
        total,
        dueDate: validated.dueDate,
        notes: validated.notes,
      },
      include: { items: true },
    })
  })

  revalidatePath("/invoice")
  revalidatePath(`/invoice/${id}`)
  return invoice
}

export async function getInvoiceWithSettings(id: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const invoice = await db.invoice.findFirst({
    where: { id, userId: session.user.id },
    include: { items: true, shipment: true, client: true },
  })

  if (!invoice) {
    throw new Error("Invoice not found")
  }

  const settings = await db.companySettings.findUnique({
    where: { userId: session.user.id },
  })

  return { invoice, settings }
}

export async function getCompanySettings() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  return db.companySettings.findUnique({
    where: { userId: session.user.id },
  })
}

export async function sendInvoiceEmail(
  invoiceId: string,
  recipientEmail: string,
  locale: Locale,
  customMessage?: string
) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  // Get invoice with relations
  const invoice = await db.invoice.findFirst({
    where: { id: invoiceId, userId: session.user.id },
    include: { items: true, client: true, shipment: true },
  })

  if (!invoice) {
    throw new Error("Invoice not found")
  }

  // Get company settings
  const settings = await db.companySettings.findUnique({
    where: { userId: session.user.id },
  })

  const companyName = settings?.companyName || "Mazin Customs Clearance"

  // Import email utilities dynamically to avoid bundling issues
  const { resend, FROM_EMAIL } = await import("@/lib/resend")
  const { generateInvoiceEmailHtml, getInvoiceEmailSubject } = await import(
    "@/emails/invoice-email"
  )

  // Format date
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "-"
    return new Date(date).toLocaleDateString(
      locale === "ar" ? "ar-SA" : "en-US",
      { year: "numeric", month: "long", day: "numeric" }
    )
  }

  // Format currency
  const formatAmount = (amount: number | string | { toString(): string }) => {
    const num = typeof amount === "number" ? amount : parseFloat(String(amount))
    return num.toLocaleString(locale === "ar" ? "ar-SA" : "en-US", {
      minimumFractionDigits: 2,
    })
  }

  // Build invoice URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mazin.sd"
  const invoiceUrl = `${baseUrl}/${locale}/invoice/${invoiceId}`

  // Generate email content
  const recipientName = invoice.client?.contactName || invoice.client?.companyName || recipientEmail
  const emailHtml = generateInvoiceEmailHtml({
    recipientName,
    invoiceNumber: invoice.invoiceNumber,
    dueDate: formatDate(invoice.dueDate),
    total: formatAmount(invoice.total),
    currency: invoice.currency,
    invoiceUrl,
    companyName,
    locale,
    message: customMessage,
  })

  const subject = getInvoiceEmailSubject(invoice.invoiceNumber, companyName, locale)

  // Send email
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: recipientEmail,
    subject,
    html: emailHtml,
  })

  if (error) {
    console.error("Failed to send invoice email:", error)
    throw new Error(`Failed to send email: ${error.message}`)
  }

  // Update invoice status to SENT if it was DRAFT
  if (invoice.status === "DRAFT") {
    await db.invoice.update({
      where: { id: invoiceId },
      data: { status: "SENT" },
    })
    revalidatePath("/invoice")
    revalidatePath(`/invoice/${invoiceId}`)
  }

  return { success: true, messageId: data?.id }
}
