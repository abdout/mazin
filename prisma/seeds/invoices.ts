/**
 * Invoices Seed
 * Creates 15 comprehensive invoices with line items for customs clearance company
 *
 * Coverage:
 * - Statuses: 3 DRAFT, 5 SENT, 5 PAID, 2 OVERDUE, 1 CANCELLED
 * - Currencies: SDG (12), USD (2), SAR (1)
 * - Services: Full logistics suite (customs, freight, warehousing, inspection, etc.)
 */

import type { PrismaClient } from "@prisma/client"
import type { ClientRef, InvoiceRef, ShipmentRef, UserRef } from "./types"
import { logSuccess } from "./utils"

// ============================================================================
// HELPERS
// ============================================================================

interface LineItem {
  description: string
  quantity: number
  unitPrice: number
}

function calcTotals(items: LineItem[]) {
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)
  const tax = subtotal * 0.15
  return { subtotal, tax, total: subtotal + tax }
}

// ============================================================================
// SEED FUNCTION
// ============================================================================

export async function seedInvoices(
  prisma: PrismaClient,
  shipments: ShipmentRef[],
  users: UserRef[],
  clients?: ClientRef[]
): Promise<InvoiceRef[]> {
  const invoices: InvoiceRef[] = []
  const adminUser = users.find(u => u.role === "ADMIN")

  if (!adminUser) {
    throw new Error("Admin user required for seeding invoices")
  }

  const shipment1 = shipments.find(s => s.shipmentNumber === "SHP-2025-001")
  const shipment2 = shipments.find(s => s.shipmentNumber === "SHP-2025-002")

  // Get client IDs if available
  const clientIds = clients?.map(c => c.id) || []

  // ========================================
  // INVOICE 1: Full Customs Clearance (SENT)
  // ========================================
  const inv1Items: LineItem[] = [
    { description: "Customs clearance - Import declaration", quantity: 1, unitPrice: 25000 },
    { description: "Certificate of Origin processing", quantity: 1, unitPrice: 8000 },
    { description: "Bill of Lading preparation", quantity: 1, unitPrice: 5000 },
    { description: "Port handling - Standard container (20ft)", quantity: 2, unitPrice: 15000 },
    { description: "Customs inspection fee", quantity: 1, unitPrice: 5000 },
  ]
  const inv1Totals = calcTotals(inv1Items)

  const invoice1 = await prisma.invoice.upsert({
    where: { invoiceNumber: "INV-2025-001" },
    update: {},
    create: {
      invoiceNumber: "INV-2025-001",
      status: "SENT",
      currency: "SDG",
      ...inv1Totals,
      dueDate: new Date("2025-02-01"),
      notes: "Full customs clearance package for electronic goods shipment",
      shipmentId: shipment1?.id,
      clientId: clientIds[0],
      paymentTermsDays: 30,
      taxRate: 15,
      userId: adminUser.id,
      items: {
        create: inv1Items.map(item => ({
          ...item,
          total: item.quantity * item.unitPrice,
        })),
      },
    },
  })
  invoices.push({ id: invoice1.id, invoiceNumber: invoice1.invoiceNumber })

  // ========================================
  // INVOICE 2: Freight Forwarding (PAID)
  // ========================================
  const inv2Items: LineItem[] = [
    { description: "Sea freight FCL (40ft container)", quantity: 1, unitPrice: 145000 },
    { description: "Land transport - Port to Khartoum", quantity: 1, unitPrice: 55000 },
    { description: "Cargo insurance - Comprehensive", quantity: 1, unitPrice: 28000 },
    { description: "Terminal handling charges", quantity: 1, unitPrice: 12000 },
  ]
  const inv2Totals = calcTotals(inv2Items)

  const invoice2 = await prisma.invoice.upsert({
    where: { invoiceNumber: "INV-2025-002" },
    update: {},
    create: {
      invoiceNumber: "INV-2025-002",
      status: "PAID",
      currency: "SDG",
      ...inv2Totals,
      dueDate: new Date("2025-01-15"),
      paidAt: new Date("2025-01-12"),
      notes: "Freight forwarding for automotive parts from Japan",
      shipmentId: shipment2?.id,
      clientId: clientIds[3],
      paymentTermsDays: 15,
      taxRate: 15,
      userId: adminUser.id,
      items: {
        create: inv2Items.map(item => ({
          ...item,
          total: item.quantity * item.unitPrice,
        })),
      },
    },
  })
  invoices.push({ id: invoice2.id, invoiceNumber: invoice2.invoiceNumber })

  // ========================================
  // INVOICE 3: Warehousing Services (OVERDUE)
  // ========================================
  const inv3Items: LineItem[] = [
    { description: "Warehouse storage (weekly rate)", quantity: 4, unitPrice: 8000 },
    { description: "Cold storage (per day)", quantity: 14, unitPrice: 3500 },
    { description: "Cargo handling and sorting", quantity: 1, unitPrice: 7500 },
    { description: "Container demurrage (per day)", quantity: 7, unitPrice: 4500 },
  ]
  const inv3Totals = calcTotals(inv3Items)

  const invoice3 = await prisma.invoice.upsert({
    where: { invoiceNumber: "INV-2025-003" },
    update: {},
    create: {
      invoiceNumber: "INV-2025-003",
      status: "OVERDUE",
      currency: "SDG",
      ...inv3Totals,
      dueDate: new Date("2025-01-10"),
      notes: "Extended storage for delayed clearance - URGENT PAYMENT REQUIRED",
      clientId: clientIds[0],
      paymentTermsDays: 7,
      taxRate: 15,
      userId: adminUser.id,
      items: {
        create: inv3Items.map(item => ({
          ...item,
          total: item.quantity * item.unitPrice,
        })),
      },
    },
  })
  invoices.push({ id: invoice3.id, invoiceNumber: invoice3.invoiceNumber })

  // ========================================
  // INVOICE 4: USD International (DRAFT)
  // ========================================
  const inv4Items: LineItem[] = [
    { description: "Customs clearance - Import", quantity: 1, unitPrice: 450 },
    { description: "Sea freight FCL (20ft)", quantity: 2, unitPrice: 1800 },
    { description: "Cargo insurance - Full coverage", quantity: 1, unitPrice: 520 },
    { description: "Port handling", quantity: 2, unitPrice: 280 },
    { description: "Pre-shipment inspection (PSI)", quantity: 1, unitPrice: 350 },
  ]
  const inv4Totals = calcTotals(inv4Items)

  const invoice4 = await prisma.invoice.upsert({
    where: { invoiceNumber: "INV-2025-004" },
    update: {},
    create: {
      invoiceNumber: "INV-2025-004",
      status: "DRAFT",
      currency: "USD",
      ...inv4Totals,
      notes: "International shipment - pending client approval",
      clientId: clientIds[1],
      paymentTermsDays: 30,
      taxRate: 15,
      userId: adminUser.id,
      items: {
        create: inv4Items.map(item => ({
          ...item,
          total: item.quantity * item.unitPrice,
        })),
      },
    },
  })
  invoices.push({ id: invoice4.id, invoiceNumber: invoice4.invoiceNumber })

  // ========================================
  // INVOICE 5: SAR Saudi Operations (SENT)
  // ========================================
  const inv5Items: LineItem[] = [
    { description: "Customs clearance - Import", quantity: 1, unitPrice: 1680 },
    { description: "Port handling - Jeddah Islamic Port", quantity: 3, unitPrice: 950 },
    { description: "Warehouse storage (daily)", quantity: 5, unitPrice: 85 },
    { description: "Land transport - Jeddah to Riyadh", quantity: 1, unitPrice: 2800 },
  ]
  const inv5Totals = calcTotals(inv5Items)

  const invoice5 = await prisma.invoice.upsert({
    where: { invoiceNumber: "INV-2025-005" },
    update: {},
    create: {
      invoiceNumber: "INV-2025-005",
      status: "SENT",
      currency: "SAR",
      ...inv5Totals,
      dueDate: new Date("2025-02-10"),
      notes: "Saudi Arabia import - Jeddah Islamic Port operations",
      clientId: clientIds[2],
      paymentTermsDays: 30,
      taxRate: 15,
      userId: adminUser.id,
      items: {
        create: inv5Items.map(item => ({
          ...item,
          total: item.quantity * item.unitPrice,
        })),
      },
    },
  })
  invoices.push({ id: invoice5.id, invoiceNumber: invoice5.invoiceNumber })

  // ========================================
  // INVOICE 6: Air Freight Urgent (PAID)
  // ========================================
  const inv6Items: LineItem[] = [
    { description: "Air freight (per 100kg)", quantity: 15, unitPrice: 35000 },
    { description: "Expedited customs clearance (24-hour)", quantity: 1, unitPrice: 45000 },
    { description: "Cargo insurance - Standard coverage", quantity: 1, unitPrice: 12000 },
    { description: "Land transport - Airport to Khartoum", quantity: 1, unitPrice: 25000 },
  ]
  const inv6Totals = calcTotals(inv6Items)

  const invoice6 = await prisma.invoice.upsert({
    where: { invoiceNumber: "INV-2025-006" },
    update: {},
    create: {
      invoiceNumber: "INV-2025-006",
      status: "PAID",
      currency: "SDG",
      ...inv6Totals,
      dueDate: new Date("2025-01-20"),
      paidAt: new Date("2025-01-18"),
      notes: "Urgent medical supplies - air freight express",
      clientId: clientIds[0],
      paymentTermsDays: 7,
      taxRate: 15,
      userId: adminUser.id,
      items: {
        create: inv6Items.map(item => ({
          ...item,
          total: item.quantity * item.unitPrice,
        })),
      },
    },
  })
  invoices.push({ id: invoice6.id, invoiceNumber: invoice6.invoiceNumber })

  // ========================================
  // INVOICE 7: Consulting Services (DRAFT)
  // ========================================
  const inv7Items: LineItem[] = [
    { description: "Trade consultation (per hour)", quantity: 8, unitPrice: 5000 },
    { description: "Regulatory compliance advisory", quantity: 1, unitPrice: 12000 },
    { description: "Tariff classification analysis", quantity: 3, unitPrice: 8000 },
    { description: "HS Code classification service", quantity: 5, unitPrice: 6000 },
  ]
  const inv7Totals = calcTotals(inv7Items)

  const invoice7 = await prisma.invoice.upsert({
    where: { invoiceNumber: "INV-2025-007" },
    update: {},
    create: {
      invoiceNumber: "INV-2025-007",
      status: "DRAFT",
      currency: "SDG",
      ...inv7Totals,
      notes: "Monthly consulting retainer - Khartoum Motors Ltd",
      clientId: clientIds[3],
      paymentTermsDays: 30,
      taxRate: 15,
      userId: adminUser.id,
      items: {
        create: inv7Items.map(item => ({
          ...item,
          total: item.quantity * item.unitPrice,
        })),
      },
    },
  })
  invoices.push({ id: invoice7.id, invoiceNumber: invoice7.invoiceNumber })

  // ========================================
  // INVOICE 8: Export Services (SENT)
  // ========================================
  const inv8Items: LineItem[] = [
    { description: "Customs clearance - Export declaration", quantity: 1, unitPrice: 18000 },
    { description: "Certificate of Origin processing", quantity: 1, unitPrice: 8000 },
    { description: "Commercial invoice certification", quantity: 1, unitPrice: 3500 },
    { description: "Packing list preparation", quantity: 1, unitPrice: 2500 },
    { description: "Quality standards inspection", quantity: 1, unitPrice: 8000 },
  ]
  const inv8Totals = calcTotals(inv8Items)

  const invoice8 = await prisma.invoice.upsert({
    where: { invoiceNumber: "INV-2025-008" },
    update: {},
    create: {
      invoiceNumber: "INV-2025-008",
      status: "SENT",
      currency: "SDG",
      ...inv8Totals,
      dueDate: new Date("2025-02-15"),
      notes: "Export documentation for gum arabic shipment to UAE",
      clientId: clientIds[4],
      paymentTermsDays: 30,
      taxRate: 15,
      userId: adminUser.id,
      items: {
        create: inv8Items.map(item => ({
          ...item,
          total: item.quantity * item.unitPrice,
        })),
      },
    },
  })
  invoices.push({ id: invoice8.id, invoiceNumber: invoice8.invoiceNumber })

  // ========================================
  // INVOICE 9: Large Shipment (PAID)
  // ========================================
  const inv9Items: LineItem[] = [
    { description: "Customs clearance - Import declaration", quantity: 1, unitPrice: 25000 },
    { description: "Sea freight FCL (40ft container)", quantity: 4, unitPrice: 145000 },
    { description: "Port handling - Large container (40ft)", quantity: 4, unitPrice: 22000 },
    { description: "Land transport - Regional delivery", quantity: 1, unitPrice: 95000 },
    { description: "Cargo insurance - Comprehensive", quantity: 1, unitPrice: 28000 },
    { description: "Wharfage fees", quantity: 4, unitPrice: 8500 },
  ]
  const inv9Totals = calcTotals(inv9Items)

  const invoice9 = await prisma.invoice.upsert({
    where: { invoiceNumber: "INV-2025-009" },
    update: {},
    create: {
      invoiceNumber: "INV-2025-009",
      status: "PAID",
      currency: "SDG",
      ...inv9Totals,
      dueDate: new Date("2025-01-05"),
      paidAt: new Date("2025-01-04"),
      notes: "Large machinery import - 4 containers from Germany",
      clientId: clientIds[3],
      paymentTermsDays: 15,
      taxRate: 15,
      userId: adminUser.id,
      items: {
        create: inv9Items.map(item => ({
          ...item,
          total: item.quantity * item.unitPrice,
        })),
      },
    },
  })
  invoices.push({ id: invoice9.id, invoiceNumber: invoice9.invoiceNumber })

  // ========================================
  // INVOICE 10: Demurrage Charges (OVERDUE)
  // ========================================
  const inv10Items: LineItem[] = [
    { description: "Container demurrage (per day)", quantity: 21, unitPrice: 4500 },
    { description: "Equipment detention charges", quantity: 21, unitPrice: 3500 },
    { description: "Warehouse storage (weekly rate)", quantity: 3, unitPrice: 8000 },
  ]
  const inv10Totals = calcTotals(inv10Items)

  const invoice10 = await prisma.invoice.upsert({
    where: { invoiceNumber: "INV-2025-010" },
    update: {},
    create: {
      invoiceNumber: "INV-2025-010",
      status: "OVERDUE",
      currency: "SDG",
      ...inv10Totals,
      dueDate: new Date("2024-12-28"),
      notes: "FINAL NOTICE: Extended demurrage - client delayed pickup 21 days",
      clientId: clientIds[1],
      paymentTermsDays: 7,
      taxRate: 15,
      userId: adminUser.id,
      items: {
        create: inv10Items.map(item => ({
          ...item,
          total: item.quantity * item.unitPrice,
        })),
      },
    },
  })
  invoices.push({ id: invoice10.id, invoiceNumber: invoice10.invoiceNumber })

  // ========================================
  // INVOICE 11: Small Documentation (PAID)
  // ========================================
  const inv11Items: LineItem[] = [
    { description: "Certificate of Origin processing", quantity: 1, unitPrice: 8000 },
    { description: "Commercial invoice certification", quantity: 1, unitPrice: 3500 },
    { description: "Insurance certificate processing", quantity: 1, unitPrice: 4000 },
  ]
  const inv11Totals = calcTotals(inv11Items)

  const invoice11 = await prisma.invoice.upsert({
    where: { invoiceNumber: "INV-2025-011" },
    update: {},
    create: {
      invoiceNumber: "INV-2025-011",
      status: "PAID",
      currency: "SDG",
      ...inv11Totals,
      dueDate: new Date("2025-01-08"),
      paidAt: new Date("2025-01-07"),
      notes: "Document-only service - no shipment handling",
      clientId: clientIds[4],
      paymentTermsDays: 7,
      taxRate: 15,
      userId: adminUser.id,
      items: {
        create: inv11Items.map(item => ({
          ...item,
          total: item.quantity * item.unitPrice,
        })),
      },
    },
  })
  invoices.push({ id: invoice11.id, invoiceNumber: invoice11.invoiceNumber })

  // ========================================
  // INVOICE 12: Inspection Services (SENT)
  // ========================================
  const inv12Items: LineItem[] = [
    { description: "Pre-shipment inspection (PSI)", quantity: 2, unitPrice: 15000 },
    { description: "Quality standards inspection", quantity: 2, unitPrice: 8000 },
    { description: "Customs inspection fee", quantity: 2, unitPrice: 5000 },
    { description: "HS Code classification service", quantity: 2, unitPrice: 6000 },
  ]
  const inv12Totals = calcTotals(inv12Items)

  const invoice12 = await prisma.invoice.upsert({
    where: { invoiceNumber: "INV-2025-012" },
    update: {},
    create: {
      invoiceNumber: "INV-2025-012",
      status: "SENT",
      currency: "SDG",
      ...inv12Totals,
      dueDate: new Date("2025-02-05"),
      notes: "Multi-container inspection for food products import",
      clientId: clientIds[0],
      paymentTermsDays: 30,
      taxRate: 15,
      userId: adminUser.id,
      items: {
        create: inv12Items.map(item => ({
          ...item,
          total: item.quantity * item.unitPrice,
        })),
      },
    },
  })
  invoices.push({ id: invoice12.id, invoiceNumber: invoice12.invoiceNumber })

  // ========================================
  // INVOICE 13: USD Large (CANCELLED)
  // ========================================
  const inv13Items: LineItem[] = [
    { description: "Sea freight FCL (40ft)", quantity: 2, unitPrice: 3200 },
    { description: "Customs clearance - Import", quantity: 1, unitPrice: 450 },
    { description: "Cargo insurance - Full coverage", quantity: 1, unitPrice: 520 },
  ]
  const inv13Totals = calcTotals(inv13Items)

  const invoice13 = await prisma.invoice.upsert({
    where: { invoiceNumber: "INV-2025-013" },
    update: {},
    create: {
      invoiceNumber: "INV-2025-013",
      status: "CANCELLED",
      currency: "USD",
      ...inv13Totals,
      notes: "CANCELLED - Client cancelled shipment order",
      clientId: clientIds[1],
      paymentTermsDays: 30,
      taxRate: 15,
      userId: adminUser.id,
      items: {
        create: inv13Items.map(item => ({
          ...item,
          total: item.quantity * item.unitPrice,
        })),
      },
    },
  })
  invoices.push({ id: invoice13.id, invoiceNumber: invoice13.invoiceNumber })

  // ========================================
  // INVOICE 14: Full Service Package (DRAFT)
  // ========================================
  const inv14Items: LineItem[] = [
    { description: "Customs clearance - Import declaration", quantity: 1, unitPrice: 25000 },
    { description: "Certificate of Origin processing", quantity: 1, unitPrice: 8000 },
    { description: "Bill of Lading preparation", quantity: 1, unitPrice: 5000 },
    { description: "Sea freight FCL (20ft container)", quantity: 1, unitPrice: 85000 },
    { description: "Port handling - Standard container (20ft)", quantity: 1, unitPrice: 15000 },
    { description: "Land transport - Port to Khartoum", quantity: 1, unitPrice: 55000 },
    { description: "Cargo insurance - Comprehensive", quantity: 1, unitPrice: 28000 },
    { description: "Warehouse storage (weekly rate)", quantity: 1, unitPrice: 8000 },
  ]
  const inv14Totals = calcTotals(inv14Items)

  const invoice14 = await prisma.invoice.upsert({
    where: { invoiceNumber: "INV-2025-014" },
    update: {},
    create: {
      invoiceNumber: "INV-2025-014",
      status: "DRAFT",
      currency: "SDG",
      ...inv14Totals,
      notes: "Complete door-to-door service package - pending quote acceptance",
      clientId: clientIds[0],
      paymentTermsDays: 30,
      taxRate: 15,
      userId: adminUser.id,
      items: {
        create: inv14Items.map(item => ({
          ...item,
          total: item.quantity * item.unitPrice,
        })),
      },
    },
  })
  invoices.push({ id: invoice14.id, invoiceNumber: invoice14.invoiceNumber })

  // ========================================
  // INVOICE 15: Duty Payment Agent (SENT)
  // ========================================
  const inv15Items: LineItem[] = [
    { description: "Import duty payment (as agent)", quantity: 1, unitPrice: 125000 },
    { description: "VAT payment processing", quantity: 1, unitPrice: 18750 },
    { description: "Customs clearance - Import declaration", quantity: 1, unitPrice: 25000 },
    { description: "Regulatory compliance advisory", quantity: 1, unitPrice: 12000 },
  ]
  const inv15Totals = calcTotals(inv15Items)

  const invoice15 = await prisma.invoice.upsert({
    where: { invoiceNumber: "INV-2025-015" },
    update: {},
    create: {
      invoiceNumber: "INV-2025-015",
      status: "SENT",
      currency: "SDG",
      ...inv15Totals,
      dueDate: new Date("2025-01-25"),
      notes: "Duty and tax payment on behalf of client - high-value electronics",
      clientId: clientIds[0],
      paymentTermsDays: 15,
      taxRate: 15,
      userId: adminUser.id,
      items: {
        create: inv15Items.map(item => ({
          ...item,
          total: item.quantity * item.unitPrice,
        })),
      },
    },
  })
  invoices.push({ id: invoice15.id, invoiceNumber: invoice15.invoiceNumber })

  logSuccess("Invoices", invoices.length, "with 65+ line items covering full logistics suite")
  return invoices
}
