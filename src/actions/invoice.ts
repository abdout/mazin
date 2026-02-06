"use server"

import { db } from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { InvoiceStatus, InvoiceType, FeeCategory } from "@prisma/client"
import type { Locale } from "@/components/internationalization"
import {
  STAGE_FEE_TEMPLATES,
  FEE_CATEGORIES,
  VAT_RATE,
  QUICK_FEE_PRESETS,
  formatInvoiceNumber,
} from "@/components/platform/invoice/config"
import { numberToArabicWords } from "@/lib/utils/arabic-numbers"

// =============================================================================
// SCHEMAS
// =============================================================================

const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  descriptionAr: z.string().optional(),
  quantity: z.coerce.number().int().positive("Quantity must be positive"),
  unitPrice: z.coerce.number().positive("Unit price must be positive"),
  feeCategory: z.string().optional(),
  tariffCode: z.string().optional(),
  receiptNumber: z.string().optional(),
  sortOrder: z.coerce.number().optional(),
})

const createInvoiceSchema = z.object({
  shipmentId: z.string().optional(),
  clientId: z.string().optional(),
  currency: z.enum(["SDG", "USD", "SAR"]),
  invoiceType: z.enum(["CLEARANCE", "PROFORMA", "STATEMENT", "PORT"]).default("CLEARANCE"),
  dueDate: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
  notes: z.string().optional(),
  // Document references
  blNumber: z.string().optional(),
  containerNumbers: z.array(z.string()).optional(),
  deliveryOrderNo: z.string().optional(),
  declarationNo: z.string().optional(),
  vesselName: z.string().optional(),
  voyageNumber: z.string().optional(),
  commodityType: z.string().optional(),
  supplierName: z.string().optional(),
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
  const tax = subtotal * VAT_RATE // 17% VAT (Sudan standard)
  const total = subtotal + tax

  // Generate invoice number in format: sequence/YY (e.g., "1044/25")
  const count = await db.invoice.count({ where: { userId: session.user.id } })
  const invoiceNumber = formatInvoiceNumber(count + 1)

  // Generate Arabic amount in words
  const totalInWordsAr = numberToArabicWords(total, validated.currency)

  const invoice = await db.invoice.create({
    data: {
      invoiceNumber,
      userId: session.user.id,
      shipmentId: validated.shipmentId || null,
      clientId: validated.clientId || null,
      currency: validated.currency,
      invoiceType: validated.invoiceType as InvoiceType,
      subtotal,
      tax,
      taxRate: VAT_RATE * 100, // Store as percentage (17)
      total,
      totalInWordsAr,
      dueDate: validated.dueDate,
      notes: validated.notes,
      // Document references
      blNumber: validated.blNumber,
      containerNumbers: validated.containerNumbers || [],
      deliveryOrderNo: validated.deliveryOrderNo,
      declarationNo: validated.declarationNo,
      vesselName: validated.vesselName,
      voyageNumber: validated.voyageNumber,
      commodityType: validated.commodityType,
      supplierName: validated.supplierName,
      items: {
        create: validated.items.map((item, index) => ({
          description: item.description,
          descriptionAr: item.descriptionAr,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
          feeCategory: item.feeCategory as FeeCategory | undefined,
          tariffCode: item.tariffCode,
          receiptNumber: item.receiptNumber,
          sortOrder: item.sortOrder ?? index,
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
  const tax = subtotal * VAT_RATE // 17% VAT (Sudan standard)
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

// ============================================
// Stage Invoice Functions
// ============================================

const stageInvoiceSchema = z.object({
  shipmentId: z.string(),
  stageId: z.string(),
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
  items: z.array(invoiceItemSchema).optional(),
  currency: z.enum(["SDG", "USD", "SAR"]).default("SDG"),
  locale: z.enum(["en", "ar"]).default("ar"),
})

/**
 * Create an invoice for a specific tracking stage
 * Pre-populates with stage fee templates and links to the stage
 */
export async function createStageInvoice(
  formData: z.input<typeof stageInvoiceSchema>
) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const validated = stageInvoiceSchema.parse(formData)
  const userId = session.user.id

  // Get shipment details
  const shipment = await db.shipment.findFirst({
    where: { id: validated.shipmentId, userId },
    include: { client: true, project: true },
  })

  if (!shipment) {
    throw new Error("Shipment not found")
  }

  // Get stage to verify it exists
  const stage = await db.trackingStage.findFirst({
    where: { id: validated.stageId, shipmentId: validated.shipmentId },
  })

  if (!stage) {
    throw new Error("Stage not found")
  }

  // Get fee templates for this stage
  const templates = STAGE_FEE_TEMPLATES[validated.stageType]

  // Use provided items or fall back to templates
  const items =
    validated.items && validated.items.length > 0
      ? validated.items
      : templates.map((t) => ({
          description:
            validated.locale === "ar" ? t.descriptionAr : t.description,
          quantity: 1,
          unitPrice: t.defaultPrice,
        }))

  if (items.length === 0) {
    throw new Error("No items provided and no templates available for this stage")
  }

  // Calculate totals
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  )
  const tax = subtotal * VAT_RATE // 17% VAT (Sudan standard)
  const total = subtotal + tax

  // Generate invoice number in format: sequence/YY
  const count = await db.invoice.count({ where: { userId } })
  const invoiceNumber = formatInvoiceNumber(count + 1)

  // Use transaction to create invoice and link to stage
  const result = await db.$transaction(async (tx) => {
    // Create invoice
    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber,
        userId,
        shipmentId: validated.shipmentId,
        clientId: shipment.clientId,
        currency: validated.currency,
        subtotal,
        tax,
        total,
        notes: `Invoice for ${validated.stageType.replace(/_/g, " ")} stage`,
        items: {
          create: items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
            feeType: validated.stageType,
          })),
        },
      },
      include: { items: true },
    })

    // Create stage-invoice link
    await tx.stageInvoice.create({
      data: {
        shipmentId: validated.shipmentId,
        stage: validated.stageType,
        invoiceId: invoice.id,
        feeType: validated.stageType,
      },
    })

    // Mark stage as payment requested
    await tx.trackingStage.update({
      where: { id: validated.stageId },
      data: { paymentRequested: true },
    })

    return invoice
  })

  revalidatePath("/invoice")
  revalidatePath("/shipment")
  revalidatePath("/project")

  return result
}

/**
 * Mark a stage invoice as paid
 */
export async function markStagePaymentReceived(
  stageId: string,
  invoiceId: string
) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  await db.$transaction(async (tx) => {
    // Update invoice status
    await tx.invoice.update({
      where: { id: invoiceId, userId: session.user!.id },
      data: { status: "PAID", paidAt: new Date() },
    })

    // Update stage payment received
    await tx.trackingStage.update({
      where: { id: stageId },
      data: { paymentReceived: true },
    })
  })

  revalidatePath("/invoice")
  revalidatePath("/shipment")
  revalidatePath("/project")

  return { success: true }
}

/**
 * Get invoices for a specific shipment grouped by stage
 */
export async function getShipmentStageInvoices(shipmentId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const stageInvoices = await db.stageInvoice.findMany({
    where: { shipmentId },
    include: {
      invoice: {
        include: { items: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return stageInvoices
}

// =============================================================================
// QUICK INVOICE FUNCTIONS
// =============================================================================

const quickInvoiceSchema = z.object({
  shipmentId: z.string(),
  clientId: z.string().optional(),
  preset: z.enum(["BASIC_CLEARANCE", "FULL_CLEARANCE", "PORT_ONLY", "CUSTOMS_ONLY"]).optional(),
  feeCategories: z.array(z.string()).optional(),
  currency: z.enum(["SDG", "USD", "SAR"]).default("SDG"),
  customPrices: z.record(z.string(), z.number()).optional(),
})

/**
 * Create a quick invoice from fee presets or selected categories
 * Auto-populates document references from shipment
 */
export async function createQuickInvoice(
  formData: z.input<typeof quickInvoiceSchema>
) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const validated = quickInvoiceSchema.parse(formData)
  const userId = session.user.id

  // Get shipment with details
  const shipment = await db.shipment.findFirst({
    where: { id: validated.shipmentId, userId },
    include: { client: true },
  })

  if (!shipment) {
    throw new Error("Shipment not found")
  }

  // Determine fee categories to use
  let feeCategories: string[]
  if (validated.preset) {
    feeCategories = QUICK_FEE_PRESETS[validated.preset] as string[]
  } else if (validated.feeCategories?.length) {
    feeCategories = validated.feeCategories
  } else {
    feeCategories = QUICK_FEE_PRESETS.BASIC_CLEARANCE as string[]
  }

  // Build invoice items from fee categories
  const items = feeCategories.map((categoryKey, index) => {
    const config = FEE_CATEGORIES[categoryKey as FeeCategory]
    const customPrice = validated.customPrices?.[categoryKey]
    const price = customPrice ?? config?.defaultPrice ?? 0

    return {
      description: config?.en ?? categoryKey,
      descriptionAr: config?.ar ?? categoryKey,
      quantity: 1,
      unitPrice: price,
      total: price,
      feeCategory: categoryKey as FeeCategory,
      tariffCode: config?.tariffCode,
      sortOrder: index,
    }
  })

  // Filter out zero-price items unless explicitly included
  const nonZeroItems = items.filter(
    (item) => item.unitPrice > 0 || validated.customPrices?.[item.feeCategory as string]
  )

  if (nonZeroItems.length === 0) {
    throw new Error("No items with prices to invoice")
  }

  // Calculate totals
  const subtotal = nonZeroItems.reduce((sum, item) => sum + item.total, 0)
  const tax = subtotal * VAT_RATE
  const total = subtotal + tax

  // Generate invoice number
  const count = await db.invoice.count({ where: { userId } })
  const invoiceNumber = formatInvoiceNumber(count + 1)

  // Generate Arabic amount in words
  const totalInWordsAr = numberToArabicWords(total, validated.currency)

  // Create invoice
  const invoice = await db.invoice.create({
    data: {
      invoiceNumber,
      userId,
      shipmentId: validated.shipmentId,
      clientId: validated.clientId || shipment.clientId,
      currency: validated.currency,
      invoiceType: "CLEARANCE",
      subtotal,
      tax,
      taxRate: VAT_RATE * 100,
      total,
      totalInWordsAr,
      // Auto-populate from shipment
      containerNumbers: shipment.containerNumber ? [shipment.containerNumber] : [],
      vesselName: shipment.vesselName,
      commodityType: shipment.description,
      supplierName: shipment.client?.companyName,
      items: {
        create: nonZeroItems.map((item) => ({
          description: item.description,
          descriptionAr: item.descriptionAr,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
          feeCategory: item.feeCategory,
          tariffCode: item.tariffCode,
          sortOrder: item.sortOrder,
        })),
      },
    },
    include: { items: true },
  })

  revalidatePath("/invoice")
  return invoice
}

// =============================================================================
// STATEMENT OF ACCOUNT FUNCTIONS
// =============================================================================

const statementSchema = z.object({
  clientId: z.string(),
  periodStart: z.string().transform((val) => new Date(val)),
  periodEnd: z.string().transform((val) => new Date(val)),
  openingBalance: z.coerce.number().default(0),
  currency: z.enum(["SDG", "USD", "SAR"]).default("SDG"),
})

/**
 * Generate a Statement of Account for a client
 * Includes all invoices and payments within the period
 */
export async function generateStatementOfAccount(
  formData: z.input<typeof statementSchema>
) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const validated = statementSchema.parse(formData)
  const userId = session.user.id

  // Get client
  const client = await db.client.findFirst({
    where: { id: validated.clientId, userId },
  })

  if (!client) {
    throw new Error("Client not found")
  }

  // Get invoices for the period
  const invoices = await db.invoice.findMany({
    where: {
      userId,
      clientId: validated.clientId,
      createdAt: {
        gte: validated.periodStart,
        lte: validated.periodEnd,
      },
      status: { not: "CANCELLED" },
    },
    orderBy: { createdAt: "asc" },
  })

  // Build statement entries
  let runningBalance = validated.openingBalance
  const entries: Array<{
    entryDate: Date
    reference: string
    description: string
    descriptionAr: string
    debit: number
    credit: number
    balance: number
    invoiceId?: string
    sortOrder: number
  }> = []

  // Add invoice entries (debits)
  invoices.forEach((invoice, index) => {
    const amount = Number(invoice.total)
    runningBalance += amount
    entries.push({
      entryDate: invoice.createdAt,
      reference: invoice.invoiceNumber,
      description: `Invoice ${invoice.invoiceNumber}`,
      descriptionAr: `فاتورة رقم ${invoice.invoiceNumber}`,
      debit: amount,
      credit: 0,
      balance: runningBalance,
      invoiceId: invoice.id,
      sortOrder: index,
    })
  })

  // Calculate totals
  const totalDebits = entries.reduce((sum, e) => sum + e.debit, 0)
  const totalCredits = entries.reduce((sum, e) => sum + e.credit, 0)
  const closingBalance = validated.openingBalance + totalDebits - totalCredits

  // Generate statement number
  const year = new Date().getFullYear()
  const count = await db.statementOfAccount.count({
    where: { userId, createdAt: { gte: new Date(year, 0, 1) } },
  })
  const statementNumber = `SOA-${year}/${String(count + 1).padStart(3, "0")}`

  // Generate Arabic amount in words
  const closingBalanceInWordsAr = numberToArabicWords(
    Math.abs(closingBalance),
    validated.currency
  )

  // Create statement
  const statement = await db.statementOfAccount.create({
    data: {
      statementNumber,
      userId,
      clientId: validated.clientId,
      periodStart: validated.periodStart,
      periodEnd: validated.periodEnd,
      openingBalance: validated.openingBalance,
      totalDebits,
      totalCredits,
      closingBalance,
      closingBalanceInWordsAr,
      currency: validated.currency,
      entries: {
        create: entries.map((entry) => ({
          entryDate: entry.entryDate,
          reference: entry.reference,
          description: entry.description,
          descriptionAr: entry.descriptionAr,
          debit: entry.debit,
          credit: entry.credit,
          balance: entry.balance,
          invoiceId: entry.invoiceId,
          sortOrder: entry.sortOrder,
        })),
      },
    },
    include: { entries: true, client: true },
  })

  revalidatePath("/invoice")
  return statement
}

/**
 * Get statements of account for a client
 */
export async function getClientStatements(clientId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  return db.statementOfAccount.findMany({
    where: { userId: session.user.id, clientId },
    include: { entries: { orderBy: { sortOrder: "asc" } }, client: true },
    orderBy: { createdAt: "desc" },
  })
}

// =============================================================================
// WHATSAPP SHARE FUNCTIONS
// =============================================================================

/**
 * Generate a WhatsApp share link for an invoice
 */
export async function getInvoiceWhatsAppShareData(
  invoiceId: string,
  locale: Locale = "ar"
) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const invoice = await db.invoice.findFirst({
    where: { id: invoiceId, userId: session.user.id },
    include: { client: true, shipment: true },
  })

  if (!invoice) {
    throw new Error("Invoice not found")
  }

  // Format amount
  const total = Number(invoice.total)
  const formattedTotal = total.toLocaleString(locale === "ar" ? "ar-SA" : "en-US", {
    minimumFractionDigits: 2,
  })

  // Build message based on locale
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mazin.sd"
  const pdfUrl = `${baseUrl}/api/invoice/${invoiceId}/pdf?locale=${locale}`

  const messages = {
    ar: `السلام عليكم

فاتورة رقم: ${invoice.invoiceNumber}
${invoice.client ? `العميل: ${invoice.client.companyName}` : ""}
${invoice.blNumber ? `بوليصة الشحن: ${invoice.blNumber}` : ""}
المبلغ الإجمالي: ${formattedTotal} ${invoice.currency}

يمكنكم تحميل الفاتورة من الرابط:
${pdfUrl}

مع تحيات مازن للتخليص الجمركي`,

    en: `Hello,

Invoice No: ${invoice.invoiceNumber}
${invoice.client ? `Client: ${invoice.client.companyName}` : ""}
${invoice.blNumber ? `B/L No: ${invoice.blNumber}` : ""}
Total Amount: ${formattedTotal} ${invoice.currency}

Download invoice:
${pdfUrl}

Regards,
Mazin Customs Clearance`,
  }

  const message = messages[locale]
  const phone = invoice.client?.whatsappNumber || invoice.client?.phone || ""

  // Generate WhatsApp URL
  const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`

  return {
    message,
    phone,
    whatsappUrl,
    pdfUrl,
  }
}

/**
 * Send invoice via WhatsApp (logs the action)
 */
export async function shareInvoiceViaWhatsApp(
  invoiceId: string,
  phone: string,
  locale: Locale = "ar"
) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  // Get share data
  const shareData = await getInvoiceWhatsAppShareData(invoiceId, locale)

  // Update invoice status to SENT if it was DRAFT
  const invoice = await db.invoice.findFirst({
    where: { id: invoiceId, userId: session.user.id },
  })

  if (invoice?.status === "DRAFT") {
    await db.invoice.update({
      where: { id: invoiceId },
      data: { status: "SENT" },
    })
    revalidatePath("/invoice")
    revalidatePath(`/invoice/${invoiceId}`)
  }

  return {
    ...shareData,
    phone: phone || shareData.phone,
    whatsappUrl: `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(shareData.message)}`,
  }
}
