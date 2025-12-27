"use client"

import * as React from "react"
import { useCallback, useState } from "react"
import {
  ChevronDown,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  Loader2,
} from "lucide-react"
import type { Table } from "@tanstack/react-table"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type ExportFormat = "csv" | "excel" | "json"

export interface ExportColumn {
  key: string
  header: string
  accessor?: (row: unknown) => string | number | boolean | null | undefined
}

export interface ExportButtonProps {
  /** Data to export */
  data?: unknown[]
  /** TanStack table instance (alternative to data) */
  table?: Table<unknown>
  /** File name without extension */
  filename?: string
  /** Export columns configuration */
  columns?: ExportColumn[]
  /** Enabled export formats */
  formats?: ExportFormat[]
  /** Button variant */
  variant?: "default" | "outline" | "ghost" | "secondary"
  /** Button size */
  size?: "default" | "sm" | "lg" | "icon"
  /** Custom button text */
  label?: string
  /** Disabled state */
  disabled?: boolean
  /** Custom class name */
  className?: string
  /** Export only selected rows */
  onlySelected?: boolean
  /** Columns to exclude */
  excludeColumns?: string[]
  /** Callback on export complete */
  onExportComplete?: () => void
  /** Callback on export error */
  onExportError?: (error: string) => void
}

const formatIcons: Record<ExportFormat, React.ReactNode> = {
  csv: <FileText className="me-2 h-4 w-4" />,
  excel: <FileSpreadsheet className="me-2 h-4 w-4" />,
  json: <FileJson className="me-2 h-4 w-4" />,
}

const formatLabels: Record<ExportFormat, string> = {
  csv: "CSV",
  excel: "Excel",
  json: "JSON",
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function escapeCSVValue(value: unknown): string {
  if (value === null || value === undefined) return ""
  const str = String(value)
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function ExportButton({
  data,
  table,
  filename = "export",
  columns,
  formats = ["csv", "json"],
  variant = "outline",
  size = "sm",
  label,
  disabled = false,
  className,
  onlySelected = false,
  excludeColumns = ["select", "actions"],
  onExportComplete,
  onExportError,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  // Get data from table or props
  const getExportData = useCallback(() => {
    if (table) {
      const rows = onlySelected
        ? table.getFilteredSelectedRowModel().rows
        : table.getRowModel().rows
      return rows.map((row) => row.original)
    }
    return data || []
  }, [table, data, onlySelected])

  // Get columns from table or props
  const getExportColumns = useCallback((): ExportColumn[] => {
    if (columns) return columns

    if (table) {
      return table
        .getAllColumns()
        .filter((col) => !excludeColumns.includes(col.id) && col.getCanHide())
        .map((col) => ({
          key: col.id,
          header:
            typeof col.columnDef.header === "string"
              ? col.columnDef.header
              : col.id,
        }))
    }

    // Auto-detect from data
    const exportData = getExportData()
    if (exportData.length > 0 && typeof exportData[0] === "object") {
      return Object.keys(exportData[0] as object)
        .filter((key) => !excludeColumns.includes(key))
        .map((key) => ({ key, header: key }))
    }

    return []
  }, [columns, table, excludeColumns, getExportData])

  // Export to CSV
  const exportToCSV = useCallback(() => {
    const exportData = getExportData()
    const exportColumns = getExportColumns()

    if (exportData.length === 0) {
      onExportError?.("No data to export")
      return
    }

    // Build CSV content
    const headers = exportColumns.map((col) => escapeCSVValue(col.header))
    const rows = exportData.map((row) =>
      exportColumns
        .map((col) => {
          const value = col.accessor
            ? col.accessor(row)
            : (row as Record<string, unknown>)[col.key]
          return escapeCSVValue(value)
        })
        .join(",")
    )

    const csvContent = [headers.join(","), ...rows].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    downloadBlob(blob, `${filename}.csv`)
  }, [getExportData, getExportColumns, filename, onExportError])

  // Export to JSON
  const exportToJSON = useCallback(() => {
    const exportData = getExportData()

    if (exportData.length === 0) {
      onExportError?.("No data to export")
      return
    }

    const jsonString = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonString], { type: "application/json" })
    downloadBlob(blob, `${filename}.json`)
  }, [getExportData, filename, onExportError])

  // Export to Excel (uses CSV format, opens in Excel)
  const exportToExcel = useCallback(async () => {
    try {
      // Dynamic import xlsx for Excel support
      const XLSX = await import("xlsx")
      const exportData = getExportData()
      const exportColumns = getExportColumns()

      if (exportData.length === 0) {
        onExportError?.("No data to export")
        return
      }

      // Transform data with column headers
      const worksheetData = exportData.map((row) => {
        const obj: Record<string, unknown> = {}
        exportColumns.forEach((col) => {
          const value = col.accessor
            ? col.accessor(row)
            : (row as Record<string, unknown>)[col.key]
          obj[col.header] = value
        })
        return obj
      })

      const worksheet = XLSX.utils.json_to_sheet(worksheetData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data")
      XLSX.writeFile(workbook, `${filename}.xlsx`)
    } catch {
      // Fallback to CSV if xlsx not available
      exportToCSV()
    }
  }, [getExportData, getExportColumns, filename, onExportError, exportToCSV])

  // Handle export
  const handleExport = useCallback(
    async (format: ExportFormat) => {
      setIsExporting(true)

      try {
        switch (format) {
          case "csv":
            exportToCSV()
            break
          case "excel":
            await exportToExcel()
            break
          case "json":
            exportToJSON()
            break
        }
        onExportComplete?.()
      } catch (error) {
        onExportError?.(
          error instanceof Error ? error.message : "Export failed"
        )
      } finally {
        setIsExporting(false)
      }
    },
    [exportToCSV, exportToExcel, exportToJSON, onExportComplete, onExportError]
  )

  const exportData = getExportData()
  const isEmpty = exportData.length === 0

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={disabled || isExporting || isEmpty}
          className={cn(className)}
        >
          {isExporting ? (
            <>
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="me-2 h-4 w-4" />
              {label || "Export"}
              <ChevronDown className="ms-2 h-4 w-4" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="text-muted-foreground px-2 py-1.5 text-sm font-semibold">
          Export as
        </div>
        <DropdownMenuSeparator />
        {formats.map((format) => (
          <DropdownMenuItem
            key={format}
            onClick={() => handleExport(format)}
            disabled={isExporting}
          >
            {formatIcons[format]}
            {formatLabels[format]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
