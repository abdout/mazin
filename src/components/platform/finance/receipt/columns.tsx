/**
 * Data Table Columns for Receipts
 * Follows Hogwarts table pattern with client-side column generation
 */

"use client"

import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { Ellipsis, Eye, RefreshCw, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

import type { Dictionary, Locale } from "@/components/internationalization"

import { ExpenseReceipt } from "./types"
import { deleteReceipt, retryReceiptExtraction } from "./actions"

interface GetColumnsOptions {
  dictionary: Dictionary
  locale: Locale
}

export function getColumns({ dictionary, locale }: GetColumnsOptions): ColumnDef<ExpenseReceipt>[] {
  const f = dictionary.finance
  const dateLocale = locale === "ar" ? ar : enUS
  return [
    {
      accessorKey: "fileName",
      header: f?.columns?.fileName ?? "",
      cell: ({ row }) => {
        const receipt = row.original
        return (
          <div className="font-medium">
            {receipt.fileDisplayName || receipt.fileName}
          </div>
        )
      },
    },
    {
      accessorKey: "merchantName",
      header: f?.columns?.merchant ?? "",
      cell: ({ row }) => {
        const merchantName = row.getValue("merchantName") as string | null
        return merchantName || <span className="text-muted-foreground">—</span>
      },
    },
    {
      accessorKey: "transactionDate",
      header: f?.columns?.date ?? "",
      cell: ({ row }) => {
        const date = row.getValue("transactionDate") as Date | null
        return date ? (
          format(new Date(date), "PP", { locale: dateLocale })
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      },
    },
    {
      accessorKey: "transactionAmount",
      header: f?.columns?.amount ?? "",
      cell: ({ row }) => {
        const amount = row.getValue("transactionAmount") as number | null
        const currency = row.original.currency || "USD"
        return amount !== null ? (
          <span className="font-semibold">
            {currency} {amount.toFixed(2)}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      },
    },
    {
      accessorKey: "status",
      header: f?.columns?.status ?? "",
      cell: ({ row }) => {
        const status = row.getValue("status") as string

        const statusConfig = {
          pending: { label: f?.statuses?.PENDING ?? "", variant: "secondary" as const },
          processing: { label: f?.statuses?.PROCESSING ?? "", variant: "default" as const },
          processed: { label: f?.statuses?.PROCESSED ?? "", variant: "default" as const },
          error: { label: f?.statuses?.ERROR ?? "", variant: "destructive" as const },
        }

        const config =
          statusConfig[status as keyof typeof statusConfig] ||
          statusConfig.pending

        return <Badge variant={config.variant}>{config.label}</Badge>
      },
    },
    {
      accessorKey: "uploadedAt",
      header: f?.columns?.uploaded ?? "",
      cell: ({ row }) => {
        const date = row.getValue("uploadedAt") as Date
        return format(new Date(date), "PP", { locale: dateLocale })
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const receipt = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">{dictionary.common.openMenu ?? ""}</span>
                <Ellipsis className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{dictionary.common.actions ?? ""}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  // View details - will be handled by parent component
                  window.location.href = `/${locale}/receipts/${receipt.id}`
                }}
              >
                <Eye className="me-2 h-4 w-4" />
                {f?.viewDetails ?? ""}
              </DropdownMenuItem>
              {receipt.status === "error" && (
                <DropdownMenuItem
                  onClick={async () => {
                    const result = await retryReceiptExtraction(receipt.id)
                    if (result.success) toast.success(f?.retryExtraction ?? "Retry queued")
                    else toast.error(result.error ?? "Retry failed")
                  }}
                >
                  <RefreshCw className="me-2 h-4 w-4" />
                  {f?.retryExtraction ?? ""}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={async () => {
                  const result = await deleteReceipt(receipt.id)
                  if (result.success) toast.success(dictionary.common.delete ?? "Deleted")
                  else toast.error(result.error ?? "Delete failed")
                }}
              >
                <Trash2 className="me-2 h-4 w-4" />
                {dictionary.common.delete ?? ""}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
