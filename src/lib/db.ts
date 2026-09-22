import { PrismaClient } from "@prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"
import { neonConfig } from "@neondatabase/serverless"
import ws from "ws"

// Node.js needs an explicit WebSocket constructor for the Neon driver.
// Edge/serverless runtimes already expose a global WebSocket.
if (typeof globalThis.WebSocket === "undefined") {
  neonConfig.webSocketConstructor = ws
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

// On Cloudflare Workers a client's WebSocket belongs to the request that opened it —
// reusing it from a later request hangs. cf/vinext-worker.js runs every request inside
// an AsyncLocalStorage scope; each scope gets its own client. Everywhere else (node,
// dev, tests, the container lane) there is no scope and one singleton is kept.
type Scope = { getStore(): object | undefined }
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  __mazinRequestScope?: Scope
}
const perRequest = new WeakMap<object, PrismaClient>()

function currentClient(): PrismaClient {
  const store = globalForPrisma.__mazinRequestScope?.getStore()
  if (store) {
    let client = perRequest.get(store)
    if (!client) {
      client = createPrismaClient()
      perRequest.set(store, client)
    }
    return client
  }
  globalForPrisma.prisma ??= createPrismaClient()
  return globalForPrisma.prisma
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = currentClient()
    const value = Reflect.get(client, prop, client)
    return typeof value === "function" ? value.bind(client) : value
  },
})
