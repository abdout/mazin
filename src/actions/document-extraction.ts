"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import {
  extractCommercialInvoice,
  extractBillOfLading,
  extractPackingList,
  extractReceipt,
} from "@/lib/services/ocr"
import type { ShipmentDocumentType } from "@prisma/client"

type DocType = "COMMERCIAL_INVOICE" | "BILL_OF_LADING" | "PACKING_LIST" | "RECEIPT"

export async function extractDocumentData(
  shipmentId: string,
  fileUrl: string,
  docType: DocType
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const shipment = await db.shipment.findFirst({
    where: { id: shipmentId, userId: session.user.id },
  })
  if (!shipment) throw new Error("Shipment not found")

  switch (docType) {
    case "COMMERCIAL_INVOICE":
      return extractCommercialInvoice(fileUrl)
    case "BILL_OF_LADING":
      return extractBillOfLading(fileUrl)
    case "PACKING_LIST":
      return extractPackingList(fileUrl)
    case "RECEIPT":
      return extractReceipt(fileUrl)
  }
}

export async function extractAndPopulateInvoice(
  shipmentId: string,
  fileUrl: string
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const shipment = await db.shipment.findFirst({
    where: { id: shipmentId, userId: session.user.id },
  })
  if (!shipment) throw new Error("Shipment not found")

  const result = await extractCommercialInvoice(fileUrl)
  if (!result.success) return result

  const data = result.data

  await db.shipmentDocument.upsert({
    where: {
      shipmentId_docType: {
        shipmentId,
        docType: "COMMERCIAL_INVOICE" as ShipmentDocumentType,
      },
    },
    update: {
      status: "UPLOADED",
      documentNo: data.invoiceNumber,
      issueDate: data.invoiceDate ? new Date(data.invoiceDate) : undefined,
      fileUrl,
      notes: `AI extracted (confidence: ${Math.round(data.confidence * 100)}%)`,
    },
    create: {
      shipmentId,
      docType: "COMMERCIAL_INVOICE",
      status: "UPLOADED",
      documentNo: data.invoiceNumber,
      issueDate: data.invoiceDate ? new Date(data.invoiceDate) : undefined,
      fileUrl,
      notes: `AI extracted (confidence: ${Math.round(data.confidence * 100)}%)`,
      userId: session.user.id,
    },
  })

  revalidatePath(`/project`)
  return result
}

export async function extractAndPopulateBL(
  shipmentId: string,
  fileUrl: string
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const shipment = await db.shipment.findFirst({
    where: { id: shipmentId, userId: session.user.id },
  })
  if (!shipment) throw new Error("Shipment not found")

  const result = await extractBillOfLading(fileUrl)
  if (!result.success) return result

  const data = result.data

  await db.shipmentDocument.upsert({
    where: {
      shipmentId_docType: {
        shipmentId,
        docType: "BILL_OF_LADING" as ShipmentDocumentType,
      },
    },
    update: {
      status: "UPLOADED",
      documentNo: data.blNumber,
      issueDate: data.dateOfIssue ? new Date(data.dateOfIssue) : undefined,
      fileUrl,
      notes: `AI extracted (confidence: ${Math.round(data.confidence * 100)}%)`,
    },
    create: {
      shipmentId,
      docType: "BILL_OF_LADING",
      status: "UPLOADED",
      documentNo: data.blNumber,
      issueDate: data.dateOfIssue ? new Date(data.dateOfIssue) : undefined,
      fileUrl,
      notes: `AI extracted (confidence: ${Math.round(data.confidence * 100)}%)`,
      userId: session.user.id,
    },
  })

  // Auto-create containers from B/L
  for (const container of data.containers) {
    const existing = await db.container.findFirst({
      where: { shipmentId, containerNumber: container.containerNumber },
    })
    if (!existing) {
      const sizeMap: Record<string, string> = {
        "20": "TWENTY_FT",
        "40": "FORTY_FT",
        "40HC": "FORTY_FT_HC",
        "45": "FORTY_FIVE_FT",
      }
      const size = sizeMap[container.size ?? "20"] ?? "TWENTY_FT"

      await db.container.create({
        data: {
          containerNumber: container.containerNumber,
          sealNumber: container.sealNumber,
          size: size as "TWENTY_FT" | "FORTY_FT" | "FORTY_FT_HC" | "FORTY_FIVE_FT" | "OTHER",
          shipmentId,
        },
      })
    }
  }

  revalidatePath(`/project`)
  return result
}
