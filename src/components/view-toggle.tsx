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
    <Button
      variant="outline"
      size="icon"
      className="rounded-full"
      onClick={() => handleChange(currentView === "table" ? "grid" : "table")}
    >
      {currentView === "table" ? (
        <LayoutGrid className="h-4 w-4" />
      ) : (
        <List className="h-4 w-4" />
      )}
    </Button>
  )
}
