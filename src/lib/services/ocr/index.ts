import { generateObject } from "ai"
import { anthropic } from "@ai-sdk/anthropic"
import { z } from "zod"

const model = anthropic("claude-sonnet-4-20250514")

// -------------------------------------------------------------------
// Commercial Invoice Extraction
// -------------------------------------------------------------------

const invoiceLineItemSchema = z.object({
  description: z.string(),
  hsCode: z.string().optional(),
  quantity: z.number(),
  unit: z.string().optional(),
  unitPrice: z.number(),
  totalPrice: z.number(),
})

const commercialInvoiceSchema = z.object({
  invoiceNumber: z.string(),
  invoiceDate: z.string().optional(),
  seller: z.object({
    name: z.string(),
    address: z.string().optional(),
    country: z.string().optional(),
  }),
  buyer: z.object({
    name: z.string(),
    address: z.string().optional(),
    country: z.string().optional(),
  }),
  shipTo: z.string().optional(),
  portOfLoading: z.string().optional(),
  portOfDischarge: z.string().optional(),
  vesselName: z.string().optional(),
  paymentTerms: z.string().optional(),
  currency: z.string(),
  items: z.array(invoiceLineItemSchema),
  subtotal: z.number().optional(),
  freight: z.number().optional(),
  insurance: z.number().optional(),
  cifTotal: z.number(),
  suggestedHSCodes: z.array(z.string()).optional(),
  language: z.enum(["ar", "en", "mixed"]),
  confidence: z.number().min(0).max(1),
})

export type CommercialInvoiceResult = z.infer<typeof commercialInvoiceSchema>

export async function extractCommercialInvoice(
  fileUrl: string
): Promise<{ success: true; data: CommercialInvoiceResult } | { success: false; error: string }> {
  try {
    const { object } = await generateObject({
      model,
      schema: commercialInvoiceSchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract all data from this commercial invoice. This is a Sudan customs clearance document.
Rules:
- Extract ALL line items with descriptions, quantities, unit prices, and totals
- Identify HS codes if shown on the document (format: XXXX.XX or XXXXXXXX)
- Suggest likely HS codes based on item descriptions if not explicitly shown
- The CIF total is the most important value (Cost + Insurance + Freight)
- Currency is usually USD for international trade
- Detect whether the document is in Arabic, English, or mixed
- Set confidence between 0-1 based on how clearly you can read the document`,
            },
            {
              type: "image",
              image: fileUrl,
            },
          ],
        },
      ],
    })

    return { success: true, data: object }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Extraction failed",
    }
  }
}

// -------------------------------------------------------------------
// Bill of Lading Extraction
// -------------------------------------------------------------------

const billOfLadingSchema = z.object({
  blNumber: z.string(),
  shipper: z.object({
    name: z.string(),
    address: z.string().optional(),
  }),
  consignee: z.object({
    name: z.string(),
    address: z.string().optional(),
  }),
  notifyParty: z.object({
    name: z.string(),
    address: z.string().optional(),
  }).optional(),
  vesselName: z.string(),
  voyageNumber: z.string().optional(),
  portOfLoading: z.string(),
  portOfDischarge: z.string(),
  placeOfDelivery: z.string().optional(),
  dateOfIssue: z.string().optional(),
  onBoardDate: z.string().optional(),
  containers: z.array(z.object({
    containerNumber: z.string(),
    sealNumber: z.string().optional(),
    size: z.string().optional(),
    type: z.string().optional(),
    grossWeight: z.number().optional(),
    packages: z.number().optional(),
  })),
  totalPackages: z.number().optional(),
  totalGrossWeight: z.number().optional(),
  weightUnit: z.string().optional(),
  goodsDescription: z.string(),
  freightTerms: z.string().optional(),
  acnNumber: z.string().optional(),
  confidence: z.number().min(0).max(1),
})

export type BillOfLadingResult = z.infer<typeof billOfLadingSchema>

export async function extractBillOfLading(
  fileUrl: string
): Promise<{ success: true; data: BillOfLadingResult } | { success: false; error: string }> {
  try {
    const { object } = await generateObject({
      model,
      schema: billOfLadingSchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract all data from this Bill of Lading (B/L) document for Sudan customs clearance.
Rules:
- Extract ALL container numbers with their seal numbers and sizes
- Container numbers follow format: 4 letters + 7 digits (e.g., MSKU1234567)
- Port of discharge is likely "Port Sudan" or "بورتسودان"
- Look for ACN (Advance Cargo Declaration Number) if present
- Extract gross weight for each container if shown
- Identify freight terms (Prepaid/Collect)
- Set confidence between 0-1 based on document clarity`,
            },
            {
              type: "image",
              image: fileUrl,
            },
          ],
        },
      ],
    })

    return { success: true, data: object }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Extraction failed",
    }
  }
}

// -------------------------------------------------------------------
// Packing List Extraction
// -------------------------------------------------------------------

const packingListSchema = z.object({
  referenceNumber: z.string().optional(),
  date: z.string().optional(),
  seller: z.string(),
  buyer: z.string(),
  items: z.array(z.object({
    description: z.string(),
    hsCode: z.string().optional(),
    quantity: z.number(),
    unit: z.string().optional(),
    grossWeight: z.number().optional(),
    netWeight: z.number().optional(),
    packages: z.number().optional(),
    dimensions: z.string().optional(),
  })),
  totalPackages: z.number().optional(),
  totalGrossWeight: z.number().optional(),
  totalNetWeight: z.number().optional(),
  weightUnit: z.string().optional(),
  containerAssignment: z.array(z.object({
    containerNumber: z.string(),
    items: z.array(z.string()),
  })).optional(),
  confidence: z.number().min(0).max(1),
})

export type PackingListResult = z.infer<typeof packingListSchema>

export async function extractPackingList(
  fileUrl: string
): Promise<{ success: true; data: PackingListResult } | { success: false; error: string }> {
  try {
    const { object } = await generateObject({
      model,
      schema: packingListSchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract all data from this packing list for Sudan customs clearance.
Rules:
- Extract all items with quantities, weights (gross and net)
- Identify which items go in which container if that mapping is shown
- Include any HS codes or tariff references
- Weights are typically in KG
- Set confidence between 0-1 based on document clarity`,
            },
            {
              type: "image",
              image: fileUrl,
            },
          ],
        },
      ],
    })

    return { success: true, data: object }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Extraction failed",
    }
  }
}

// -------------------------------------------------------------------
// Generic Receipt/Payment Document Extraction
// -------------------------------------------------------------------

const receiptSchema = z.object({
  merchantName: z.string(),
  merchantAddress: z.string().optional(),
  merchantContact: z.string().optional(),
  receiptNumber: z.string().optional(),
  transactionDate: z.string(),
  transactionAmount: z.number(),
  currency: z.string(),
  paymentMethod: z.string().optional(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
    totalPrice: z.number(),
  })),
  tax: z.number().optional(),
  total: z.number(),
  notes: z.string().optional(),
  confidence: z.number().min(0).max(1),
})

export type ReceiptResult = z.infer<typeof receiptSchema>

export async function extractReceipt(
  fileUrl: string
): Promise<{ success: true; data: ReceiptResult } | { success: false; error: string }> {
  try {
    const { object } = await generateObject({
      model,
      schema: receiptSchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract all data from this receipt or payment document.
This may be a Sudanese customs receipt, port fee receipt, or general payment document.
Common issuers: Sudan Customs (ASYCUDA), Sea Ports Corporation, SSMO, shipping agents.
Extract amounts, dates, reference numbers, and itemized charges.
Set confidence between 0-1 based on document clarity.`,
            },
            {
              type: "image",
              image: fileUrl,
            },
          ],
        },
      ],
    })

    return { success: true, data: object }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Extraction failed",
    }
  }
}
