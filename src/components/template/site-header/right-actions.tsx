"use client"

import { LanguageToggle } from "./language-toggle"
import { ModeSwitcher } from "./mode-switcher"
import { ReportIssue } from "@/components/report-issue"

export function RightActions() {
  return (
    <div className="flex items-center gap-4">
      <ReportIssue variant="icon" />
      <LanguageToggle />
      <ModeSwitcher />
    </div>
  )
}
