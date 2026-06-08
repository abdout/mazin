import { describe, it, expect } from "vitest"
import {
  computeDocumentGate,
  hasDocumentGap,
} from "@/lib/tracking/stage-requirements"

describe("computeDocumentGate", () => {
  it("returns no missing/unverified for stages without doc requirements", () => {
    const finding = computeDocumentGate({
      targetStage: "VESSEL_ARRIVAL",
      documents: [],
    })
    expect(finding.missing).toEqual([])
    expect(finding.unverified).toEqual([])
    expect(hasDocumentGap(finding)).toBe(false)
  })

  it("flags every required doc as missing when none are uploaded", () => {
    const finding = computeDocumentGate({
      targetStage: "CUSTOMS_DECLARATION",
      documents: [],
    })
    expect(finding.missing).toContain("BILL_OF_LADING")
    expect(finding.missing).toContain("COMMERCIAL_INVOICE")
    expect(finding.missing).toContain("PACKING_LIST")
    expect(finding.missing).toContain("IM_FORM")
    expect(finding.missing).toContain("ACD_CERTIFICATE")
    expect(hasDocumentGap(finding)).toBe(true)
  })

  it("flags uploaded-but-unverified docs as unverified, not missing", () => {
    const finding = computeDocumentGate({
      targetStage: "CUSTOMS_DECLARATION",
      documents: [
        { docType: "BILL_OF_LADING", status: "UPLOADED" },
        { docType: "COMMERCIAL_INVOICE", status: "VERIFIED" },
        { docType: "PACKING_LIST", status: "VERIFIED" },
        { docType: "IM_FORM", status: "VERIFIED" },
        { docType: "ACD_CERTIFICATE", status: "REJECTED" },
      ],
    })
    expect(finding.missing).toEqual([])
    expect(finding.unverified).toEqual(["BILL_OF_LADING", "ACD_CERTIFICATE"])
  })

  it("passes when every required doc is VERIFIED", () => {
    const finding = computeDocumentGate({
      targetStage: "RELEASE",
      documents: [
        { docType: "DELIVERY_ORDER", status: "VERIFIED" },
        { docType: "CUSTOMS_RECEIPT", status: "VERIFIED" },
        { docType: "PORT_RECEIPT", status: "VERIFIED" },
      ],
    })
    expect(hasDocumentGap(finding)).toBe(false)
  })
})
