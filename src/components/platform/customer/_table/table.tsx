"use client"

import * as React from "react"
import Link from "next/link"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { Dictionary, Locale } from "@/components/internationalization"
import { DataTableEnhanced } from "@/components/table/data-table-enhanced"
import { DataTableSkeleton } from "@/components/table/data-table-skeleton"
import { useDataTable } from "@/components/table/use-data-table"
import type { DataTableRowAction } from "@/components/table/types/data-table"
import { toggleClientStatus, deleteClient } from "@/components/platform/customer/actions"

import { getClientColumns, type ClientWithInvoices } from "./columns"
import { ClientCard } from "./card"
import { ClientActionBar } from "./action-bar"
import type { getClients, getClientStatusCounts } from "./queries"

interface ClientsTableProps {
  promises: Promise<
    [
      Awaited<ReturnType<typeof getClients>>,
      Awaited<ReturnType<typeof getClientStatusCounts>>,
    ]
  >
  dictionary: Dictionary
  locale: Locale
}

export function ClientsTable({
  promises,
  dictionary,
  locale,
}: ClientsTableProps) {
  // Unwrap promises with React.use
  const [{ data, pageCount }, statusCounts] = React.use(promises)

  // Row action state (for update/delete dialogs)
  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<ClientWithInvoices> | null>(null)

  // Memoize columns
  const columns = React.useMemo(
    () =>
      getClientColumns({
        dictionary,
        locale,
        statusCounts,
        setRowAction,
        onToggleStatus: async (id) => {
          await toggleClientStatus(id)
        },
        onDelete: async (id) => {
          await deleteClient(id)
        },
      }),
    [dictionary, locale, statusCounts]
  )

  // Initialize table
  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    initialState: {
      sorting: [{ id: "createdAt", desc: true }],
      columnPinning: { right: ["actions"] },
    },
    getRowId: (row) => row.id,
    shallow: false,
    clearOnDefault: true,
  })

  // Bulk action handlers
  const handleActivate = async (ids: string[]) => {
    // Toggle to active (assuming they're inactive)
    await Promise.all(ids.map((id) => toggleClientStatus(id)))
  }

  const handleDeactivate = async (ids: string[]) => {
    // Toggle to inactive (assuming they're active)
    await Promise.all(ids.map((id) => toggleClientStatus(id)))
  }

  const handleDelete = async (ids: string[]) => {
    await Promise.all(ids.map((id) => deleteClient(id)))
  }

  return (
    <>
      <DataTableEnhanced
        table={table}
        toolbar={{
          showViewToggle: true,
          showExport: true,
          customActions: (
            <Link href={`/${locale}/customer/new`}>
              <Button size="sm">
                <Plus className="h-4 w-4 me-1" />
                {dictionary.customer?.newCustomer || "New Customer"}
              </Button>
            </Link>
          ),
        }}
        exportConfig={{
          data: data,
          filename: "customers",
        }}
        viewMode={{
          enabled: true,
          defaultMode: "table",
          storageKey: "customers-view-mode",
          renderCard: (client) => (
            <ClientCard
              client={client}
              dictionary={dictionary}
              locale={locale}
            />
          ),
        }}
        actionBar={
          <ClientActionBar
            table={table}
            dictionary={dictionary}
            onActivate={handleActivate}
            onDeactivate={handleDeactivate}
            onDelete={handleDelete}
          />
        }
        emptyMessage={dictionary.customer?.noCustomers || "No customers found."}
      />

      {/* Delete confirmation dialog can be added here if needed */}
    </>
  )
}

// Loading skeleton
export function ClientsTableSkeleton() {
  return (
    <DataTableSkeleton
      columnCount={8}
      rowCount={10}
      filterCount={3}
      cellWidths={["2rem", "10rem", "8rem", "10rem", "8rem", "5rem", "4rem", "2rem"]}
      shrinkZero
    />
  )
}
