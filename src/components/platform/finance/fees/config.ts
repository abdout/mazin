/**
 * Service Charges Sub-Block Configuration
 *
 * Configuration for customs clearance service fees, duties, and charges
 */

export const CHARGE_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  ARCHIVED: "ARCHIVED",
} as const

export const CHARGE_ASSIGNMENT_STATUS = {
  PENDING: "PENDING",
  PAID: "PAID",
  PARTIALLY_PAID: "PARTIALLY_PAID",
  OVERDUE: "OVERDUE",
  WAIVED: "WAIVED",
} as const

export const PAYMENT_METHOD = {
  CASH: "CASH",
  CARD: "CARD",
  BANK_TRANSFER: "BANK_TRANSFER",
  CHECK: "CHECK",
  MOBILE_MONEY: "MOBILE_MONEY",
  OTHER: "OTHER",
} as const

export const PAYMENT_STATUS = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
} as const

export const DISCOUNT_TYPE = {
  PERCENTAGE: "PERCENTAGE",
  FIXED: "FIXED",
  VOLUME: "VOLUME",
  LOYALTY: "LOYALTY",
} as const

export const DISCOUNT_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  EXPIRED: "EXPIRED",
} as const

export const PENALTY_STATUS = {
  PENDING: "PENDING",
  PAID: "PAID",
  WAIVED: "WAIVED",
  OVERDUE: "OVERDUE",
} as const

export const REFUND_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  REJECTED: "REJECTED",
} as const

// Status badge colors
export const STATUS_COLORS = {
  ACTIVE: "bg-green-500/10 text-green-500",
  INACTIVE: "bg-gray-500/10 text-gray-500",
  ARCHIVED: "bg-gray-500/10 text-gray-500",
  PENDING: "bg-yellow-500/10 text-yellow-500",
  PAID: "bg-green-500/10 text-green-500",
  PARTIALLY_PAID: "bg-blue-500/10 text-blue-500",
  OVERDUE: "bg-red-500/10 text-red-500",
  WAIVED: "bg-purple-500/10 text-purple-500",
  PROCESSING: "bg-blue-500/10 text-blue-500",
  COMPLETED: "bg-green-500/10 text-green-500",
  FAILED: "bg-red-500/10 text-red-500",
  REFUNDED: "bg-orange-500/10 text-orange-500",
  APPROVED: "bg-green-500/10 text-green-500",
  REJECTED: "bg-red-500/10 text-red-500",
  EXPIRED: "bg-gray-500/10 text-gray-500",
} as const

// Default pagination
export const DEFAULT_PAGE_SIZE = 20

/**
 * Service Fee Categories for Customs Clearance
 */
export const SERVICE_CATEGORIES = [
  "CLEARANCE_FEE",
  "DOCUMENTATION_FEE",
  "CUSTOMS_DUTY",
  "PORT_CHARGES",
  "TERMINAL_HANDLING",
  "TRANSPORTATION",
  "STORAGE",
  "DEMURRAGE",
  "INSPECTION_FEE",
  "INSURANCE",
  "HANDLING_FEE",
  "AGENCY_FEE",
  "CONSULTATION_FEE",
  "AMENDMENT_FEE",
  "OTHER",
] as const

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number]

export const SERVICE_CATEGORY_LABELS: Record<ServiceCategory, string> = {
  CLEARANCE_FEE: "Clearance Service Fee",
  DOCUMENTATION_FEE: "Documentation Fee",
  CUSTOMS_DUTY: "Customs Duty",
  PORT_CHARGES: "Port Charges",
  TERMINAL_HANDLING: "Terminal Handling",
  TRANSPORTATION: "Transportation",
  STORAGE: "Storage Charges",
  DEMURRAGE: "Demurrage",
  INSPECTION_FEE: "Inspection Fee",
  INSURANCE: "Insurance",
  HANDLING_FEE: "Handling Fee",
  AGENCY_FEE: "Agency Fee",
  CONSULTATION_FEE: "Consultation Fee",
  AMENDMENT_FEE: "Amendment Fee",
  OTHER: "Other Charges",
}

export const SERVICE_CATEGORY_LABELS_AR: Record<ServiceCategory, string> = {
  CLEARANCE_FEE: "رسوم التخليص",
  DOCUMENTATION_FEE: "رسوم المستندات",
  CUSTOMS_DUTY: "الرسوم الجمركية",
  PORT_CHARGES: "رسوم الميناء",
  TERMINAL_HANDLING: "مناولة المحطة",
  TRANSPORTATION: "النقل",
  STORAGE: "رسوم التخزين",
  DEMURRAGE: "الأرضيات",
  INSPECTION_FEE: "رسوم الفحص",
  INSURANCE: "التأمين",
  HANDLING_FEE: "رسوم المناولة",
  AGENCY_FEE: "رسوم الوكالة",
  CONSULTATION_FEE: "رسوم الاستشارة",
  AMENDMENT_FEE: "رسوم التعديل",
  OTHER: "رسوم أخرى",
}

/**
 * Clearance Service Types
 */
export const SERVICE_TYPES = [
  "IMPORT_CLEARANCE",
  "EXPORT_CLEARANCE",
  "TRANSIT",
  "RE_EXPORT",
  "TEMPORARY_IMPORT",
  "TEMPORARY_EXPORT",
] as const

export type ServiceType = (typeof SERVICE_TYPES)[number]

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  IMPORT_CLEARANCE: "Import Clearance",
  EXPORT_CLEARANCE: "Export Clearance",
  TRANSIT: "Transit",
  RE_EXPORT: "Re-export",
  TEMPORARY_IMPORT: "Temporary Import",
  TEMPORARY_EXPORT: "Temporary Export",
}

export const SERVICE_TYPE_LABELS_AR: Record<ServiceType, string> = {
  IMPORT_CLEARANCE: "تخليص وارد",
  EXPORT_CLEARANCE: "تخليص صادر",
  TRANSIT: "ترانزيت",
  RE_EXPORT: "إعادة تصدير",
  TEMPORARY_IMPORT: "إدخال مؤقت",
  TEMPORARY_EXPORT: "إخراج مؤقت",
}

/**
 * Currency configuration
 */
export const CURRENCIES = {
  SDG: { code: "SDG", symbol: "SDG", name: "Sudanese Pound" },
  USD: { code: "USD", symbol: "$", name: "US Dollar" },
  EUR: { code: "EUR", symbol: "€", name: "Euro" },
  SAR: { code: "SAR", symbol: "SAR", name: "Saudi Riyal" },
  AED: { code: "AED", symbol: "AED", name: "UAE Dirham" },
} as const

export type CurrencyCode = keyof typeof CURRENCIES

/**
 * Payment terms for clients
 */
export const PAYMENT_TERMS = {
  IMMEDIATE: 0,
  NET_7: 7,
  NET_15: 15,
  NET_30: 30,
  NET_45: 45,
  NET_60: 60,
} as const

export type PaymentTerm = keyof typeof PAYMENT_TERMS
