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
import { updateInvoiceStatus, deleteInvoice } from "@/actions/invoice"

import { getInvoiceColumns, type InvoiceWithRelations } from "./columns"
import { InvoiceCard } from "./card"
import { InvoiceActionBar } from "./action-bar"
import type { getInvoices, getInvoiceStatusCounts, getInvoiceTotalRange } from "./queries"

interface InvoicesTableProps {
  promises: Promise<
    [
      Awaited<ReturnType<typeof getInvoices>>,
      Awaited<ReturnType<typeof getInvoiceStatusCounts>>,
      Awaited<ReturnType<typeof getInvoiceTotalRange>>,
    ]
  >
  dictionary: Dictionary
  locale: Locale
}

export function InvoicesTable({
  promises,
  dictionary,
  locale,
}: InvoicesTableProps) {
  // Unwrap promises with React.use
  const [{ data, pageCount }, statusCounts, totalRange] = React.use(promises)

  // Row action state (for update/delete dialogs)
  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<InvoiceWithRelations> | null>(null)

  // Memoize columns
  const columns = React.useMemo(
    () =>
      getInvoiceColumns({
        dictionary,
        locale,
        statusCounts,
        totalRange,
        setRowAction,
        onMarkPaid: async (id) => {
          await updateInvoiceStatus(id, "PAID")
        },
        onDelete: async (id) => {
          await deleteInvoice(id)
        },
      }),
    [dictionary, locale, statusCounts, totalRange]
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
  const handleMarkPaid = async (ids: string[]) => {
    await Promise.all(ids.map((id) => updateInvoiceStatus(id, "PAID")))
  }

  const handleDelete = async (ids: string[]) => {
    await Promise.all(ids.map((id) => deleteInvoice(id)))
  }

  return (
    <>
      <DataTableEnhanced
        table={table}
        toolbar={{
          showViewToggle: true,
          showExport: true,
          customActions: (
            <Link href={`/${locale}/invoice/new`}>
              <Button size="sm">
                <Plus className="h-4 w-4 me-1" />
                {dictionary.invoices?.newInvoice || "New Invoice"}
              </Button>
            </Link>
          ),
        }}
        exportConfig={{
          data: data,
          filename: "invoices",
        }}
        viewMode={{
          enabled: true,
          defaultMode: "table",
          storageKey: "invoices-view-mode",
          renderCard: (invoice) => (
            <InvoiceCard
              invoice={invoice}
              dictionary={dictionary}
              locale={locale}
            />
          ),
        }}
        actionBar={
          <InvoiceActionBar
            table={table}
            dictionary={dictionary}
            onMarkPaid={handleMarkPaid}
            onDelete={handleDelete}
          />
        }
        emptyMessage={dictionary.invoices?.noInvoices || "No invoices found."}
      />

      {/* Delete confirmation dialog can be added here if needed */}
    </>
  )
}

// Loading skeleton
export function InvoicesTableSkeleton() {
  return (
    <DataTableSkeleton
      columnCount={8}
      rowCount={10}
      filterCount={3}
      cellWidths={["2rem", "8rem", "6rem", "10rem", "6rem", "5rem", "6rem", "2rem"]}
      shrinkZero
    />
  )
}
