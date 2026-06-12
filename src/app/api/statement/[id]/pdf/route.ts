import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { StatementPdf } from "@/components/platform/invoice/statement-pdf"
import type { Locale } from "@/components/internationalization"
import { rateLimit } from "@/lib/rate-limit"
import { renderPdfWithTimeout, PdfTimeoutError } from "@/lib/pdf-render"
import { logger } from "@/lib/logger"

const log = logger.forModule("api.statement-pdf")

// See invoice PDF route — same headroom rationale.
export const maxDuration = 30

const PDF_LIMIT = 10
const PDF_WINDOW_MS = 5 * 60_000

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Shared `pdf-export` bucket with the invoice route — see comment there.
    const rl = await rateLimit("pdf-export", session.user.id, PDF_LIMIT, PDF_WINDOW_MS)
    if (rl.limited) {
      log.warn("PDF rate limit hit", { userId: session.user.id, route: "statement" })
      const retryAfterSec = Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000))
      return NextResponse.json(
        { error: "Too many PDF exports. Please wait a moment and try again." },
        { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
      )
    }

    const { id } = await params
    const locale = (request.nextUrl.searchParams.get("locale") || "ar") as Locale

    const statement = await db.statementOfAccount.findFirst({
      where: { id, userId: session.user.id },
      include: {
        entries: { orderBy: { sortOrder: "asc" } },
        client: true,
      },
    })

    if (!statement) {
      return NextResponse.json({ error: "Statement not found" }, { status: 404 })
    }

    const settings = await db.companySettings.findUnique({
      where: { userId: session.user.id },
    })

    const pdfBuffer = await renderPdfWithTimeout(
      StatementPdf({ statement, settings: settings ?? undefined, locale })
    )

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${statement.statementNumber}.pdf"`,
      },
    })
  } catch (error) {
    if (error instanceof PdfTimeoutError) {
      log.error("Statement PDF render timed out", error, { timeoutMs: error.timeoutMs })
      return NextResponse.json(
        { error: "PDF generation timed out. Please try again." },
        { status: 504 },
      )
    }
    log.error("Statement PDF generation error", error as Error)
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    )
  }
}
