"use client"

import * as React from "react"
import type { Table } from "@tanstack/react-table"
import {
  IconTrash,
  IconUserCheck,
  IconUserOff,
  IconDownload,
  IconX,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { Dictionary } from "@/components/internationalization"
import { DataTableActionBar } from "@/components/table/data-table-action-bar"
import { exportTableToCSV } from "@/components/table/utils"

import type { ClientWithInvoices } from "./columns"

interface ClientActionBarProps {
  table: Table<ClientWithInvoices>
  dictionary: Dictionary
  onActivate?: (ids: string[]) => Promise<void>
  onDeactivate?: (ids: string[]) => Promise<void>
  onDelete?: (ids: string[]) => Promise<void>
}

export function ClientActionBar({
  table,
  dictionary,
  onActivate,
  onDeactivate,
  onDelete,
}: ClientActionBarProps) {
  const rows = table.getFilteredSelectedRowModel().rows
  const [isPending, startTransition] = React.useTransition()

  // Keyboard shortcuts
  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (rows.length === 0) return

      if (event.key === "Escape") {
        table.toggleAllRowsSelected(false)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [rows.length, table])

  const handleActivate = () => {
    startTransition(async () => {
      const ids = rows.map((row) => row.original.id)
      await onActivate?.(ids)
      toast.success(`${ids.length} customer(s) activated`)
      table.toggleAllRowsSelected(false)
    })
  }

  const handleDeactivate = () => {
    startTransition(async () => {
      const ids = rows.map((row) => row.original.id)
      await onDeactivate?.(ids)
      toast.success(`${ids.length} customer(s) deactivated`)
      table.toggleAllRowsSelected(false)
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      const deletableRows = rows.filter(
        (row) => row.original.invoices.length === 0
      )
      if (deletableRows.length === 0) {
        toast.error("Selected customers have invoices and cannot be deleted")
        return
      }
      const ids = deletableRows.map((row) => row.original.id)
      await onDelete?.(ids)
      toast.success(`${ids.length} customer(s) deleted`)
      table.toggleAllRowsSelected(false)
    })
  }

  const handleExport = () => {
    exportTableToCSV(table, {
      filename: "customers",
      excludeColumns: ["select", "actions"],
      onlySelected: true,
    })
    toast.success("Exported successfully")
  }

  return (
    <DataTableActionBar table={table} visible={rows.length > 0}>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {rows.length} {dictionary.common?.selected || "selected"}
        </span>
        <Separator orientation="vertical" className="h-4" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleActivate}
              disabled={isPending}
            >
              <IconUserCheck className="size-4 me-1" />
              Activate
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Activate selected customers</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDeactivate}
              disabled={isPending}
            >
              <IconUserOff className="size-4 me-1" />
              Deactivate
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Deactivate selected customers</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleExport}
              disabled={isPending}
            >
              <IconDownload className="size-4 me-1" />
              {dictionary.common?.export || "Export"}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Export selected to CSV</p>
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-4" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              <IconTrash className="size-4 me-1" />
              {dictionary.common?.delete || "Delete"}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Delete selected (only customers without invoices)</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => table.toggleAllRowsSelected(false)}
              disabled={isPending}
            >
              <IconX className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Clear selection (Esc)</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </DataTableActionBar>
  )
}
