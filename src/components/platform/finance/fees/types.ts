/**
 * Service Charges Sub-Block Types
 *
 * Feature-based sub-block for customs clearance service charges and duties management
 */

import type { ServiceCategory, ServiceType, CurrencyCode } from "./config"

// Stub types (will be replaced when Prisma models are added)
interface FeeStructure {
  id: string
  name: string
  nameAr?: string
  description: string | null
  amount: number
  currency: string
  category: string
  serviceType?: string
  status: string
  dueDate: Date | null
  companyId: string
  createdAt: Date
  updatedAt: Date
}

interface FeeAssignment {
  id: string
  clientId: string
  feeStructureId: string
  shipmentId?: string
  amount: number
  dueDate: Date
  status: string
  companyId: string
  createdAt: Date
  updatedAt: Date
}

interface Payment {
  id: string
  assignmentId?: string
  clientId: string
  amount: number
  currency: string
  paymentDate: Date
  paymentMethod: string
  reference?: string
  companyId: string
  createdAt: Date
  updatedAt: Date
}

interface Fine {
  id: string
  clientId: string
  shipmentId?: string
  amount: number
  reason: string
  status: string
  dueDate: Date
  companyId: string
  createdAt: Date
  updatedAt: Date
}

// Extended types with relations
export type ChargeStructureWithRelations = FeeStructure & {
  serviceType?: ServiceType
  category?: ServiceCategory
  assignments?: ChargeAssignment[]
  _count?: {
    assignments: number
  }
}

export type ChargeAssignment = FeeAssignment & {
  client: {
    id: string
    name: string
    company?: string
  }
  chargeStructure: FeeStructure
  shipmentId?: string
  payments?: Payment[]
  _count?: {
    payments: number
  }
}

export type PaymentWithRelations = Payment & {
  client: {
    id: string
    name: string
    company?: string
  }
  chargeAssignment?: FeeAssignment
  currency?: CurrencyCode
}

export type PenaltyWithRelations = Fine & {
  client: {
    id: string
    name: string
    company?: string
  }
  shipmentId?: string
  reason?: "LATE_PAYMENT" | "DEMURRAGE" | "STORAGE" | "OTHER"
}

// View Models
export type ChargeStructureListItem = {
  id: string
  name: string
  nameAr?: string
  description: string | null
  amount: number
  currency: CurrencyCode
  category: ServiceCategory
  serviceType?: ServiceType
  status: string
  dueDate: Date | null
  assignmentCount: number
}

export type ClientChargesSummary = {
  clientId: string
  clientName: string
  companyName?: string
  totalCharges: number
  totalPaid: number
  totalPending: number
  totalOverdue: number
  discountAmount: number
  penaltyAmount: number
  netAmount: number
  creditLimit?: number
  creditUsed?: number
}

export type PaymentSummary = {
  totalCollected: number
  pendingPayments: number
  overduePayments: number
  paymentCount: number
  averagePaymentAmount: number
  byCurrency?: Record<CurrencyCode, number>
}

// Shipment-related charge types
export type ShipmentCharges = {
  shipmentId: string
  clientId: string
  clientName: string
  serviceType: ServiceType
  charges: {
    clearanceFee: number
    documentationFee: number
    customsDuty: number
    portCharges: number
    transportationCharges: number
    storageCharges: number
    demurrageCharges: number
    inspectionFee: number
    insuranceCharges: number
    handlingFee: number
    otherCharges: number
  }
  totalCharges: number
  totalPaid: number
  outstanding: number
  status: "pending" | "partial" | "paid" | "overdue"
  dueDate: Date
  currency: CurrencyCode
}

// Duty tracking types
export type DutyPayment = {
  id: string
  shipmentId: string
  clientId: string
  dutyType: "CUSTOMS_DUTY" | "VAT" | "IMPORT_TAX" | "EXCISE" | "OTHER"
  amount: number
  currency: CurrencyCode
  collectedFromClient: boolean
  paidToGovernment: boolean
  collectionDate?: Date
  paymentDate?: Date
  referenceNumber?: string
}

// Client credit types
export type ClientCredit = {
  clientId: string
  clientName: string
  creditLimit: number
  creditUsed: number
  creditAvailable: number
  paymentTerms: number // days
  lastPaymentDate?: Date
  averagePaymentDays: number
  status: "good" | "warning" | "blocked"
}

// Action result types
export type ChargeActionResult = {
  success: boolean
  data?: ChargeStructureWithRelations | ChargeAssignment | PaymentWithRelations
  error?: string
}

// Dashboard stats for charges module
export type ChargesDashboardStats = {
  totalCharges: number
  collectedAmount: number
  pendingAmount: number
  overdueAmount: number
  activeClients: number
  totalShipmentsWithCharges: number
  averageChargePerShipment: number
  collectionRate: number
}

// Legacy compatibility - map old names to new
export type FeeStructureWithRelations = ChargeStructureWithRelations
export type FeeAssignmentWithRelations = ChargeAssignment
export type StudentFeesSummary = ClientChargesSummary
export type FeeStructureListItem = ChargeStructureListItem
export type FineWithRelations = PenaltyWithRelations
