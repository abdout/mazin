"use client"

import { useState, useTransition } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table"
import { toast } from "sonner"

import { DataTable } from "@/components/table/data-table"
import { DataTableToolbar } from "@/components/table/data-table-toolbar"
import type { Dictionary, Locale } from "@/components/internationalization"
import { getClientColumns, type ClientWithInvoices } from "./columns"
import { deleteClient, toggleClientStatus } from "./actions"

interface CustomerTableProps {
  data: ClientWithInvoices[]
  dictionary: Dictionary
  locale: Locale
}

export function CustomerTable({ data, dictionary, locale }: CustomerTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState({})
  const [isPending, startTransition] = useTransition()

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteClient(id)
        toast.success(dictionary.common?.success || "Customer deleted successfully")
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : dictionary.common?.error || "Failed to delete customer"
        )
      }
    })
  }

  const handleToggleStatus = (id: string) => {
    startTransition(async () => {
      try {
        await toggleClientStatus(id)
        toast.success(dictionary.common?.success || "Status updated")
      } catch (error) {
        toast.error(dictionary.common?.error || "Failed to update status")
      }
    })
  }

  const columns = getClientColumns({
    dictionary,
    locale,
    onDelete: handleDelete,
    onToggleStatus: handleToggleStatus,
  })

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  })

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
    </DataTable>
  )
}
