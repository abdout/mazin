"use client"

import * as React from "react"
import { LayoutGrid, List } from "lucide-react"
import { Button } from "@/components/ui/button"

export type ViewMode = "table" | "grid"

interface ViewToggleProps {
  view?: ViewMode
  value?: ViewMode
  onViewChange?: (view: ViewMode) => void
  onChange?: (view: ViewMode) => void
  storageKey?: string
  defaultValue?: ViewMode
}

export function ViewToggle({
  view,
  value,
  onViewChange,
  onChange,
}: ViewToggleProps) {
  const currentView = value ?? view ?? "table"
  const handleChange = onChange ?? onViewChange ?? (() => {})

  return (
    <div className="flex items-center gap-1">
      <Button
        variant={currentView === "table" ? "secondary" : "ghost"}
        size="icon"
        onClick={() => handleChange("table")}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant={currentView === "grid" ? "secondary" : "ghost"}
        size="icon"
        onClick={() => handleChange("grid")}
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
    </div>
  )
}
