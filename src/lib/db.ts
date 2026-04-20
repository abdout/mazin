import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
}

function createPrismaClient() {
  const pool = globalForPrisma.pool ?? new Pool({
    connectionString: process.env.DATABASE_URL,
    // Neon serverless Postgres closes idle connections aggressively. These
    // timeouts keep the pool resilient when dev servers sleep or cold-start.
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    allowExitOnIdle: true,
    keepAlive: true,
  })

  // Swallow background connection errors so a dropped idle socket does not
  // crash the process; the next query will reconnect via the pool.
  pool.on("error", (err) => {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[db] pool error:", err.message)
    }
  })

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pool = pool
  }

  const adapter = new PrismaPg(pool)

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db
