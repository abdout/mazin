"use client"

import * as React from "react"
import type { Table } from "@tanstack/react-table"
import { Download, Mail, Trash2 } from "lucide-react"
import { IconCircleCheckFilled } from "@tabler/icons-react"

import { Separator } from "@/components/ui/separator"
import type { Dictionary } from "@/components/internationalization"
import {
  DataTableActionBar,
  DataTableActionBarAction,
  DataTableActionBarSelection,
} from "@/components/table/data-table-action-bar"
import { exportTableToCSV } from "@/components/table/lib/export"

import type { InvoiceWithRelations } from "./columns"

interface InvoiceActionBarProps {
  table: Table<InvoiceWithRelations>
  dictionary: Dictionary
  onMarkPaid: (ids: string[]) => Promise<void>
  onDelete: (ids: string[]) => Promise<void>
  onSendEmail?: (ids: string[]) => void
}

export function InvoiceActionBar({
  table,
  dictionary,
  onMarkPaid,
  onDelete,
  onSendEmail,
}: InvoiceActionBarProps) {
  const [isPending, startTransition] = React.useTransition()

  const rows = table.getFilteredSelectedRowModel().rows
  const selectedIds = rows.map((row) => row.original.id)

  // Filter invoices that can be marked as paid (not already paid or cancelled)
  const canMarkPaid = rows.filter(
    (row) =>
      row.original.status !== "PAID" && row.original.status !== "CANCELLED"
  )

  const handleMarkPaid = () => {
    startTransition(async () => {
      const ids = canMarkPaid.map((row) => row.original.id)
      await onMarkPaid(ids)
      table.toggleAllRowsSelected(false)
    })
  }

  const handleExport = () => {
    exportTableToCSV(table, {
      filename: "invoices",
      excludeColumns: ["select", "actions"],
      onlySelected: true,
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      await onDelete(selectedIds)
      table.toggleAllRowsSelected(false)
    })
  }

  const handleSendEmail = () => {
    onSendEmail?.(selectedIds)
  }

  return (
    <DataTableActionBar table={table}>
      <DataTableActionBarSelection table={table} />
      <Separator orientation="vertical" className="h-5" />
      <div className="flex items-center gap-1.5">
        {canMarkPaid.length > 0 && (
          <DataTableActionBarAction
            tooltip={dictionary.invoices?.markAsPaid || "Mark as Paid"}
            onClick={handleMarkPaid}
            isPending={isPending}
          >
            <IconCircleCheckFilled className="size-3.5" />
            <span className="hidden sm:inline">
              {dictionary.invoices?.markAsPaid || "Mark as Paid"}
            </span>
          </DataTableActionBarAction>
        )}

        {onSendEmail && (
          <DataTableActionBarAction
            tooltip={dictionary.invoices?.sendEmail || "Send Email"}
            onClick={handleSendEmail}
            isPending={isPending}
          >
            <Mail className="size-3.5" />
          </DataTableActionBarAction>
        )}

        <DataTableActionBarAction
          tooltip={dictionary.common?.export || "Export"}
          onClick={handleExport}
        >
          <Download className="size-3.5" />
        </DataTableActionBarAction>

        <DataTableActionBarAction
          tooltip={dictionary.common?.delete || "Delete"}
          variant="destructive"
          onClick={handleDelete}
          isPending={isPending}
        >
          <Trash2 className="size-3.5" />
        </DataTableActionBarAction>
      </div>
    </DataTableActionBar>
  )
}
