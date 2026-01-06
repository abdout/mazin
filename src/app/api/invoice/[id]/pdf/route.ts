import { NextRequest, NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { InvoicePdf } from "@/components/platform/invoice/invoice-pdf"
import {
  ClearanceInvoicePdf,
  shouldUseClearanceFormat,
} from "@/components/platform/invoice/clearance-invoice-pdf"
import type { Locale } from "@/components/internationalization"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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

    const pdfBuffer = await renderToBuffer(
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
    console.error("PDF generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    )
  }
}
