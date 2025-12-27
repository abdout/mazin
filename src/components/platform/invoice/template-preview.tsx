"use client"

import { useState } from "react"
import Image from "next/image"
import {
  IconDownload,
  IconPrinter,
  IconFileTypePdf,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import type { CompanySettings } from "@prisma/client"
import type { Dictionary, Locale } from "@/components/internationalization"

interface TemplatePreviewProps {
  settings: CompanySettings | null
  dictionary: Dictionary
  locale: Locale
}

// Sample invoice data for preview
const sampleInvoice = {
  invoiceNumber: "INV-00001",
  issueDate: new Date().toISOString(),
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  items: [
    { description: "Customs Clearance Service", quantity: 1, unitPrice: 5000 },
    { description: "Documentation Fees", quantity: 1, unitPrice: 500 },
    { description: "Warehouse Storage (7 days)", quantity: 7, unitPrice: 100 },
    { description: "Transportation Fee", quantity: 1, unitPrice: 1500 },
  ],
  currency: "SDG",
  taxRate: 15,
  client: {
    companyName: "Sample Company Ltd.",
    contactName: "John Doe",
    email: "client@example.com",
    phone: "+249 123 456 789",
    address: "123 Business Street, Khartoum",
  },
}

const sampleInvoiceAr = {
  invoiceNumber: "INV-00001",
  issueDate: new Date().toISOString(),
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  items: [
    { description: "خدمة التخليص الجمركي", quantity: 1, unitPrice: 5000 },
    { description: "رسوم التوثيق", quantity: 1, unitPrice: 500 },
    { description: "تخزين المستودعات (7 أيام)", quantity: 7, unitPrice: 100 },
    { description: "رسوم النقل", quantity: 1, unitPrice: 1500 },
  ],
  currency: "SDG",
  taxRate: 15,
  client: {
    companyName: "شركة نموذجية المحدودة",
    contactName: "أحمد محمد",
    email: "client@example.com",
    phone: "+249 123 456 789",
    address: "123 شارع الأعمال، الخرطوم",
  },
}

export function TemplatePreview({ settings, dictionary, locale }: TemplatePreviewProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const dict = dictionary.invoices
  const invoice = locale === "ar" ? sampleInvoiceAr : sampleInvoice

  const subtotal = invoice.items.reduce(
    (acc, item) => acc + item.quantity * item.unitPrice,
    0
  )
  const tax = (subtotal * invoice.taxRate) / 100
  const total = subtotal + tax

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPdf = async () => {
    setIsDownloading(true)
    try {
      const response = await fetch("/api/invoice/pdf?preview=true", {
        method: "GET",
      })
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `sample-invoice-${invoice.invoiceNumber}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex flex-wrap gap-2 no-print">
        <Button onClick={handleDownloadPdf} disabled={isDownloading}>
          {isDownloading ? (
            <IconFileTypePdf className="size-4 animate-pulse" />
          ) : (
            <IconDownload className="size-4" />
          )}
          {dict.templatesPage?.downloadPdf || "Download PDF"}
        </Button>
        <Button variant="outline" onClick={handlePrint}>
          <IconPrinter className="size-4" />
          {dict.templatesPage?.printTemplate || "Print Template"}
        </Button>
      </div>

      {/* Preview Card */}
      <Card className="invoice-print">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {dict.templatesPage?.sampleInvoice || "Sample Invoice"}
            </CardTitle>
            <span className="bg-muted rounded px-2 py-1 text-xs font-medium">
              {dict.templatesPage?.preview || "Preview"}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {/* Invoice Header */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <Image
                src={settings?.logoUrl || "/logo.png"}
                alt="Company Logo"
                width={120}
                height={60}
                className="mb-4 h-auto max-h-16 w-auto object-contain"
              />
              <h2 className="text-lg font-bold">
                {locale === "ar" ? settings?.companyNameAr || settings?.companyName : settings?.companyName || "Company Name"}
              </h2>
              {settings?.taxId && (
                <p className="text-muted-foreground text-sm">
                  {dict.taxId}: {settings.taxId}
                </p>
              )}
              {settings?.phone && (
                <p className="text-muted-foreground text-sm">{settings.phone}</p>
              )}
              {settings?.email && (
                <p className="text-muted-foreground text-sm">{settings.email}</p>
              )}
            </div>
            <div className="text-end">
              <h1 className="text-2xl font-bold">{invoice.invoiceNumber}</h1>
              <p className="text-muted-foreground text-sm">
                {locale === "ar" ? "تاريخ الإصدار" : "Issue Date"}: {new Date(invoice.issueDate).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US")}
              </p>
              <p className="text-muted-foreground text-sm">
                {dict.dueDate}: {new Date(invoice.dueDate).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US")}
              </p>
            </div>
          </div>

          {/* Client Info */}
          <div className="bg-muted/30 mb-6 rounded-lg p-4">
            <h3 className="mb-2 font-semibold">{dict.clientInfo}</h3>
            <p className="font-medium">{invoice.client.companyName}</p>
            <p className="text-muted-foreground text-sm">{invoice.client.contactName}</p>
            <p className="text-muted-foreground text-sm">{invoice.client.email}</p>
            <p className="text-muted-foreground text-sm">{invoice.client.phone}</p>
            <p className="text-muted-foreground text-sm">{invoice.client.address}</p>
          </div>

          {/* Line Items */}
          <div className="mb-6 overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>{dict.itemDescription}</TableHead>
                  <TableHead className="text-center">{dictionary.shipments.quantity}</TableHead>
                  <TableHead className="text-end">{dict.unitPrice}</TableHead>
                  <TableHead className="text-end">{dict.total}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-end tabular-nums">
                      {invoice.currency} {item.unitPrice.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-end tabular-nums">
                      {invoice.currency} {(item.quantity * item.unitPrice).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{dict.subtotal}</span>
                <span className="tabular-nums">{invoice.currency} {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{dict.tax} ({invoice.taxRate}%)</span>
                <span className="tabular-nums">{invoice.currency} {tax.toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>{dict.total}</span>
                <span className="tabular-nums">{invoice.currency} {total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Signature */}
          <div className="mt-8 flex justify-end">
            <div className="text-center">
              <Image
                src={settings?.signatureUrl || "/sign.png"}
                alt="Signature"
                width={120}
                height={60}
                className="mx-auto mb-2 h-auto max-h-16 w-auto object-contain"
              />
              <Separator className="w-32" />
              <p className="text-muted-foreground mt-1 text-sm">
                {locale === "ar" ? "التوقيع المعتمد" : "Authorized Signature"}
              </p>
            </div>
          </div>

          {/* Bank Details */}
          {settings?.bankName && (
            <div className="bg-muted/30 mt-8 rounded-lg p-4">
              <h3 className="mb-2 font-semibold">
                {dictionary.invoices.settingsPage?.bankDetails || "Bank Details"}
              </h3>
              <div className="text-muted-foreground grid gap-1 text-sm">
                <p><strong>{locale === "ar" ? "البنك" : "Bank"}:</strong> {settings.bankName}</p>
                {settings.accountName && (
                  <p><strong>{locale === "ar" ? "اسم الحساب" : "Account Name"}:</strong> {settings.accountName}</p>
                )}
                {settings.accountNumber && (
                  <p><strong>{locale === "ar" ? "رقم الحساب" : "Account Number"}:</strong> {settings.accountNumber}</p>
                )}
                {settings.iban && (
                  <p><strong>IBAN:</strong> {settings.iban}</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
