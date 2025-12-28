import type { TrackingStageType } from "@prisma/client"

// Stage fee templates for quick invoice creation
export const STAGE_FEE_TEMPLATES: Record<
  TrackingStageType,
  Array<{ description: string; descriptionAr: string; defaultPrice: number }>
> = {
  PRE_ARRIVAL_DOCS: [
    { description: "Document Processing", descriptionAr: "معالجة المستندات", defaultPrice: 500 },
    { description: "Verification Fee", descriptionAr: "رسوم التحقق", defaultPrice: 250 },
  ],
  VESSEL_ARRIVAL: [],
  CUSTOMS_DECLARATION: [
    { description: "Brokerage Fee", descriptionAr: "رسوم السمسرة الجمركية", defaultPrice: 1500 },
    { description: "Declaration Processing", descriptionAr: "معالجة البيان الجمركي", defaultPrice: 500 },
  ],
  CUSTOMS_PAYMENT: [
    { description: "Import Duty", descriptionAr: "الرسوم الجمركية", defaultPrice: 0 },
    { description: "VAT (15%)", descriptionAr: "ضريبة القيمة المضافة (15%)", defaultPrice: 0 },
    { description: "Processing Fee", descriptionAr: "رسوم المعالجة", defaultPrice: 200 },
  ],
  INSPECTION: [
    { description: "Inspection Fee", descriptionAr: "رسوم الفحص", defaultPrice: 500 },
    { description: "Attendance Fee", descriptionAr: "رسوم الحضور", defaultPrice: 300 },
  ],
  PORT_FEES: [
    { description: "Port Handling", descriptionAr: "مناولة الميناء", defaultPrice: 800 },
    { description: "Storage Fee", descriptionAr: "رسوم التخزين", defaultPrice: 0 },
    { description: "Terminal Charges", descriptionAr: "رسوم المحطة", defaultPrice: 400 },
  ],
  QUALITY_STANDARDS: [
    { description: "SSMO Certificate", descriptionAr: "شهادة المواصفات", defaultPrice: 350 },
  ],
  RELEASE: [
    { description: "Release Order Fee", descriptionAr: "رسوم إذن الإفراج", defaultPrice: 200 },
    { description: "Gate Pass", descriptionAr: "تصريح البوابة", defaultPrice: 100 },
  ],
  LOADING: [],
  IN_TRANSIT: [],
  DELIVERED: [],
}
