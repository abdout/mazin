"use client"

import * as React from "react"
import { MessageCircle, ExternalLink, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { shareInvoiceViaWhatsApp } from "@/actions/invoice"
import type { Locale } from "@/components/internationalization"

interface WhatsAppShareDialogProps {
  invoiceId: string
  invoiceNumber: string
  clientPhone?: string | null
  clientName?: string | null
  blNumber?: string | null
  total: number
  currency: string
  locale: Locale
}

export function WhatsAppShareDialog({
  invoiceId,
  invoiceNumber,
  clientPhone,
  clientName,
  blNumber,
  total,
  currency,
  locale,
}: WhatsAppShareDialogProps) {
  const isRtl = locale === "ar"
  const [open, setOpen] = React.useState(false)
  const [phone, setPhone] = React.useState(clientPhone || "")
  const [copied, setCopied] = React.useState(false)
  const [isPending, startTransition] = React.useTransition()

  // Generate preview message
  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  const pdfUrl = `${baseUrl}/api/invoice/${invoiceId}/pdf?locale=${locale}`

  const formattedTotal = total.toLocaleString(locale === "ar" ? "ar-SA" : "en-US", {
    minimumFractionDigits: 2,
  })

  const message = isRtl
    ? `السلام عليكم

فاتورة رقم: ${invoiceNumber}
${clientName ? `العميل: ${clientName}` : ""}
${blNumber ? `بوليصة الشحن: ${blNumber}` : ""}
المبلغ الإجمالي: ${formattedTotal} ${currency}

يمكنكم تحميل الفاتورة من الرابط:
${pdfUrl}

مع تحيات مازن للتخليص الجمركي`
    : `Hello,

Invoice No: ${invoiceNumber}
${clientName ? `Client: ${clientName}` : ""}
${blNumber ? `B/L No: ${blNumber}` : ""}
Total Amount: ${formattedTotal} ${currency}

Download invoice:
${pdfUrl}

Regards,
Mazin Customs Clearance`

  const handleCopyMessage = async () => {
    await navigator.clipboard.writeText(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = () => {
    if (!phone) return

    startTransition(async () => {
      try {
        await shareInvoiceViaWhatsApp(invoiceId, phone, locale)

        // Open WhatsApp
        const cleanPhone = phone.replace(/\D/g, "")
        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
        window.open(whatsappUrl, "_blank")

        setOpen(false)
      } catch (error) {
        console.error("Failed to share via WhatsApp:", error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <MessageCircle className="h-4 w-4 me-2" />
          {isRtl ? "واتساب" : "WhatsApp"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isRtl ? "مشاركة عبر واتساب" : "Share via WhatsApp"}
          </DialogTitle>
          <DialogDescription>
            {isRtl
              ? "أرسل الفاتورة للعميل عبر واتساب"
              : "Send the invoice to your client via WhatsApp"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phone">
              {isRtl ? "رقم الهاتف" : "Phone Number"}
            </Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+249912345678"
              dir="ltr"
            />
            <p className="text-xs text-muted-foreground">
              {isRtl
                ? "أدخل الرقم مع رمز الدولة (مثال: 249 للسودان)"
                : "Include country code (e.g., 249 for Sudan)"}
            </p>
          </div>

          {/* Message Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{isRtl ? "معاينة الرسالة" : "Message Preview"}</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCopyMessage}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 me-1" />
                    {isRtl ? "تم النسخ" : "Copied"}
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 me-1" />
                    {isRtl ? "نسخ" : "Copy"}
                  </>
                )}
              </Button>
            </div>
            <Textarea
              value={message}
              readOnly
              rows={10}
              className="text-sm"
              dir={isRtl ? "rtl" : "ltr"}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            {isRtl ? "إلغاء" : "Cancel"}
          </Button>
          <Button onClick={handleShare} disabled={!phone || isPending}>
            {isPending ? (
              isRtl ? "جاري الإرسال..." : "Sending..."
            ) : (
              <>
                <ExternalLink className="h-4 w-4 me-2" />
                {isRtl ? "فتح واتساب" : "Open WhatsApp"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
