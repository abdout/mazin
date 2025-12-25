import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import bcrypt from "bcryptjs"
import dotenv from "dotenv"

dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Seeding database...")

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 10)
  const admin = await prisma.user.upsert({
    where: { email: "admin@mazin.sd" },
    update: {},
    create: {
      email: "admin@mazin.sd",
      name: "Admin User",
      password: adminPassword,
      role: "ADMIN",
    },
  })
  console.log(`Created admin user: ${admin.email}`)

  // Create manager user
  const managerPassword = await bcrypt.hash("manager123", 10)
  const manager = await prisma.user.upsert({
    where: { email: "manager@mazin.sd" },
    update: {},
    create: {
      email: "manager@mazin.sd",
      name: "Manager User",
      password: managerPassword,
      role: "MANAGER",
    },
  })
  console.log(`Created manager user: ${manager.email}`)

  // Create clerk user
  const clerkPassword = await bcrypt.hash("clerk123", 10)
  const clerk = await prisma.user.upsert({
    where: { email: "clerk@mazin.sd" },
    update: {},
    create: {
      email: "clerk@mazin.sd",
      name: "Clerk User",
      password: clerkPassword,
      role: "CLERK",
    },
  })
  console.log(`Created clerk user: ${clerk.email}`)

  // Create sample shipment
  const shipment = await prisma.shipment.upsert({
    where: { shipmentNumber: "SHP-2025-001" },
    update: {},
    create: {
      shipmentNumber: "SHP-2025-001",
      type: "IMPORT",
      status: "IN_TRANSIT",
      description: "Electronic goods from China",
      weight: 1500.5,
      quantity: 100,
      containerNumber: "MSKU1234567",
      vesselName: "MSC OSCAR",
      consignor: "Shanghai Electronics Co.",
      consignee: "Port Sudan Trading LLC",
      arrivalDate: new Date("2025-01-15"),
      userId: admin.id,
    },
  })
  console.log(`Created sample shipment: ${shipment.shipmentNumber}`)

  // Create customs declaration for shipment
  const declaration = await prisma.customsDeclaration.upsert({
    where: { declarationNo: "DEC-2025-001" },
    update: {},
    create: {
      declarationNo: "DEC-2025-001",
      status: "SUBMITTED",
      hsCode: "8471.30",
      dutyAmount: 15000.0,
      taxAmount: 2250.0,
      currency: "SDG",
      notes: "Electronic equipment - portable computers",
      shipmentId: shipment.id,
      userId: admin.id,
    },
  })
  console.log(`Created customs declaration: ${declaration.declarationNo}`)

  // Create sample invoice
  const invoice = await prisma.invoice.upsert({
    where: { invoiceNumber: "INV-2025-001" },
    update: {},
    create: {
      invoiceNumber: "INV-2025-001",
      status: "SENT",
      currency: "SDG",
      subtotal: 50000.0,
      tax: 7500.0,
      total: 57500.0,
      dueDate: new Date("2025-02-01"),
      shipmentId: shipment.id,
      userId: admin.id,
      items: {
        create: [
          {
            description: "Customs clearance service",
            quantity: 1,
            unitPrice: 25000.0,
            total: 25000.0,
          },
          {
            description: "Documentation processing",
            quantity: 1,
            unitPrice: 15000.0,
            total: 15000.0,
          },
          {
            description: "Port handling fees",
            quantity: 1,
            unitPrice: 10000.0,
            total: 10000.0,
          },
        ],
      },
    },
  })
  console.log(`Created invoice: ${invoice.invoiceNumber}`)

  console.log("\nSeed completed successfully!")
  console.log("\nTest credentials:")
  console.log("  Admin:   admin@mazin.sd / admin123")
  console.log("  Manager: manager@mazin.sd / manager123")
  console.log("  Clerk:   clerk@mazin.sd / clerk123")
}

main()
  .catch((e) => {
    console.error("Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
