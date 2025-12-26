"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  IconDotsVertical,
  IconCircleCheckFilled,
  IconClock,
  IconFileOff,
  IconSend,
  IconEdit,
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
} from "@/components/ui/dropdown-menu"
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

export function InvoiceTable({ data, dictionary, locale }: InvoiceTableProps) {
  const router = useRouter()
  const [rowSelection, setRowSelection] = React.useState({})

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
    data,
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

  return (
    <div className="space-y-4">
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
