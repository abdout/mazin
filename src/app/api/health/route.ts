import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  const start = Date.now()
  let dbStatus = "ok"

  try {
    // Verify database connectivity
    await db.$queryRawUnsafe("SELECT 1")
  } catch {
    dbStatus = "error"
  }

  const latency = Date.now() - start

  const status = dbStatus === "ok" ? 200 : 503

  return NextResponse.json(
    {
      status: dbStatus === "ok" ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbStatus,
      latency: `${latency}ms`,
    },
    { status }
  )
}
