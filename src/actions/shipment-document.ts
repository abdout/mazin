"use server"

import { db } from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { ShipmentDocumentType, DocumentCheckStatus } from "@prisma/client"
import { uploadFile } from "@/lib/storage/upload"
import { recordShipmentEvent } from "@/lib/services/shipment-events"

const DOCUMENT_TYPES = [
  "BILL_OF_LADING",
  "COMMERCIAL_INVOICE",
  "PACKING_LIST",
  "CERTIFICATE_OF_ORIGIN",
  "INSURANCE_CERTIFICATE",
  "IM_FORM",
  "ACD_CERTIFICATE",
  "SSMO_RELEASE",
  "PROFORMA_INVOICE",
  "DELIVERY_ORDER",
  "CUSTOMS_DECLARATION",
  "CUSTOMS_RECEIPT",
  "PORT_RECEIPT",
  "WORKING_ORDER",
  "OTHER",
] as const

const upsertDocumentSchema = z.object({
  shipmentId: z.string(),
  docType: z.enum(DOCUMENT_TYPES),
  status: z
    .enum(["MISSING", "UPLOADED", "VERIFIED", "REJECTED", "EXPIRED"])
    .default("UPLOADED"),
  documentNo: z.string().optional(),
  issueDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  expiryDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
  fileSize: z.coerce.number().int().optional(),
  notes: z.string().optional(),
})

const MANDATORY_DOCS: ShipmentDocumentType[] = [
  "BILL_OF_LADING",
  "COMMERCIAL_INVOICE",
  "PACKING_LIST",
  "CERTIFICATE_OF_ORIGIN",
  "IM_FORM",
]

export async function initializeDocumentChecklist(shipmentId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const shipment = await db.shipment.findFirst({
    where: { id: shipmentId, userId: session.user.id },
  })
  if (!shipment) throw new Error("Shipment not found")

  const existing = await db.shipmentDocument.findMany({
    where: { shipmentId },
    select: { docType: true },
  })

  const existingTypes = new Set(existing.map((d) => d.docType))
  const docsToCreate = MANDATORY_DOCS.filter((t) => !existingTypes.has(t))

  if (docsToCreate.length > 0) {
    await db.shipmentDocument.createMany({
      data: docsToCreate.map((docType) => ({
        docType,
        status: "MISSING" as DocumentCheckStatus,
        shipmentId,
        userId: session.user!.id!,
      })),
      skipDuplicates: true,
    })
  }

  revalidatePath(`/project`)
  return { initialized: docsToCreate.length }
}

export async function upsertShipmentDocument(
  data: z.input<typeof upsertDocumentSchema>
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const validated = upsertDocumentSchema.parse(data)

  const shipment = await db.shipment.findFirst({
    where: { id: validated.shipmentId, userId: session.user.id },
  })
  if (!shipment) throw new Error("Shipment not found")

  const doc = await db.shipmentDocument.upsert({
    where: {
      shipmentId_docType: {
        shipmentId: validated.shipmentId,
        docType: validated.docType as ShipmentDocumentType,
      },
    },
    update: {
      status: validated.status as DocumentCheckStatus,
      documentNo: validated.documentNo,
      issueDate: validated.issueDate,
      expiryDate: validated.expiryDate,
      fileUrl: validated.fileUrl,
      fileName: validated.fileName,
      fileSize: validated.fileSize,
      notes: validated.notes,
    },
    create: {
      docType: validated.docType as ShipmentDocumentType,
      status: validated.status as DocumentCheckStatus,
      documentNo: validated.documentNo,
      issueDate: validated.issueDate,
      expiryDate: validated.expiryDate,
      fileUrl: validated.fileUrl,
      fileName: validated.fileName,
      fileSize: validated.fileSize,
      notes: validated.notes,
      shipmentId: validated.shipmentId,
      userId: session.user.id,
    },
  })

  revalidatePath(`/project`)
  return doc
}

/**
 * Upload a file to S3 + record the `ShipmentDocument` row in one step.
 *
 * The browser/server contract: client posts FormData with `file` (Blob),
 * `shipmentId` and `docType`. We delegate the actual S3 PUT to `uploadFile`
 * (which validates MIME + size and dedupes by SHA-256), then upsert the
 * checklist row, then append a `ShipmentEvent` so the activity feed reflects
 * the upload immediately.
 */
export async function uploadShipmentDocument(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const file = formData.get("file")
  const shipmentId = formData.get("shipmentId") as string | null
  const docType = formData.get("docType") as string | null
  const documentNo = (formData.get("documentNo") as string | null) ?? undefined
  if (!(file instanceof File)) throw new Error("Missing file")
  if (!shipmentId || !docType) throw new Error("Missing shipmentId or docType")

  const validatedDocType = upsertDocumentSchema.shape.docType.parse(docType)

  const shipment = await db.shipment.findFirst({
    where: { id: shipmentId, userId: session.user.id },
    select: { id: true },
  })
  if (!shipment) throw new Error("Shipment not found")

  const upload = await uploadFile(file, {
    kind: "shipment-document",
    originalName: file.name,
    metadata: {
      shipmentId,
      docType: validatedDocType,
    },
  })

  const doc = await db.shipmentDocument.upsert({
    where: {
      shipmentId_docType: { shipmentId, docType: validatedDocType as ShipmentDocumentType },
    },
    update: {
      status: "UPLOADED",
      documentNo,
      fileUrl: upload.url,
      fileName: file.name,
      fileSize: file.size,
    },
    create: {
      shipmentId,
      docType: validatedDocType as ShipmentDocumentType,
      status: "UPLOADED",
      documentNo,
      fileUrl: upload.url,
      fileName: file.name,
      fileSize: file.size,
      userId: session.user.id,
    },
  })

  await recordShipmentEvent({
    shipmentId,
    actorId: session.user.id,
    kind: "DOCUMENT_UPLOADED",
    summary: `Uploaded ${validatedDocType}: ${file.name}`,
    summaryAr: `تم تحميل ${validatedDocType}: ${file.name}`,
    metadata: { documentId: doc.id, fileId: upload.fileId, sha256: upload.sha256 },
  })

  revalidatePath(`/project/${shipmentId}/docs`)
  return { document: doc, file: upload }
}

export async function verifyDocument(documentId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const doc = await db.shipmentDocument.findFirst({
    where: { id: documentId, shipment: { userId: session.user.id } },
  })
  if (!doc) throw new Error("Document not found")

  const updated = await db.shipmentDocument.update({
    where: { id: documentId },
    data: {
      status: "VERIFIED",
      verifiedAt: new Date(),
      verifiedBy: session.user.id,
    },
  })

  revalidatePath(`/project`)
  return updated
}

export async function getDocumentChecklist(shipmentId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const shipment = await db.shipment.findFirst({
    where: { id: shipmentId, userId: session.user.id },
  })
  if (!shipment) throw new Error("Shipment not found")

  const docs = await db.shipmentDocument.findMany({
    where: { shipmentId },
    orderBy: { createdAt: "asc" },
  })

  const mandatoryStatus = MANDATORY_DOCS.map((docType) => {
    const doc = docs.find((d) => d.docType === docType)
    return {
      docType,
      status: doc?.status ?? "MISSING",
      documentNo: doc?.documentNo ?? null,
      isMandatory: true,
      isReady: doc?.status === "VERIFIED" || doc?.status === "UPLOADED",
    }
  })

  const additionalDocs = docs
    .filter((d) => !MANDATORY_DOCS.includes(d.docType))
    .map((d) => ({
      docType: d.docType,
      status: d.status,
      documentNo: d.documentNo,
      isMandatory: false,
      isReady: d.status === "VERIFIED" || d.status === "UPLOADED",
    }))

  const allDocs = [...mandatoryStatus, ...additionalDocs]
  const readyCount = allDocs.filter((d) => d.isReady).length
  const mandatoryReady = mandatoryStatus.filter((d) => d.isReady).length

  return {
    documents: allDocs,
    fullDocuments: docs,
    summary: {
      total: allDocs.length,
      ready: readyCount,
      missing: allDocs.length - readyCount,
      mandatoryTotal: MANDATORY_DOCS.length,
      mandatoryReady,
      canProceedToDeclaration: mandatoryReady === MANDATORY_DOCS.length,
    },
  }
}

export async function deleteShipmentDocument(documentId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const doc = await db.shipmentDocument.findFirst({
    where: { id: documentId, shipment: { userId: session.user.id } },
  })
  if (!doc) throw new Error("Document not found")

  await db.shipmentDocument.delete({ where: { id: documentId } })
  revalidatePath(`/project`)
}
