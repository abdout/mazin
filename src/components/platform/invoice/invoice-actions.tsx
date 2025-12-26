"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Download, Printer, Pencil, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SendEmailDialog } from "./send-email-dialog"
import type { Dictionary } from "@/components/internationalization/types"
import type { Locale } from "@/components/internationalization"
import type { InvoiceStatus } from "@prisma/client"

interface InvoiceActionsProps {
  invoiceId: string
  invoiceNumber: string
  invoiceStatus: InvoiceStatus
  clientEmail?: string | null
  dictionary: Dictionary
  locale: Locale
}

export function InvoiceActions({
  invoiceId,
  invoiceNumber,
  invoiceStatus,
  clientEmail,
  dictionary,
  locale,
}: InvoiceActionsProps) {
  const router = useRouter()
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  const t = dictionary.invoices
  const canEdit = invoiceStatus !== "PAID" && invoiceStatus !== "CANCELLED"

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true)
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/pdf?locale=${locale}`)
      if (!response.ok) throw new Error("Failed to generate PDF")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${invoiceNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("PDF download error:", error)
    } finally {
      setDownloadingPdf(false)
    }
  }

  const handleEdit = () => {
    router.push(`/${locale}/invoices/${invoiceId}/edit`)
  }

  return (
    <div className="flex flex-wrap gap-2 no-print">
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownloadPdf}
        disabled={downloadingPdf}
      >
        {downloadingPdf ? (
          <Loader2 className="h-4 w-4 me-2 animate-spin" />
        ) : (
          <Download className="h-4 w-4 me-2" />
        )}
        {t.downloadPdf}
      </Button>

      <Button variant="outline" size="sm" onClick={handlePrint}>
        <Printer className="h-4 w-4 me-2" />
        {t.print}
      </Button>

      <SendEmailDialog
        invoiceId={invoiceId}
        invoiceNumber={invoiceNumber}
        clientEmail={clientEmail}
        dictionary={dictionary}
        locale={locale}
      />

      {canEdit && (
        <Button variant="outline" size="sm" onClick={handleEdit}>
          <Pencil className="h-4 w-4 me-2" />
          {t.editInvoice}
        </Button>
      )}
    </div>
  )
}
