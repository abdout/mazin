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
      // Server action no longer throws — returns a structured result so we
      // can show the user-facing copy without leaking Prisma error strings.
      const result = await deleteClient(id)
      if (result.success) {
        toast.success(dictionary.common?.success ?? "")
      } else {
        toast.error(result.error || dictionary.common?.error || "")
      }
    })
  }

  const handleToggleStatus = (id: string) => {
    startTransition(async () => {
      const result = await toggleClientStatus(id)
      if (result.success) {
        toast.success(dictionary.common?.success ?? "")
      } else {
        toast.error(result.error || dictionary.common?.error || "")
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
