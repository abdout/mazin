import { PrismaClient } from "@prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"
import { neonConfig } from "@neondatabase/serverless"
import ws from "ws"

// Node.js needs an explicit WebSocket constructor for the Neon driver.
// Edge/serverless runtimes already expose a global WebSocket.
if (typeof globalThis.WebSocket === "undefined") {
  neonConfig.webSocketConstructor = ws
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  // Pass a PoolConfig, not a Pool instance — the adapter owns the pool.
  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL,
  })

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db
