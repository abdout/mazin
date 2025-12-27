"use client"

import * as React from "react"
import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { IconDotsVertical, IconMail, IconPhone } from "@tabler/icons-react"
import type { Client, Invoice } from "@prisma/client"

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

import { clientStatusConfig, clientStatusOptions } from "./config"

export type ClientWithInvoices = Client & {
  invoices: Pick<Invoice, "id">[]
}

interface GetClientColumnsProps {
  dictionary: Dictionary
  locale: Locale
  statusCounts: Record<string, number>
  setRowAction: (action: DataTableRowAction<ClientWithInvoices> | null) => void
  onToggleStatus?: (id: string) => void
  onDelete?: (id: string) => void
}

export function getClientColumns({
  dictionary,
  locale,
  statusCounts,
  setRowAction,
  onToggleStatus,
  onDelete,
}: GetClientColumnsProps): ColumnDef<ClientWithInvoices>[] {
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

    // Company Name
    {
      id: "companyName",
      accessorKey: "companyName",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={dictionary.customer?.companyName || "Company Name"}
        />
      ),
      cell: ({ row }) => (
        <Link
          href={`/${locale}/customer/${row.original.id}`}
          className="font-medium hover:underline"
        >
          {row.original.companyName}
        </Link>
      ),
      meta: {
        label: dictionary.customer?.companyName || "Company Name",
        placeholder: dictionary.customer?.searchPlaceholder || "Search customers...",
        variant: "text",
      },
      enableColumnFilter: true,
    },

    // Contact Name
    {
      id: "contactName",
      accessorKey: "contactName",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={dictionary.customer?.contactName || "Contact"}
        />
      ),
      cell: ({ row }) => (
        <span className="truncate max-w-[150px]">
          {row.original.contactName || "-"}
        </span>
      ),
      meta: {
        label: dictionary.customer?.contactName || "Contact",
        variant: "text",
      },
      enableColumnFilter: true,
    },

    // Email
    {
      id: "email",
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={dictionary.common?.email || "Email"}
        />
      ),
      cell: ({ row }) => {
        const email = row.original.email
        if (!email) return <span>-</span>
        return (
          <a
            href={`mailto:${email}`}
            className="flex items-center gap-1 hover:underline text-muted-foreground"
          >
            <IconMail className="size-3" />
            <span className="truncate max-w-[150px]">{email}</span>
          </a>
        )
      },
      meta: {
        label: dictionary.common?.email || "Email",
        variant: "text",
      },
      enableColumnFilter: true,
    },

    // Phone
    {
      id: "phone",
      accessorKey: "phone",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={dictionary.common?.phone || "Phone"}
        />
      ),
      cell: ({ row }) => {
        const phone = row.original.phone
        if (!phone) return <span>-</span>
        return (
          <a
            href={`tel:${phone}`}
            className="flex items-center gap-1 hover:underline text-muted-foreground"
          >
            <IconPhone className="size-3" />
            <span>{phone}</span>
          </a>
        )
      },
      meta: {
        label: dictionary.common?.phone || "Phone",
        variant: "text",
      },
    },

    // Status
    {
      id: "isActive",
      accessorKey: "isActive",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={dictionary.customer?.isActive || "Status"}
        />
      ),
      cell: ({ row }) => {
        const isActive = row.original.isActive
        const config = isActive ? clientStatusConfig.active : clientStatusConfig.inactive
        const StatusIcon = config.icon
        const label = isActive
          ? dictionary.customer?.active || "Active"
          : dictionary.customer?.inactive || "Inactive"
        return (
          <Badge className={config.className}>
            <StatusIcon className="size-3 me-1" />
            {label}
          </Badge>
        )
      },
      meta: {
        label: dictionary.customer?.isActive || "Status",
        variant: "multiSelect",
        options: clientStatusOptions.map((option) => ({
          ...option,
          label: option.value === "true"
            ? dictionary.customer?.active || "Active"
            : dictionary.customer?.inactive || "Inactive",
          count: statusCounts[option.value] || 0,
        })),
      },
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        return Array.isArray(value) && value.includes(String(row.getValue(id)))
      },
    },

    // Invoice Count
    {
      id: "invoiceCount",
      accessorFn: (row) => row.invoices.length,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={dictionary.customer?.invoiceCount || "Invoices"}
        />
      ),
      cell: ({ row }) => (
        <span className="tabular-nums">{row.original.invoices.length}</span>
      ),
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
        const client = row.original
        const hasInvoices = client.invoices.length > 0

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
                <Link href={`/${locale}/customer/${client.id}`}>
                  {dictionary.common?.view || "View"}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/${locale}/customer/${client.id}/edit`}>
                  {dictionary.common?.edit || "Edit"}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleStatus?.(client.id)}>
                {client.isActive ? "Deactivate" : "Activate"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                disabled={hasInvoices}
                onClick={() =>
                  setRowAction({ row, variant: "delete" })
                }
              >
                {dictionary.common?.delete || "Delete"}
                {hasInvoices && " (has invoices)"}
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
