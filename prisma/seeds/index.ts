/**
 * Seed System Orchestrator
 *
 * Main entry point for seeding the Mazin logistics database.
 * Executes all seed phases in dependency order.
 *
 * Usage:
 *   pnpm db:seed
 *
 * Expected Output:
 *   - 3 Users (mazin, sami, admin)
 *   - 1 Company Settings (with branding)
 *   - 5 Clients (with billing addresses)
 *   - 2 Shipments (with tracking stages)
 *   - 1 Customs Declaration
 *   - 15 Invoices (with 65+ line items)
 *     - Statuses: 3 DRAFT, 5 SENT, 5 PAID, 2 OVERDUE, 1 CANCELLED
 *     - Currencies: SDG (12), USD (2), SAR (1)
 *
 * Test Credentials:
 *   - mazin@abdout.org / 1234 (Admin)
 *   - sami@abdout.org / 1234 (Manager)
 *   - admin@mazin.sd / admin123 (Admin)
 *
 * Tracking Test URLs:
 *   - /track/TRK-ABC123 (27% complete)
 *   - /track/TRK-XYZ789 (73% complete)
 */

import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import dotenv from "dotenv"

import { seedUsers } from "./auth"
import { seedClients } from "./clients"
import { seedDeclarations } from "./declarations"
import { seedInvoices } from "./invoices"
import { seedMarketplace } from "./marketplace"
import { seedProjects } from "./projects"
import { seedSettings } from "./settings"
import { seedShipments } from "./shipments"
import type { SeedContext } from "./types"
import { logHeader, logPhase, logSummary, measureDuration } from "./utils"

dotenv.config()

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

async function main() {
  const startTime = Date.now()

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  try {
    logHeader()

    // Build context progressively through phases
    const context: Partial<SeedContext> = { prisma }

    // ========================================================================
    // PHASE 1: USER ACCOUNTS
    // ========================================================================
    logPhase(1, "USER ACCOUNTS")

    const users = await measureDuration("Users", () => seedUsers(prisma))
    context.users = users

    // ========================================================================
    // PHASE 2: COMPANY SETTINGS
    // ========================================================================
    logPhase(2, "COMPANY SETTINGS")

    const settings = await measureDuration("Settings", () =>
      seedSettings(prisma, users)
    )
    context.settings = settings

    // ========================================================================
    // PHASE 3: CLIENTS
    // ========================================================================
    logPhase(3, "CLIENTS")

    const clients = await measureDuration("Clients", () =>
      seedClients(prisma, users)
    )
    context.clients = clients

    // ========================================================================
    // PHASE 4: SHIPMENTS
    // ========================================================================
    logPhase(4, "SHIPMENTS & TRACKING")

    const shipments = await measureDuration("Shipments", () =>
      seedShipments(prisma, users)
    )
    context.shipments = shipments

    // ========================================================================
    // PHASE 5: DECLARATIONS
    // ========================================================================
    logPhase(5, "CUSTOMS DECLARATIONS")

    const declarations = await measureDuration("Declarations", () =>
      seedDeclarations(prisma, shipments, users)
    )
    context.declarations = declarations

    // ========================================================================
    // PHASE 6: INVOICES
    // ========================================================================
    logPhase(6, "INVOICES")

    const invoices = await measureDuration("Invoices", () =>
      seedInvoices(prisma, shipments, users, clients)
    )
    context.invoices = invoices

    // ========================================================================
    // PHASE 7: PROJECTS
    // ========================================================================
    logPhase(7, "PROJECTS")

    const projects = await measureDuration("Projects", () =>
      seedProjects(prisma, users)
    )
    context.projects = projects

    // ========================================================================
    // PHASE 8: MARKETPLACE
    // ========================================================================
    logPhase(8, "MARKETPLACE")

    const marketplace = await measureDuration("Marketplace", () =>
      seedMarketplace(prisma, users)
    )

    // ========================================================================
    // COMPLETION
    // ========================================================================
    logSummary(startTime, {
      Users: users.length,
      Settings: settings.length,
      Clients: clients.length,
      Shipments: shipments.length,
      "Tracking Stages": 22, // 11 per shipment
      Declarations: declarations.length,
      Invoices: invoices.length,
      Projects: projects.length,
      "Service Categories": marketplace.categories.length,
      Vendors: marketplace.vendors.length,
      "Service Listings": marketplace.listings.length,
      "Service Requests": marketplace.requests.length,
    })

    console.log("\n📋 Test Credentials:")
    console.log("   mazin@abdout.org / 1234 (Admin)")
    console.log("   sami@abdout.org / 1234 (Manager)")
    console.log("   admin@mazin.sd / admin123 (Admin)")
    console.log("\n🔍 Tracking URLs:")
    console.log("   /track/TRK-ABC123 (27% complete)")
    console.log("   /track/TRK-XYZ789 (73% complete)")
    console.log("\n🏪 Marketplace:")
    console.log("   /ar/marketplace - Browse services")
    console.log("   /en/marketplace - Browse services (English)")
    console.log(`   ${marketplace.vendors.length} vendors, ${marketplace.listings.length} services seeded`)

  } catch (error) {
    console.error("❌ Seed failed:", error)
    throw error
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

// ============================================================================
// EXECUTION
// ============================================================================

main()
  .then(() => {
    console.log("\n✅ Seed completed successfully!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("❌ Seed failed:", error)
    process.exit(1)
  })
