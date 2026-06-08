/**
 * Required documents per tracking stage.
 *
 * Sourced from `knowledge.md` §7 (Compliance Checklist) and
 * `docs/knowledge/workflow-stages.md`. Block stage advance unless every
 * required `ShipmentDocument` for the stage being **entered** is `VERIFIED`.
 *
 * The checklist reflects what customs / port / shipping line will reject the
 * shipment for if missing — it is intentionally minimal, not a wishlist.
 */

import type { ShipmentDocumentType, TrackingStageType } from "@prisma/client"

export const REQUIRED_DOCUMENTS_BY_STAGE: Partial<
  Record<TrackingStageType, ShipmentDocumentType[]>
> = {
  // Pre-arrival: ACD must be filed; bank IM Form must exist.
  CUSTOMS_DECLARATION: ["BILL_OF_LADING", "COMMERCIAL_INVOICE", "PACKING_LIST", "IM_FORM", "ACD_CERTIFICATE"],

  // SSMO inspection only triggers for regulated commodities — checked via
  // `HsCode.ssmoRequired` at runtime, not as a hard gate here.
  QUALITY_STANDARDS: [],

  // Release requires Delivery Order + paid customs/port receipts.
  RELEASE: ["DELIVERY_ORDER", "CUSTOMS_RECEIPT", "PORT_RECEIPT"],

  // Loading and onward — no extra docs gated, the checklist is at RELEASE.
}

export interface DocumentGateFinding {
  stageType: TrackingStageType
  missing: ShipmentDocumentType[]
  unverified: ShipmentDocumentType[]
}

/**
 * Compute missing/unverified docs for a given target stage. Used both at the
 * server-action level (block) and the UI level (banner).
 */
export function computeDocumentGate(args: {
  targetStage: TrackingStageType
  documents: { docType: ShipmentDocumentType; status: string }[]
}): DocumentGateFinding {
  const required = REQUIRED_DOCUMENTS_BY_STAGE[args.targetStage] ?? []
  const presentByType = new Map(args.documents.map((d) => [d.docType, d.status]))

  const missing = required.filter((t) => !presentByType.has(t))
  const unverified = required.filter(
    (t) => presentByType.has(t) && presentByType.get(t) !== "VERIFIED"
  )
  return { stageType: args.targetStage, missing, unverified }
}

export function hasDocumentGap(finding: DocumentGateFinding): boolean {
  return finding.missing.length > 0 || finding.unverified.length > 0
}
