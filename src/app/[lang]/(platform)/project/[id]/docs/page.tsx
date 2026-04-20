import React from 'react'
import { Icon } from '@iconify/react'
import { getDictionary } from '@/components/internationalization/dictionaries'
import type { Dictionary, Locale } from '@/components/internationalization'
import { getProject } from '@/components/platform/project/actions'
import {
  getDocumentChecklist,
  initializeDocumentChecklist,
} from '@/actions/shipment-document'

interface PageProps {
  params: Promise<{ id: string; lang: string }>
}

type DocType =
  | 'BILL_OF_LADING'
  | 'COMMERCIAL_INVOICE'
  | 'PACKING_LIST'
  | 'CERTIFICATE_OF_ORIGIN'
  | 'INSURANCE_CERTIFICATE'
  | 'IM_FORM'
  | 'ACD_CERTIFICATE'
  | 'SSMO_RELEASE'
  | 'PROFORMA_INVOICE'
  | 'DELIVERY_ORDER'
  | 'CUSTOMS_DECLARATION'
  | 'CUSTOMS_RECEIPT'
  | 'PORT_RECEIPT'
  | 'WORKING_ORDER'
  | 'OTHER'

type DocStatus = 'MISSING' | 'UPLOADED' | 'VERIFIED' | 'REJECTED' | 'EXPIRED'

const DOC_ICONS: Record<DocType, string> = {
  BILL_OF_LADING: 'mdi:file-document-outline',
  COMMERCIAL_INVOICE: 'mdi:receipt-text-outline',
  PACKING_LIST: 'mdi:clipboard-list-outline',
  CERTIFICATE_OF_ORIGIN: 'mdi:certificate-outline',
  INSURANCE_CERTIFICATE: 'mdi:shield-outline',
  IM_FORM: 'mdi:bank-outline',
  ACD_CERTIFICATE: 'mdi:ship-wheel',
  SSMO_RELEASE: 'mdi:shield-check-outline',
  PROFORMA_INVOICE: 'mdi:file-document-edit-outline',
  DELIVERY_ORDER: 'mdi:truck-delivery-outline',
  CUSTOMS_DECLARATION: 'mdi:clipboard-text-outline',
  CUSTOMS_RECEIPT: 'mdi:receipt-outline',
  PORT_RECEIPT: 'mdi:anchor',
  WORKING_ORDER: 'mdi:briefcase-outline',
  OTHER: 'mdi:file-outline',
}

const DOC_FALLBACKS: Record<DocType, string> = {
  BILL_OF_LADING: 'Bill of Lading (B/L)',
  COMMERCIAL_INVOICE: 'Commercial Invoice',
  PACKING_LIST: 'Packing List',
  CERTIFICATE_OF_ORIGIN: 'Certificate of Origin',
  INSURANCE_CERTIFICATE: 'Insurance Certificate',
  IM_FORM: 'IM Form',
  ACD_CERTIFICATE: 'ACD Certificate',
  SSMO_RELEASE: 'SSMO Release',
  PROFORMA_INVOICE: 'Proforma Invoice',
  DELIVERY_ORDER: 'Delivery Order',
  CUSTOMS_DECLARATION: 'Customs Declaration',
  CUSTOMS_RECEIPT: 'Customs Receipt',
  PORT_RECEIPT: 'Port Receipt',
  WORKING_ORDER: 'Working Order',
  OTHER: 'Other',
}

const STATUS_BADGES: Record<DocStatus, string> = {
  MISSING: 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400',
  UPLOADED: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400',
  VERIFIED: 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400',
  REJECTED: 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400',
  EXPIRED: 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
}

const STATUS_FALLBACKS: Record<DocStatus, string> = {
  MISSING: 'Missing',
  UPLOADED: 'Uploaded',
  VERIFIED: 'Verified',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired',
}

function getDocName(docType: DocType, dict: Dictionary): string {
  return dict.project?.docs?.docTypes?.[docType] ?? DOC_FALLBACKS[docType]
}

function getStatusLabel(status: DocStatus, dict: Dictionary): string {
  return dict.project?.docs?.docStatuses?.[status] ?? STATUS_FALLBACKS[status]
}

export default async function ProjectDocs({ params }: PageProps) {
  const { id, lang } = await params
  const locale = lang as Locale
  const dict = await getDictionary(locale)
  const docsDict = dict.project?.docs

  const projectResult = await getProject(id)

  if (!projectResult.success || !projectResult.project) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="border rounded-xl p-12 text-center">
          <Icon
            icon="mdi:file-remove-outline"
            width={48}
            className="mx-auto mb-3 text-muted-foreground opacity-40"
          />
          <p className="font-medium">
            {dict.project?.notFound ?? 'Project not found'}
          </p>
        </div>
      </div>
    )
  }

  const shipment = projectResult.project.shipment

  if (!shipment) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">
            {docsDict?.title ?? 'Documents'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {docsDict?.manageDescription ??
              'Manage required documents for customs clearance'}
          </p>
        </div>
        <div className="border rounded-xl p-12 text-center">
          <Icon
            icon="mdi:package-variant-closed"
            width={48}
            className="mx-auto mb-3 text-muted-foreground opacity-40"
          />
          <p className="font-medium">
            {docsDict?.noShipmentLinked ??
              'No shipment linked to this project'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {docsDict?.noShipmentHint ??
              'The document checklist will appear once a shipment is created'}
          </p>
        </div>
      </div>
    )
  }

  // Ensure mandatory doc entries exist, then fetch the checklist
  try {
    await initializeDocumentChecklist(shipment.id)
  } catch {
    // Non-fatal: proceed to read whatever exists
  }
  const { documents, summary } = await getDocumentChecklist(shipment.id)

  const labels = {
    totalRequired: docsDict?.totalRequired ?? 'Total Required',
    ready: docsDict?.ready ?? 'Ready',
    missing: docsDict?.missing ?? 'Missing',
    required: docsDict?.required ?? 'Required',
    checklist: docsDict?.documentChecklist ?? 'Document Checklist',
    readyForDeclaration:
      docsDict?.readyForDeclaration ?? 'Ready for Declaration',
    readyForDeclarationBody:
      docsDict?.readyForDeclarationBody ??
      'All mandatory documents are complete. You can proceed to the customs declaration.',
    notReady: docsDict?.notReady ?? 'Declaration not yet available',
    notReadyBody:
      docsDict?.notReadyBody ??
      'All mandatory documents must be uploaded or verified before you can submit the customs declaration.',
    docNumber: docsDict?.docNumber ?? 'Doc No.',
    yes: docsDict?.yes ?? 'Yes',
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">
          {docsDict?.title ?? 'Documents'}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {docsDict?.manageDescription ??
            'Manage required documents for customs clearance'}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="p-4 border rounded-xl">
          <p className="text-sm text-muted-foreground">{labels.totalRequired}</p>
          <p className="text-2xl font-semibold mt-1">{summary.mandatoryTotal}</p>
        </div>
        <div className="p-4 border rounded-xl border-green-200 bg-green-50 dark:bg-green-950/20">
          <p className="text-sm text-green-700 dark:text-green-400">
            {labels.ready}
          </p>
          <p className="text-2xl font-semibold mt-1 text-green-700 dark:text-green-400">
            {summary.mandatoryReady}
          </p>
        </div>
        <div className="p-4 border rounded-xl border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            {labels.missing}
          </p>
          <p className="text-2xl font-semibold mt-1 text-amber-700 dark:text-amber-400">
            {summary.missing}
          </p>
        </div>
        <div
          className={
            summary.canProceedToDeclaration
              ? 'p-4 border rounded-xl border-green-300 bg-green-100 dark:bg-green-950/30'
              : 'p-4 border rounded-xl border-amber-300 bg-amber-100 dark:bg-amber-950/30'
          }
        >
          <p
            className={
              summary.canProceedToDeclaration
                ? 'text-sm text-green-800 dark:text-green-300'
                : 'text-sm text-amber-800 dark:text-amber-300'
            }
          >
            {labels.readyForDeclaration}
          </p>
          <p
            className={
              summary.canProceedToDeclaration
                ? 'text-base font-semibold mt-1 text-green-800 dark:text-green-300'
                : 'text-base font-semibold mt-1 text-amber-800 dark:text-amber-300'
            }
          >
            {summary.canProceedToDeclaration
              ? labels.yes
              : `${summary.mandatoryReady}/${summary.mandatoryTotal}`}
          </p>
        </div>
      </div>

      {/* Checklist */}
      <div className="border rounded-xl p-6">
        <h2 className="text-lg font-medium mb-4">{labels.checklist}</h2>
        <div className="space-y-3">
          {documents.map((doc) => {
            const docType = doc.docType as DocType
            const status = doc.status as DocStatus
            const icon = DOC_ICONS[docType] ?? 'mdi:file-outline'
            const name = getDocName(docType, dict)
            const badgeClass = STATUS_BADGES[status]
            const statusLabel = getStatusLabel(status, dict)
            return (
              <div
                key={doc.docType}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors"
              >
                <Icon
                  icon={icon}
                  width={20}
                  className="text-muted-foreground shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">{name}</span>
                    {doc.isMandatory && (
                      <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 rounded">
                        {labels.required}
                      </span>
                    )}
                  </div>
                  {doc.documentNo && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {labels.docNumber}: {doc.documentNo}
                    </p>
                  )}
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded font-medium shrink-0 ${badgeClass}`}
                >
                  {statusLabel}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Declaration readiness banner */}
      {summary.canProceedToDeclaration ? (
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl">
          <div className="flex gap-3">
            <Icon
              icon="mdi:check-circle"
              width={20}
              className="text-green-600 mt-0.5 shrink-0"
            />
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">
                {labels.readyForDeclaration}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                {labels.readyForDeclarationBody}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <div className="flex gap-3">
            <Icon
              icon="mdi:alert"
              width={20}
              className="text-amber-600 mt-0.5 shrink-0"
            />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">
                {labels.notReady}
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                {labels.notReadyBody}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
