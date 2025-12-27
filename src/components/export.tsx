"use client"

import * as React from "react"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface ExportButtonProps extends Omit<React.ComponentProps<typeof Button>, "onClick"> {
  data?: unknown[]
  filename?: string
  onExport?: (format: "csv" | "json" | "xlsx") => void
}

export function ExportButton({
  data = [],
  filename = "export",
  onExport,
  variant = "outline",
  size = "sm",
  ...props
}: ExportButtonProps) {
  const handleExport = (format: "csv" | "json" | "xlsx") => {
    if (onExport) {
      onExport(format)
      return
    }

    // Default CSV export
    if (format === "csv" && data.length > 0) {
      const headers = Object.keys(data[0] as object)
      const csvContent = [
        headers.join(","),
        ...data.map((row) =>
          headers
            .map((header) => {
              const value = (row as Record<string, unknown>)[header]
              return typeof value === "string" && value.includes(",")
                ? `"${value}"`
                : String(value ?? "")
            })
            .join(",")
        ),
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = `${filename}.csv`
      link.click()
    }

    // Default JSON export
    if (format === "json") {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = `${filename}.json`
      link.click()
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} {...props}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("csv")}>
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("json")}>
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
