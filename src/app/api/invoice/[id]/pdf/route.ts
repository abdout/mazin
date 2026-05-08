import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { InvoicePdf } from "@/components/platform/invoice/invoice-pdf"
import {
  ClearanceInvoicePdf,
  shouldUseClearanceFormat,
} from "@/components/platform/invoice/clearance-invoice-pdf"
import type { Locale } from "@/components/internationalization"
import { rateLimit } from "@/lib/rate-limit"
import { renderPdfWithTimeout, PdfTimeoutError } from "@/lib/pdf-render"
import { logger } from "@/lib/logger"

const log = logger.forModule("api.invoice-pdf")

// Vercel functions default to 10s; we wrap render in 8s to leave headroom for
// auth + DB + response writeback. Bump if invoice item counts grow.
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

    // 10 PDF renders / 5 min / user. Both invoice + statement PDF routes
    // share this bucket so a user can't sidestep by alternating routes.
    const rl = await rateLimit("pdf-export", session.user.id, PDF_LIMIT, PDF_WINDOW_MS)
    if (rl.limited) {
      log.warn("PDF rate limit hit", { userId: session.user.id, route: "invoice" })
      const retryAfterSec = Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000))
      return NextResponse.json(
        { error: "Too many PDF exports. Please wait a moment and try again." },
        { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
      )
    }

    const { id } = await params
    const locale = (request.nextUrl.searchParams.get("locale") || "ar") as Locale
    const format = request.nextUrl.searchParams.get("format") // "clearance" | "standard"

    const invoice = await db.invoice.findFirst({
      where: { id, userId: session.user.id },
      include: { items: { orderBy: { sortOrder: "asc" } }, shipment: true, client: true },
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    const settings = await db.companySettings.findUnique({
      where: { userId: session.user.id },
    })

    // Use clearance format for CLEARANCE/PORT invoices, or if explicitly requested
    const useClearanceFormat =
      format === "clearance" || shouldUseClearanceFormat(invoice.invoiceType)

    const pdfBuffer = await renderPdfWithTimeout(
      useClearanceFormat
        ? ClearanceInvoicePdf({ invoice, settings: settings ?? undefined, locale })
        : InvoicePdf({ invoice, settings: settings ?? undefined, locale })
    )

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      },
    })
  } catch (error) {
    if (error instanceof PdfTimeoutError) {
      log.error("PDF render timed out", error, { timeoutMs: error.timeoutMs })
      return NextResponse.json(
        { error: "PDF generation timed out. Please try again." },
        { status: 504 },
      )
    }
    log.error("PDF generation error", error as Error)
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    )
  }
}
