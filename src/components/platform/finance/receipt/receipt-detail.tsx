/**
 * Receipt Detail Component
 * Displays full receipt information with image/PDF preview
 * Follows Hogwarts component pattern
 */

"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
  Calendar,
  CircleAlert,
  CircleCheck,
  Clock,
  DollarSign,
  Download,
  FileText,
  LoaderCircle,
  MapPin,
  Phone,
  RefreshCw,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

import type { Dictionary } from "@/components/internationalization"

import { deleteReceipt, retryReceiptExtraction } from "./actions"
import { ExpenseReceipt, ReceiptItem } from "./types"

interface ReceiptDetailProps {
  receipt: ExpenseReceipt
  locale?: string
  dict?: Dictionary
}

export function ReceiptDetail({ receipt, locale = "en", dict }: ReceiptDetailProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [isRetrying, setIsRetrying] = React.useState(false)

  const r = dict?.finance?.receipt
  const detail = r?.detail
  const statuses = r?.statuses

  const statusConfig = {
    pending: {
      label: statuses?.pending ?? "Pending",
      variant: "secondary" as const,
      icon: Clock,
    },
    processing: {
      label: statuses?.processing ?? "Processing",
      variant: "default" as const,
      icon: LoaderCircle,
    },
    processed: {
      label: statuses?.processed ?? "Processed",
      variant: "default" as const,
      icon: CircleCheck,
    },
    error: {
      label: statuses?.error ?? "Error",
      variant: "destructive" as const,
      icon: CircleAlert,
    },
  }

  const status = statusConfig[receipt.status]
  const StatusIcon = status.icon

  const handleDelete = async () => {
    if (
      !confirm(
        detail?.deleteConfirm ??
          "Are you sure you want to delete this receipt? This action cannot be undone."
      )
    ) {
      return
    }

    setIsDeleting(true)
    try {
      const result = await deleteReceipt(receipt.id)
      if (result.success) {
        toast.success(detail?.deleteSuccess ?? "Receipt deleted successfully")
        router.push("..")
        router.refresh()
      } else {
        toast.error(
          result.error ?? detail?.deleteFailed ?? "Failed to delete receipt"
        )
      }
    } catch (error) {
      toast.error(detail?.unexpectedError ?? "An unexpected error occurred")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleRetry = async () => {
    setIsRetrying(true)
    try {
      const result = await retryReceiptExtraction(receipt.id)
      if (result.success) {
        toast.success(
          detail?.retrySuccess ?? "Extraction retry started. Please wait..."
        )
        router.refresh()
      } else {
        toast.error(
          result.error ?? detail?.retryFailed ?? "Failed to retry extraction"
        )
      }
    } catch (error) {
      toast.error(detail?.unexpectedError ?? "An unexpected error occurred")
    } finally {
      setIsRetrying(false)
    }
  }

  const items: ReceiptItem[] = Array.isArray(receipt.items)
    ? receipt.items
    : receipt.items
      ? (receipt.items as any).items || []
      : []

  const uploadedLabel = (detail?.uploadedAt ?? "Uploaded {date}").replace(
    "{date}",
    format(new Date(receipt.uploadedAt), "PPP")
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold">
            {receipt.fileDisplayName || receipt.fileName}
          </h2>
          <p className="text-muted-foreground text-sm">{uploadedLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={status.variant} className="gap-1">
            <StatusIcon
              className={`h-3 w-3 ${receipt.status === "processing" ? "animate-spin" : ""}`}
            />
            {status.label}
          </Badge>
          {receipt.status === "error" && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleRetry}
              disabled={isRetrying}
            >
              {isRetrying ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <RefreshCw className="me-2 h-4 w-4" />
                  {detail?.retry ?? "Retry"}
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Receipt Image/PDF Preview */}
        <Card>
          <CardHeader>
            <CardTitle>{detail?.receiptImage ?? "Receipt Image"}</CardTitle>
          </CardHeader>
          <CardContent>
            {receipt.mimeType.startsWith("image/") ? (
              <img
                src={receipt.fileUrl}
                alt={receipt.fileName}
                className="w-full rounded-lg border"
              />
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border p-12">
                <FileText className="text-muted-foreground mb-4 h-16 w-16" />
                <p className="text-muted-foreground mb-4 text-sm">
                  {detail?.pdfDocument ?? "PDF Document"}
                </p>
                <Button variant="outline" asChild>
                  <a
                    href={receipt.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="me-2 h-4 w-4" />
                    {detail?.viewPdf ?? "View PDF"}
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Extracted Data */}
        <Card>
          <CardHeader>
            <CardTitle>{detail?.extractedData ?? "Extracted Data"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {receipt.status === "processed" ? (
              <>
                {receipt.merchantName && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <MapPin className="h-4 w-4" />
                      {detail?.merchant ?? "Merchant"}
                    </div>
                    <p className="ms-6 text-sm">{receipt.merchantName}</p>
                    {receipt.merchantAddress && (
                      <p className="text-muted-foreground ms-6 text-xs">
                        {receipt.merchantAddress}
                      </p>
                    )}
                  </div>
                )}

                {receipt.merchantContact && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Phone className="h-4 w-4" />
                      {detail?.contact ?? "Contact"}
                    </div>
                    <p className="ms-6 text-sm">{receipt.merchantContact}</p>
                  </div>
                )}

                {receipt.transactionDate && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Calendar className="h-4 w-4" />
                      {detail?.date ?? "Date"}
                    </div>
                    <p className="ms-6 text-sm">
                      {format(new Date(receipt.transactionDate), "PPP")}
                    </p>
                  </div>
                )}

                {receipt.transactionAmount !== null &&
                  receipt.transactionAmount !== undefined && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <DollarSign className="h-4 w-4" />
                        {detail?.amount ?? "Amount"}
                      </div>
                      <p className="ms-6 text-lg font-semibold">
                        {receipt.currency || "USD"}{" "}
                        {receipt.transactionAmount.toFixed(2)}
                      </p>
                    </div>
                  )}

                {receipt.receiptSummary && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {detail?.summary ?? "Summary"}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {receipt.receiptSummary}
                    </p>
                  </div>
                )}
              </>
            ) : receipt.status === "processing" ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <LoaderCircle className="text-primary mb-4 h-8 w-8 animate-spin" />
                <p className="text-muted-foreground text-sm">
                  {detail?.aiInProgress ?? "AI extraction in progress..."}
                </p>
              </div>
            ) : receipt.status === "error" ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <CircleAlert className="text-destructive mb-4 h-8 w-8" />
                <p className="text-muted-foreground mb-4 text-sm">
                  {detail?.extractionFailed ??
                    "Extraction failed. Please retry."}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <Clock className="text-muted-foreground mb-4 h-8 w-8" />
                <p className="text-muted-foreground text-sm">
                  {detail?.waitingExtraction ??
                    "Waiting for extraction to start..."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{detail?.lineItems ?? "Line Items"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index}>
                  <div className="flex items-start justify-between py-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {detail?.qty ?? "Qty"}: {item.quantity} ×{" "}
                        {receipt.currency || "USD"} {item.unitPrice.toFixed(2)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">
                      {receipt.currency || "USD"} {item.totalPrice.toFixed(2)}
                    </p>
                  </div>
                  {index < items.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={() => router.push("..")}>
          {detail?.backToList ?? "Back to List"}
        </Button>
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Trash2 className="me-2 h-4 w-4" />
              {detail?.delete ?? "Delete"}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
