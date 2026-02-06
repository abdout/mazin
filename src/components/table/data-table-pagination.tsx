import * as React from "react"
import type { Table } from "@tanstack/react-table"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Dictionary } from "@/components/internationalization"

interface DataTablePaginationProps<TData> extends React.ComponentProps<"div"> {
  table: Table<TData>
  pageSizeOptions?: number[]
  dictionary?: Dictionary
}

function DataTablePaginationInner<TData>({
  table,
  pageSizeOptions = [10, 20, 30, 40, 50],
  dictionary,
  className,
  ...props
}: DataTablePaginationProps<TData>) {
  const t = dictionary?.table

  return (
    <div
      className={cn(
        "flex w-full flex-col-reverse items-center justify-between gap-4 overflow-auto p-1 sm:flex-row sm:gap-8",
        className
      )}
      {...props}
    >
      <div className="text-muted-foreground muted flex-1 whitespace-nowrap">
        {table.getFilteredSelectedRowModel().rows.length} {t?.of || "of"}{" "}
        {table.getFilteredRowModel().rows.length} {t?.rowsSelected || "row(s) selected."}
      </div>
      <div className="flex flex-col-reverse items-center gap-4 sm:flex-row sm:gap-6 lg:gap-8">
        <div className="flex items-center gap-2">
          <p className="muted font-medium whitespace-nowrap">{t?.rowsPerPage || "Rows per page"}</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value))
            }}
          >
            <SelectTrigger className="h-8 w-[4.5rem] [&[data-size]]:h-8">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="muted flex items-center justify-center font-medium">
          {t?.page || "Page"} {table.getState().pagination.pageIndex + 1} {t?.of || "of"}{" "}
          {table.getPageCount()}
        </div>
        <div className="flex items-center gap-2">
          <Button
            aria-label={t?.goToFirstPage || "Go to first page"}
            variant="outline"
            size="icon"
            className="hidden size-8 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft />
          </Button>
          <Button
            aria-label={t?.goToPreviousPage || "Go to previous page"}
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft />
          </Button>
          <Button
            aria-label={t?.goToNextPage || "Go to next page"}
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight />
          </Button>
          <Button
            aria-label={t?.goToLastPage || "Go to last page"}
            variant="outline"
            size="icon"
            className="hidden size-8 lg:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  )
}

export const DataTablePagination = React.memo(
  DataTablePaginationInner
) as typeof DataTablePaginationInner
