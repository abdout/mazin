"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react"
import Link from "next/link"

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
import type { Client, Invoice } from "@prisma/client"

export type ClientWithInvoices = Client & {
  invoices: Pick<Invoice, "id">[]
}

interface GetColumnsOptions {
  dictionary: Dictionary
  locale: Locale
  onDelete: (id: string) => void
  onToggleStatus: (id: string) => void
}

export function getClientColumns({
  dictionary,
  locale,
  onDelete,
  onToggleStatus,
}: GetColumnsOptions): ColumnDef<ClientWithInvoices>[] {
  return [
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
    },
    {
      accessorKey: "companyName",
      header: dictionary.customer?.companyName || "Company Name",
      cell: ({ row }) => (
        <Link
          href={`/${locale}/customer/${row.original.id}`}
          className="text-primary hover:underline font-medium"
        >
          {row.original.companyName}
        </Link>
      ),
    },
    {
      accessorKey: "contactName",
      header: dictionary.customer?.contactName || "Contact",
      cell: ({ row }) => row.original.contactName || "-",
    },
    {
      accessorKey: "email",
      header: dictionary.common?.email || "Email",
      cell: ({ row }) => row.original.email || "-",
    },
    {
      accessorKey: "phone",
      header: dictionary.common?.phone || "Phone",
      cell: ({ row }) => row.original.phone || "-",
    },
    {
      accessorKey: "isActive",
      header: dictionary.customer?.isActive || "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "default" : "secondary"}>
          {row.original.isActive
            ? dictionary.customer?.active || "Active"
            : dictionary.customer?.inactive || "Inactive"}
        </Badge>
      ),
    },
    {
      id: "invoiceCount",
      header: dictionary.customer?.invoiceCount || "Invoices",
      cell: ({ row }) => (
        <span className="tabular-nums">{row.original.invoices.length}</span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const client = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/${locale}/customer/${client.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  {dictionary.common?.edit || "Edit"}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleStatus(client.id)}>
                {client.isActive ? (
                  <>
                    <ToggleLeft className="mr-2 h-4 w-4" />
                    {dictionary.customer?.inactive || "Deactivate"}
                  </>
                ) : (
                  <>
                    <ToggleRight className="mr-2 h-4 w-4" />
                    {dictionary.customer?.active || "Activate"}
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(client.id)}
                className="text-destructive focus:text-destructive"
                disabled={client.invoices.length > 0}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {dictionary.common?.delete || "Delete"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
