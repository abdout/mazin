import type { TrackingStageType, FeeCategory } from "@prisma/client"

// =============================================================================
// VAT CONFIGURATION
// =============================================================================

export const VAT_RATE = 0.17 // Sudan standard 17%
export const VAT_LABEL = "قيمه مضافة 17%"
export const VAT_LABEL_EN = "VAT (17%)"

// =============================================================================
// FEE CATEGORY DEFINITIONS
// =============================================================================

export interface FeeCategoryConfig {
  en: string
  ar: string
  defaultPrice: number
  tariffCode?: string
  category: "documentation" | "inspection" | "port" | "labor" | "transport" | "fees" | "tax" | "other"
}

// Complete fee categories matching real Port Sudan customs clearance invoices
export const FEE_CATEGORIES: Record<FeeCategory, FeeCategoryConfig> = {
  // Delivery & Documentation
  DELIVERY_ORDER: {
    en: "Delivery Order",
    ar: "اذن تسليم",
    defaultPrice: 737489,
    category: "documentation",
  },
  CUSTOMS_DECLARATION: {
    en: "Customs Declaration",
    ar: "شهادة جمركية",
    defaultPrice: 500000,
    category: "documentation",
  },
  CUSTOMS_DUTY_RECEIPT: {
    en: "Customs Duty Receipt",
    ar: "ايصال جمارك",
    defaultPrice: 0, // Variable - calculated from declaration
    category: "documentation",
  },
  INITIAL_PORT_INVOICE: {
    en: "Initial Port Invoice",
    ar: "فاتورة موانئ اولية",
    defaultPrice: 1495109,
    category: "documentation",
  },

  // Inspection & Standards
  EXAMINATION: {
    en: "Examination",
    ar: "الكشف عن الطرد",
    defaultPrice: 700000,
    tariffCode: "H9/1",
    category: "inspection",
  },
  QUALITY_STANDARDS: {
    en: "Quality Standards (SSMO)",
    ar: "رسوم ضبط الجودة والتحليل",
    defaultPrice: 1830000,
    category: "inspection",
  },
  CUSTOMS_LABORATORY: {
    en: "Customs Laboratory",
    ar: "رسوم معمل جمركي",
    defaultPrice: 100000,
    category: "inspection",
  },
  MINISTRY_OF_TRADE: {
    en: "Ministry of Trade Charges",
    ar: "رسوم وزارة التجارة",
    defaultPrice: 0,
    category: "inspection",
  },
  CUSTOMS_SUPERVISION: {
    en: "Customs Supervision",
    ar: "رسوم ملاحظة",
    defaultPrice: 0,
    category: "inspection",
  },

  // Port Operations
  PORT_STORAGE_QUAY: {
    en: "Port Storage & Quay",
    ar: "فاتورة موانئ نهائية",
    defaultPrice: 4797451,
    tariffCode: "CT/F-3-4",
    category: "port",
  },
  CONTAINER_MOVE: {
    en: "Container Move",
    ar: "نقل الحاويات",
    defaultPrice: 200000,
    category: "port",
  },
  CRANE_HIRE: {
    en: "Hire of Crane",
    ar: "إيجار كرين",
    defaultPrice: 0,
    category: "port",
  },
  STEVEDORING: {
    en: "Stevedoring Charges",
    ar: "أجرة عمال التستيف",
    defaultPrice: 3200000,
    tariffCode: "F343_20",
    category: "port",
  },

  // Labor & Services
  LABOURERS_WAGES: {
    en: "Labourers Wages",
    ar: "أجرة عمال الشحن والتفريغ",
    defaultPrice: 400000,
    category: "labor",
  },
  CHECKERS_WAGES: {
    en: "Checkers Wages",
    ar: "يوميات العدادين",
    defaultPrice: 0,
    category: "labor",
  },
  OVERTIME_CHARGES: {
    en: "Overtime Charges",
    ar: "عمل اضافي",
    defaultPrice: 0,
    category: "labor",
  },

  // Transport & Logistics
  TRANSPORTATION: {
    en: "Trans Portation",
    ar: "ترحيل محلي",
    defaultPrice: 1600000,
    category: "transport",
  },
  FUMIGATION: {
    en: "Fumigation Fees",
    ar: "رسوم التبخير",
    defaultPrice: 0,
    category: "transport",
  },

  // Fees & Penalties
  DEMURRAGE: {
    en: "Demurrage Charges",
    ar: "إيجار حاويات",
    defaultPrice: 0,
    category: "fees",
  },
  STAMPS_FEES: {
    en: "Stamps",
    ar: "دمغة جودة",
    defaultPrice: 50000,
    category: "fees",
  },
  HEALTH_FEES: {
    en: "Health Fees",
    ar: "رسوم وزارة الصحة والبيئة ووقاية النباتات",
    defaultPrice: 0,
    category: "fees",
  },

  // Agency & Commission
  COMMISSION: {
    en: "Commission",
    ar: "العمولة",
    defaultPrice: 1200000,
    category: "other",
  },

  // Taxes
  VAT: {
    en: "VAT (17%)",
    ar: "قيمه مضافة 17%",
    defaultPrice: 0, // Calculated
    category: "tax",
  },

  // Other
  OTHER: {
    en: "Other Charges",
    ar: "منصرفات اخري",
    defaultPrice: 200000,
    category: "other",
  },
}

// =============================================================================
// STAGE-TO-FEE MAPPING
// =============================================================================

// Maps tracking stages to their typical fee categories for quick invoice generation
export const STAGE_FEE_MAPPING: Record<TrackingStageType, FeeCategory[]> = {
  PRE_ARRIVAL_DOCS: [],
  VESSEL_ARRIVAL: [],
  CUSTOMS_DECLARATION: ["CUSTOMS_DECLARATION"],
  CUSTOMS_PAYMENT: ["CUSTOMS_DUTY_RECEIPT", "VAT"],
  INSPECTION: ["EXAMINATION", "CUSTOMS_LABORATORY"],
  PORT_FEES: ["PORT_STORAGE_QUAY", "INITIAL_PORT_INVOICE", "CONTAINER_MOVE", "STEVEDORING"],
  QUALITY_STANDARDS: ["QUALITY_STANDARDS", "STAMPS_FEES"],
  RELEASE: ["DELIVERY_ORDER"],
  LOADING: ["LABOURERS_WAGES", "CRANE_HIRE"],
  IN_TRANSIT: ["TRANSPORTATION"],
  DELIVERED: ["COMMISSION"],
}

// =============================================================================
// LEGACY STAGE FEE TEMPLATES (for backward compatibility)
// =============================================================================

export const STAGE_FEE_TEMPLATES: Record<
  TrackingStageType,
  Array<{ description: string; descriptionAr: string; defaultPrice: number; feeCategory?: FeeCategory }>
> = {
  PRE_ARRIVAL_DOCS: [
    { description: "Document Processing", descriptionAr: "معالجة المستندات", defaultPrice: 500 },
    { description: "Verification Fee", descriptionAr: "رسوم التحقق", defaultPrice: 250 },
  ],
  VESSEL_ARRIVAL: [],
  CUSTOMS_DECLARATION: [
    { description: "Customs Declaration", descriptionAr: "شهادة جمركية", defaultPrice: 500000, feeCategory: "CUSTOMS_DECLARATION" },
  ],
  CUSTOMS_PAYMENT: [
    { description: "Customs Duty Receipt", descriptionAr: "ايصال جمارك", defaultPrice: 0, feeCategory: "CUSTOMS_DUTY_RECEIPT" },
    { description: "VAT (17%)", descriptionAr: "قيمه مضافة 17%", defaultPrice: 0, feeCategory: "VAT" },
  ],
  INSPECTION: [
    { description: "Examination", descriptionAr: "الكشف عن الطرد", defaultPrice: 700000, feeCategory: "EXAMINATION" },
    { description: "Customs Laboratory", descriptionAr: "معمل الجمارك", defaultPrice: 100000, feeCategory: "CUSTOMS_LABORATORY" },
  ],
  PORT_FEES: [
    { description: "Port Storage & Quay", descriptionAr: "فاتورة موانئ نهائية", defaultPrice: 4797451, feeCategory: "PORT_STORAGE_QUAY" },
    { description: "Initial Port Invoice", descriptionAr: "فاتورة موانئ اولية", defaultPrice: 1495109, feeCategory: "INITIAL_PORT_INVOICE" },
    { description: "Container Move", descriptionAr: "نقل الحاويات", defaultPrice: 200000, feeCategory: "CONTAINER_MOVE" },
    { description: "Stevedoring", descriptionAr: "أجرة عمال التستيف", defaultPrice: 3200000, feeCategory: "STEVEDORING" },
  ],
  QUALITY_STANDARDS: [
    { description: "Quality Standards (SSMO)", descriptionAr: "رسوم ضبط الجودة", defaultPrice: 1830000, feeCategory: "QUALITY_STANDARDS" },
    { description: "Stamps", descriptionAr: "دمغة جودة", defaultPrice: 50000, feeCategory: "STAMPS_FEES" },
  ],
  RELEASE: [
    { description: "Delivery Order", descriptionAr: "اذن تسليم", defaultPrice: 737489, feeCategory: "DELIVERY_ORDER" },
  ],
  LOADING: [
    { description: "Labourers Wages", descriptionAr: "أجرة عمال الشحن والتفريغ", defaultPrice: 400000, feeCategory: "LABOURERS_WAGES" },
  ],
  IN_TRANSIT: [
    { description: "Transportation", descriptionAr: "ترحيل محلي", defaultPrice: 1600000, feeCategory: "TRANSPORTATION" },
  ],
  DELIVERED: [
    { description: "Commission", descriptionAr: "العمولة", defaultPrice: 1200000, feeCategory: "COMMISSION" },
  ],
}

// =============================================================================
// QUICK FEE PRESETS
// =============================================================================

// Common fee combinations for quick invoice creation
export const QUICK_FEE_PRESETS = {
  BASIC_CLEARANCE: [
    "CUSTOMS_DECLARATION",
    "CUSTOMS_DUTY_RECEIPT",
    "EXAMINATION",
    "DELIVERY_ORDER",
    "VAT",
    "COMMISSION",
  ] as FeeCategory[],

  FULL_CLEARANCE: [
    "DELIVERY_ORDER",
    "CUSTOMS_DECLARATION",
    "CUSTOMS_DUTY_RECEIPT",
    "EXAMINATION",
    "QUALITY_STANDARDS",
    "PORT_STORAGE_QUAY",
    "INITIAL_PORT_INVOICE",
    "TRANSPORTATION",
    "LABOURERS_WAGES",
    "STEVEDORING",
    "STAMPS_FEES",
    "COMMISSION",
    "VAT",
  ] as FeeCategory[],

  PORT_ONLY: [
    "PORT_STORAGE_QUAY",
    "INITIAL_PORT_INVOICE",
    "CONTAINER_MOVE",
    "STEVEDORING",
    "VAT",
  ] as FeeCategory[],

  CUSTOMS_ONLY: [
    "CUSTOMS_DECLARATION",
    "CUSTOMS_DUTY_RECEIPT",
    "EXAMINATION",
    "CUSTOMS_LABORATORY",
    "VAT",
  ] as FeeCategory[],
}

// =============================================================================
// INVOICE STATUS CONFIGURATION
// =============================================================================

export const INVOICE_STATUS_CONFIG = {
  DRAFT: {
    label: "Draft",
    labelAr: "مسودة",
    color: "secondary" as const,
    icon: "FileText",
  },
  SENT: {
    label: "Sent",
    labelAr: "مرسلة",
    color: "info" as const,
    icon: "Send",
  },
  PAID: {
    label: "Paid",
    labelAr: "مدفوعة",
    color: "success" as const,
    icon: "CheckCircle",
  },
  OVERDUE: {
    label: "Overdue",
    labelAr: "متأخرة",
    color: "destructive" as const,
    icon: "AlertCircle",
  },
  CANCELLED: {
    label: "Cancelled",
    labelAr: "ملغية",
    color: "outline" as const,
    icon: "XCircle",
  },
}

// =============================================================================
// CURRENCY OPTIONS
// =============================================================================

export const CURRENCY_OPTIONS = [
  { value: "SDG", label: "SDG - Sudanese Pound", labelAr: "ج.س - جنيه سوداني" },
  { value: "USD", label: "USD - US Dollar", labelAr: "دولار - دولار أمريكي" },
  { value: "SAR", label: "SAR - Saudi Riyal", labelAr: "ر.س - ريال سعودي" },
]

// =============================================================================
// INVOICE TYPE CONFIGURATION
// =============================================================================

export const INVOICE_TYPE_CONFIG = {
  CLEARANCE: {
    label: "Clearance Invoice",
    labelAr: "فاتورة تخليص",
    prefix: "", // Uses sequence/year format: 1044/25
  },
  PROFORMA: {
    label: "Proforma Invoice",
    labelAr: "فاتورة مبدئية",
    prefix: "PRO-",
  },
  STATEMENT: {
    label: "Statement of Account",
    labelAr: "كشف حساب",
    prefix: "SOA-",
  },
  PORT: {
    label: "Port Invoice",
    labelAr: "فاتورة ميناء",
    prefix: "SPC-",
  },
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get fee category config by category key
 */
export function getFeeCategoryConfig(category: FeeCategory): FeeCategoryConfig {
  return FEE_CATEGORIES[category]
}

/**
 * Get all fee categories for a tracking stage
 */
export function getStageFees(stage: TrackingStageType): FeeCategory[] {
  return STAGE_FEE_MAPPING[stage] || []
}

/**
 * Calculate total for a list of fee categories with quantities
 */
export function calculateFeesTotal(
  fees: Array<{ category: FeeCategory; quantity: number; customPrice?: number }>
): { subtotal: number; vat: number; total: number } {
  let subtotal = 0

  for (const fee of fees) {
    const config = FEE_CATEGORIES[fee.category]
    const price = fee.customPrice ?? config.defaultPrice
    subtotal += price * fee.quantity
  }

  const vat = subtotal * VAT_RATE
  const total = subtotal + vat

  return { subtotal, vat, total }
}

/**
 * Generate invoice number in the format: sequence/YY (e.g., "1044/25")
 */
export function formatInvoiceNumber(sequence: number, date: Date = new Date()): string {
  const year = date.getFullYear().toString().slice(-2)
  return `${sequence}/${year}`
}
