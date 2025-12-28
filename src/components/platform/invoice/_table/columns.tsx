"use client"

import * as React from "react"
import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { IconDotsVertical } from "@tabler/icons-react"
import type { InvoiceStatus, Client, Shipment } from "@prisma/client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Dictionary, Locale } from "@/components/internationalization"
import { DataTableColumnHeader } from "@/components/table/data-table-column-header"
import type { DataTableRowAction } from "@/components/table/types/data-table"

import {
  currencyOptions,
  invoiceStatusConfig,
  invoiceStatusOptions,
  type InvoiceStatusKey,
} from "./config"

// Serialized type with number instead of Decimal (after JSON serialization)
export interface InvoiceItemSerialized {
  id: string
  createdAt: Date
  updatedAt: Date
  description: string
  quantity: number
  unitPrice: number
  total: number
  invoiceId: string
}

export interface InvoiceWithRelations {
  id: string
  invoiceNumber: string
  status: InvoiceStatus
  currency: string
  subtotal: number
  tax: number
  total: number
  taxRate: number | null
  dueDate: Date | null
  paidAt: Date | null
  notes: string | null
  paymentTermsDays: number | null
  taxLabel: string | null
  referenceNumber: string | null
  termsAndConditions: string | null
  createdAt: Date
  updatedAt: Date
  userId: string
  clientId: string | null
  shipmentId: string | null
  items: InvoiceItemSerialized[]
  client: Client | null
  shipment: Shipment | null
}

interface GetInvoiceColumnsProps {
  dictionary: Dictionary
  locale: Locale
  statusCounts: Record<string, number>
  totalRange: { min: number; max: number }
  setRowAction: (action: DataTableRowAction<InvoiceWithRelations> | null) => void
  onMarkPaid?: (id: string) => void
  onDelete?: (id: string) => void
}

export function getInvoiceColumns({
  dictionary,
  locale,
  statusCounts,
  totalRange,
  setRowAction,
  onMarkPaid,
  onDelete,
}: GetInvoiceColumnsProps): ColumnDef<InvoiceWithRelations>[] {
  return [
    // Select column
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },

    // Invoice Number
    {
      id: "invoiceNumber",
      accessorKey: "invoiceNumber",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={dictionary.invoices?.invoiceNumber || "Invoice #"}
        />
      ),
      cell: ({ row }) => (
        <Link
          href={`/${locale}/invoice/${row.original.id}`}
          className="font-medium hover:underline"
        >
          {row.original.invoiceNumber}
        </Link>
      ),
      enableGlobalFilter: true,
    },

    // Status
    {
      id: "status",
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={dictionary.invoices?.status || "Status"}
        />
      ),
      cell: ({ row }) => {
        const status = row.original.status as InvoiceStatusKey
        const config = invoiceStatusConfig[status]
        const StatusIcon = config.icon
        const label =
          dictionary.invoices?.statuses?.[status as keyof typeof dictionary.invoices.statuses] ||
          config.label
        return (
          <Badge className={config.className}>
            <StatusIcon className="size-3 me-1" />
            {label}
          </Badge>
        )
      },
      meta: {
        label: dictionary.invoices?.status || "Status",
        variant: "multiSelect",
        options: invoiceStatusOptions.map((option) => ({
          ...option,
          label:
            dictionary.invoices?.statuses?.[option.value as keyof typeof dictionary.invoices.statuses] ||
            option.label,
          count: statusCounts[option.value] || 0,
        })),
      },
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        return Array.isArray(value) && value.includes(row.getValue(id))
      },
    },

    // Client
    {
      id: "client",
      accessorFn: (row) => row.client?.companyName || "-",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={dictionary.invoices?.client || "Client"}
        />
      ),
      cell: ({ row }) => (
        <span className="truncate max-w-[200px]">
          {row.original.client?.companyName || "-"}
        </span>
      ),
      enableGlobalFilter: true,
    },

    // Total
    {
      id: "total",
      accessorKey: "total",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={dictionary.invoices?.total || "Total"}
        />
      ),
      cell: ({ row }) => {
        const total = Number(row.original.total)
        const formatted = total.toLocaleString(locale === "ar" ? "ar-SA" : "en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
        return (
          <span className="font-medium tabular-nums">
            {row.original.currency} {formatted}
          </span>
        )
      },
      meta: {
        label: dictionary.invoices?.total || "Total",
        variant: "range",
        range: [totalRange.min, totalRange.max],
      },
      enableColumnFilter: true,
    },

    // Currency
    {
      id: "currency",
      accessorKey: "currency",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={dictionary.invoices?.currency || "Currency"}
        />
      ),
      cell: ({ row }) => <span>{row.original.currency}</span>,
      meta: {
        label: dictionary.invoices?.currency || "Currency",
        variant: "multiSelect",
        options: currencyOptions,
      },
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        return Array.isArray(value) && value.includes(row.getValue(id))
      },
    },

    // Due Date
    {
      id: "dueDate",
      accessorKey: "dueDate",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={dictionary.invoices?.dueDate || "Due Date"}
        />
      ),
      cell: ({ row }) => {
        const date = row.original.dueDate
        if (!date) return <span>-</span>
        return (
          <span>
            {new Date(date).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US")}
          </span>
        )
      },
      meta: {
        label: dictionary.invoices?.dueDate || "Due Date",
        variant: "dateRange",
      },
      enableColumnFilter: true,
    },

    // Created At
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={dictionary.common?.createdAt || "Created"}
        />
      ),
      cell: ({ row }) => (
        <span>
          {new Date(row.original.createdAt).toLocaleDateString(
            locale === "ar" ? "ar-SA" : "en-US"
          )}
        </span>
      ),
      meta: {
        label: dictionary.common?.createdAt || "Created",
        variant: "dateRange",
      },
      enableColumnFilter: true,
    },

    // Actions
    {
      id: "actions",
      cell: ({ row }) => {
        const invoice = row.original
        const canEdit = invoice.status !== "PAID" && invoice.status !== "CANCELLED"

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <IconDotsVertical className="size-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/${locale}/invoice/${invoice.id}`}>
                  {dictionary.common?.view || "View"}
                </Link>
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuItem asChild>
                  <Link href={`/${locale}/invoice/${invoice.id}/edit`}>
                    {dictionary.common?.edit || "Edit"}
                  </Link>
                </DropdownMenuItem>
              )}
              {invoice.status !== "PAID" && (
                <DropdownMenuItem onClick={() => onMarkPaid?.(invoice.id)}>
                  {dictionary.invoices?.markAsPaid || "Mark as Paid"}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() =>
                  setRowAction({ row, variant: "delete" })
                }
              >
                {dictionary.common?.delete || "Delete"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
  ]
}
