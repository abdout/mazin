/**
 * Seed System Types
 * Shared TypeScript interfaces for the seed system
 */

import type { PrismaClient } from "@prisma/client"

// ============================================================================
// Core References
// ============================================================================

export interface UserRef {
  id: string
  email: string
  name: string
  role: string
}

export interface ShipmentRef {
  id: string
  shipmentNumber: string
  trackingNumber?: string
}

export interface InvoiceRef {
  id: string
  invoiceNumber: string
}

export interface DeclarationRef {
  id: string
  declarationNo: string
}

export interface ClientRef {
  id: string
  companyName: string
}

export interface SettingsRef {
  id: string
  companyName: string
}

export interface ProjectRef {
  id: string
  customer: string
}

export interface TaskRef {
  id: string
  task: string
  projectId?: string
}

// ============================================================================
// Seed Context
// ============================================================================

export interface SeedContext {
  prisma: PrismaClient
  users: UserRef[]
  shipments: ShipmentRef[]
  invoices: InvoiceRef[]
  declarations: DeclarationRef[]
  clients: ClientRef[]
  settings: SettingsRef[]
  projects: ProjectRef[]
}

export type PartialSeedContext = Partial<SeedContext> & {
  prisma: PrismaClient
}

// ============================================================================
// Seed Stats
// ============================================================================

export interface SeedStats {
  [key: string]: number
}
