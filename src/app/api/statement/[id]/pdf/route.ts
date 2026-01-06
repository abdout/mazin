import { NextRequest, NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { StatementPdf } from "@/components/platform/invoice/statement-pdf"
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

    const pdfBuffer = await renderToBuffer(
      StatementPdf({ statement, settings: settings ?? undefined, locale })
    )

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${statement.statementNumber}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Statement PDF generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    )
  }
}
