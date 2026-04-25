// Direct test: can we run the invoice page's queries against the prod DB?

import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  connectionTimeoutMillis: 10_000,
})

const db = new PrismaClient({
  adapter: new PrismaPg(pool),
  log: ["error", "warn", "query"],
})

async function run() {
  console.log("\n[1] Testing db.user.findFirst (auth sanity check)")
  try {
    const user = await db.user.findFirst({ where: { email: "mazin@abdout.org" } })
    console.log(`  found user: ${user?.id}, email: ${user?.email}`)

    const userId = user?.id
    if (!userId) {
      console.error("  ✗ No user found - cannot proceed")
      return
    }

    console.log("\n[2] Testing db.shipment.findMany (invoice page query)")
    try {
      const shipments = await db.shipment.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      })
      console.log(`  ✓ ${shipments.length} shipments found`)
    } catch (e) {
      console.error(`  ✗ shipment.findMany failed:`, e.message)
      console.error(e)
    }

    console.log("\n[3] Testing db.invoice.findMany (invoice table query)")
    try {
      const invoices = await db.invoice.findMany({
        where: { userId },
        include: { items: true, client: true, shipment: true },
        take: 10,
      })
      console.log(`  ✓ ${invoices.length} invoices found`)
    } catch (e) {
      console.error(`  ✗ invoice.findMany failed:`, e.message)
      console.error(e)
    }

    console.log("\n[4] Testing db.invoice.groupBy (status counts)")
    try {
      const counts = await db.invoice.groupBy({
        by: ["status"],
        where: { userId },
        _count: { status: true },
      })
      console.log(`  ✓ ${counts.length} status groups`)
    } catch (e) {
      console.error(`  ✗ invoice.groupBy failed:`, e.message)
      console.error(e)
    }

    console.log("\n[5] Testing db.invoice.aggregate (total range)")
    try {
      const agg = await db.invoice.aggregate({
        where: { userId },
        _min: { total: true },
        _max: { total: true },
      })
      console.log(`  ✓ min: ${agg._min.total}, max: ${agg._max.total}`)
    } catch (e) {
      console.error(`  ✗ invoice.aggregate failed:`, e.message)
      console.error(e)
    }

    console.log("\n[6] Testing db.shipment.findFirst (tracking)")
    try {
      const s = await db.shipment.findFirst({
        where: { trackingNumber: "TEST123" },
        include: { trackingStages: { orderBy: { createdAt: "asc" } } },
      })
      console.log(`  tracking result: ${s ? s.id : "null"}`)
    } catch (e) {
      console.error(`  ✗ shipment tracking failed:`, e.message)
      console.error(e)
    }

    console.log("\n[7] Testing finance dashboard queries")
    try {
      const expenses = await db.expense.findMany({
        where: { userId },
        take: 5,
      })
      console.log(`  ✓ ${expenses.length} expenses`)
    } catch (e) {
      console.error(`  ✗ expense.findMany failed:`, e.message)
    }
  } catch (e) {
    console.error("fatal:", e)
  }

  await db.$disconnect()
  await pool.end()
}

run()
