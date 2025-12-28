/**
 * Expenses Module - Configuration
 * Customs Clearance Operational Expenses
 */

// Local ExpenseStatus enum (stubbed until Prisma models are added)
export const ExpenseStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  PAID: "PAID",
  CANCELLED: "CANCELLED",
} as const

export type ExpenseStatus = (typeof ExpenseStatus)[keyof typeof ExpenseStatus]

export const ExpenseStatusLabels: Record<ExpenseStatus, string> = {
  PENDING: "Pending Approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  PAID: "Paid",
  CANCELLED: "Cancelled",
}

export const ExpenseStatusLabelsAr: Record<ExpenseStatus, string> = {
  PENDING: "في انتظار الموافقة",
  APPROVED: "تمت الموافقة",
  REJECTED: "مرفوض",
  PAID: "مدفوع",
  CANCELLED: "ملغى",
}

export const ExpenseStatusColors: Record<ExpenseStatus, string> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
  PAID: "secondary",
  CANCELLED: "secondary",
}

/**
 * Expense Categories for Customs Clearance Operations
 */
export const ExpenseCategories = [
  "PORT_CHARGES",
  "TERMINAL_FEES",
  "TRANSPORTATION",
  "STORAGE",
  "DEMURRAGE",
  "GOVERNMENT_FEES",
  "INSPECTION_COSTS",
  "OFFICE_SUPPLIES",
  "COMMUNICATION",
  "IT_EQUIPMENT",
  "VEHICLE_FUEL",
  "VEHICLE_MAINTENANCE",
  "PROFESSIONAL_SERVICES",
  "LEGAL_FEES",
  "STAFF_ALLOWANCES",
  "TRAVEL",
  "MEALS",
  "UTILITIES",
  "RENT",
  "INSURANCE",
  "MARKETING",
  "TRAINING",
  "SUBSCRIPTIONS",
  "BANK_CHARGES",
  "OTHER",
] as const

export type ExpenseCategory = (typeof ExpenseCategories)[number]

export const ExpenseCategoryLabels: Record<ExpenseCategory, string> = {
  PORT_CHARGES: "Port & Harbor Charges",
  TERMINAL_FEES: "Terminal Handling Fees",
  TRANSPORTATION: "Transportation & Logistics",
  STORAGE: "Storage & Warehousing",
  DEMURRAGE: "Demurrage & Detention",
  GOVERNMENT_FEES: "Government Fees & Levies",
  INSPECTION_COSTS: "Inspection & Survey Costs",
  OFFICE_SUPPLIES: "Office Supplies",
  COMMUNICATION: "Communication & Internet",
  IT_EQUIPMENT: "IT Equipment & Software",
  VEHICLE_FUEL: "Vehicle Fuel",
  VEHICLE_MAINTENANCE: "Vehicle Maintenance",
  PROFESSIONAL_SERVICES: "Professional Services",
  LEGAL_FEES: "Legal & Consulting Fees",
  STAFF_ALLOWANCES: "Staff Allowances & Benefits",
  TRAVEL: "Travel Expenses",
  MEALS: "Meals & Hospitality",
  UTILITIES: "Utilities (Water, Electricity)",
  RENT: "Office Rent",
  INSURANCE: "Insurance Premiums",
  MARKETING: "Marketing & Advertising",
  TRAINING: "Training & Development",
  SUBSCRIPTIONS: "Subscriptions & Memberships",
  BANK_CHARGES: "Bank Charges & Fees",
  OTHER: "Other Expenses",
}

export const ExpenseCategoryLabelsAr: Record<ExpenseCategory, string> = {
  PORT_CHARGES: "رسوم الميناء",
  TERMINAL_FEES: "رسوم المحطة",
  TRANSPORTATION: "النقل واللوجستيات",
  STORAGE: "التخزين",
  DEMURRAGE: "الأرضيات والتأخير",
  GOVERNMENT_FEES: "الرسوم الحكومية",
  INSPECTION_COSTS: "تكاليف الفحص",
  OFFICE_SUPPLIES: "مستلزمات المكتب",
  COMMUNICATION: "الاتصالات والإنترنت",
  IT_EQUIPMENT: "معدات تقنية المعلومات",
  VEHICLE_FUEL: "وقود المركبات",
  VEHICLE_MAINTENANCE: "صيانة المركبات",
  PROFESSIONAL_SERVICES: "الخدمات المهنية",
  LEGAL_FEES: "الرسوم القانونية",
  STAFF_ALLOWANCES: "بدلات الموظفين",
  TRAVEL: "مصروفات السفر",
  MEALS: "الوجبات والضيافة",
  UTILITIES: "المرافق",
  RENT: "الإيجار",
  INSURANCE: "التأمين",
  MARKETING: "التسويق والإعلان",
  TRAINING: "التدريب والتطوير",
  SUBSCRIPTIONS: "الاشتراكات",
  BANK_CHARGES: "رسوم البنك",
  OTHER: "مصروفات أخرى",
}

/**
 * Expense limits and thresholds
 */
export const EXPENSE_LIMITS = {
  MAX_AMOUNT_WITHOUT_RECEIPT: 10000, // SDG 100 - small expenses
  MAX_AMOUNT_WITHOUT_APPROVAL: 50000, // SDG 500 - auto-approve threshold
  MAX_AMOUNT_GENERAL: 100000000, // SDG 1,000,000 - max single expense
  APPROVAL_THRESHOLD_MANAGER: 500000, // SDG 5,000 - requires manager approval
  APPROVAL_THRESHOLD_DIRECTOR: 2000000, // SDG 20,000 - requires director approval
} as const

export const RECEIPT_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "image/webp",
    "application/pdf",
  ],
} as const

/**
 * Expense source types (where the expense originated)
 */
export const EXPENSE_SOURCES = [
  "SHIPMENT", // Related to a specific shipment
  "OPERATION", // General operations
  "ADMINISTRATION", // Office/admin expenses
  "VEHICLE", // Fleet/vehicle expenses
  "STAFF", // Staff-related expenses
] as const

export type ExpenseSource = (typeof EXPENSE_SOURCES)[number]

/**
 * Expense approval workflow
 */
export const APPROVAL_LEVELS = {
  AUTO: "auto", // Below threshold, auto-approved
  SUPERVISOR: "supervisor", // Requires supervisor approval
  MANAGER: "manager", // Requires manager approval
  DIRECTOR: "director", // Requires director approval
  BOARD: "board", // Requires board approval
} as const
