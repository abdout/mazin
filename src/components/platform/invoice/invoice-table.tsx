"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  IconDotsVertical,
  IconCircleCheckFilled,
  IconClock,
  IconFileOff,
  IconSend,
  IconEdit,
  IconPlus,
  IconSearch,
  IconFilter,
  IconX,
} from "@tabler/icons-react"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Invoice, InvoiceItem, Shipment } from "@prisma/client"
import type { Dictionary, Locale } from "@/components/internationalization"
import { updateInvoiceStatus, deleteInvoice } from "@/actions/invoice"

type InvoiceWithRelations = Invoice & {
  items: InvoiceItem[]
  shipment: Shipment | null
}

interface InvoiceTableProps {
  data: InvoiceWithRelations[]
  dictionary: Dictionary
  locale: Locale
}

type IconComponent = React.ComponentType<{ className?: string }>

const statusConfig: Record<
  string,
  { icon: IconComponent; className: string }
> = {
  DRAFT: { icon: IconEdit, className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" },
  SENT: { icon: IconSend, className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
  PAID: { icon: IconCircleCheckFilled, className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
  OVERDUE: { icon: IconClock, className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" },
  CANCELLED: { icon: IconFileOff, className: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500" },
}

const statusOptions = [
  { value: "DRAFT", label: "Draft" },
  { value: "SENT", label: "Sent" },
  { value: "PAID", label: "Paid" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "CANCELLED", label: "Cancelled" },
]

export function InvoiceTable({ data, dictionary, locale }: InvoiceTableProps) {
  const router = useRouter()
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string[]>([])

  // Filter data based on status and global filter
  const filteredData = React.useMemo(() => {
    return data.filter((invoice) => {
      // Status filter
      if (statusFilter.length > 0 && !statusFilter.includes(invoice.status)) {
        return false
      }
      // Global search filter
      if (globalFilter) {
        const searchLower = globalFilter.toLowerCase()
        return (
          invoice.invoiceNumber.toLowerCase().includes(searchLower) ||
          invoice.status.toLowerCase().includes(searchLower) ||
          invoice.currency.toLowerCase().includes(searchLower)
        )
      }
      return true
    })
  }, [data, statusFilter, globalFilter])

  const columns: ColumnDef<InvoiceWithRelations>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value: boolean | "indeterminate") => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value: boolean | "indeterminate") => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "invoiceNumber",
      header: dictionary.invoices.invoiceNumber || "Invoice #",
      cell: ({ row }) => (
        <Button
          variant="link"
          className="p-0 h-auto font-medium"
          onClick={() => router.push(`/${locale}/invoices/${row.original.id}`)}
        >
          {row.original.invoiceNumber}
        </Button>
      ),
    },
    {
      accessorKey: "status",
      header: dictionary.shipments.status || "Status",
      cell: ({ row }) => {
        const status = row.original.status
        const config = statusConfig[status]
        const StatusIcon: IconComponent = config?.icon || IconEdit
        return (
          <Badge className={config?.className}>
            <StatusIcon className="size-3 me-1" />
            {dictionary.invoices.statuses?.[status as keyof typeof dictionary.invoices.statuses] || status}
          </Badge>
        )
      },
    },
    {
      accessorKey: "total",
      header: dictionary.invoices.total || "Total",
      cell: ({ row }) => (
        <span className="font-medium tabular-nums">
          {row.original.currency} {Number(row.original.total).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "dueDate",
      header: dictionary.invoices.dueDate || "Due Date",
      cell: ({ row }) =>
        row.original.dueDate
          ? new Date(row.original.dueDate).toLocaleDateString()
          : "-",
    },
    {
      accessorKey: "createdAt",
      header: dictionary.common.createdAt || "Created",
      cell: ({ row }) =>
        new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <IconDotsVertical className="size-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => router.push(`/${locale}/invoices/${row.original.id}`)}
            >
              {dictionary.common.view || "View"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push(`/${locale}/invoices/${row.original.id}/edit`)}
            >
              {dictionary.common.edit || "Edit"}
            </DropdownMenuItem>
            {row.original.status !== "PAID" && (
              <DropdownMenuItem
                onClick={() => updateInvoiceStatus(row.original.id, "PAID")}
              >
                {dictionary.invoices.markAsPaid || "Mark as Paid"}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => deleteInvoice(row.original.id)}
            >
              {dictionary.common.delete || "Delete"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
    },
  })

  const toggleStatusFilter = (status: string) => {
    setStatusFilter((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    )
  }

  const clearFilters = () => {
    setGlobalFilter("")
    setStatusFilter([])
  }

  const hasActiveFilters = globalFilter || statusFilter.length > 0

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Search and Filters */}
        <div className="flex flex-1 items-center gap-2">
          <div className="relative">
            <IconSearch className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              placeholder={dictionary.common.search || "Search..."}
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="h-9 w-40 pe-8 ps-9 lg:w-64"
            />
            {globalFilter && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1/2 right-1 size-6 -translate-y-1/2"
                onClick={() => setGlobalFilter("")}
              >
                <IconX className="size-3" />
              </Button>
            )}
          </div>

          {/* Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <IconFilter className="size-4 me-2" />
                {dictionary.shipments.status || "Status"}
                {statusFilter.length > 0 && (
                  <Badge variant="secondary" className="ms-2 rounded-full px-1.5">
                    {statusFilter.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {statusOptions.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={statusFilter.includes(option.value)}
                  onCheckedChange={() => toggleStatusFilter(option.value)}
                >
                  {dictionary.invoices.statuses?.[option.value as keyof typeof dictionary.invoices.statuses] || option.label}
                </DropdownMenuCheckboxItem>
              ))}
              {statusFilter.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setStatusFilter([])}>
                    {dictionary.common.all || "Clear filters"}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
              <IconX className="size-4 me-1" />
              {dictionary.common.all || "Clear"}
            </Button>
          )}
        </div>

        {/* Right: Add Invoice Button */}
        <Button asChild size="sm" className="h-9">
          <Link href={`/${locale}/invoices/new`}>
            <IconPlus className="size-4 me-1" />
            {dictionary.invoices.newInvoice || "New Invoice"}
          </Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {dictionary.common.noResults || "No results"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="text-muted-foreground text-sm">
          {table.getFilteredSelectedRowModel().rows.length} {dictionary.table?.of ?? "of"}{" "}
          {table.getFilteredRowModel().rows.length} {dictionary.table?.rowsSelected ?? "row(s) selected"}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {dictionary.common.previous || "Previous"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {dictionary.common.next || "Next"}
          </Button>
        </div>
      </div>
    </div>
  )
}
