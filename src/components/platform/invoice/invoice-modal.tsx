"use client"

import * as React from "react"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { Dictionary, Locale } from "@/components/internationalization"
import type { Shipment, Invoice, InvoiceItem } from "@prisma/client"
import { InvoiceForm } from "./invoice-form"

type InvoiceWithItems = Invoice & { items: InvoiceItem[] }

interface InvoiceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dictionary: Dictionary
  locale: Locale
  shipments?: Shipment[]
  invoice?: InvoiceWithItems
  mode?: "create" | "edit"
}

// Custom hook for managing body scroll
function useBodyScroll(open: boolean) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [open])
}

export function InvoiceModal({
  open,
  onOpenChange,
  dictionary,
  locale,
  shipments = [],
  invoice,
  mode = "create",
}: InvoiceModalProps) {
  useBodyScroll(open)

  const handleSuccess = React.useCallback(() => {
    // Auto-close after success with small delay for feedback
    setTimeout(() => {
      onOpenChange(false)
    }, 300)
  }, [onOpenChange])

  const handleClose = React.useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  if (!open) return null

  const title = mode === "edit"
    ? (dictionary.invoices?.editInvoice || "Edit Invoice")
    : (dictionary.invoices?.newInvoice || "New Invoice")

  const description = mode === "edit"
    ? (dictionary.invoices?.description || "Update the invoice details below")
    : (dictionary.invoices?.description || "Fill in the details to create a new invoice")

  return (
    <>
      {/* Backdrop */}
      <div
        className="bg-opacity-70 fixed inset-0 z-40 h-screen w-full bg-black"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 h-screen w-full">
        <div className="bg-background relative z-50 flex h-screen w-full flex-col overflow-y-auto">
          {/* Close button */}
          <div className="absolute end-4 top-4 z-10 sm:end-8 md:end-12">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="rounded-full"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </Button>
          </div>

          {/* Main content area - vertically centered */}
          <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8 md:px-12">
            <div className="w-full max-w-6xl">
              {/* Listings-style two-column layout */}
              <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-16">
                {/* LEFT: Title + Description */}
                <div className="space-y-4">
                  <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
                  <p className="text-muted-foreground text-base leading-relaxed sm:text-lg">
                    {description}
                  </p>
                </div>

                {/* RIGHT: Form Content */}
                <div className="flex-1">
                  <InvoiceForm
                    dictionary={dictionary}
                    locale={locale}
                    shipments={shipments}
                    invoice={invoice}
                    mode={mode}
                    isModal
                    onSuccess={handleSuccess}
                    onCancel={handleClose}
                  />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  )
}
