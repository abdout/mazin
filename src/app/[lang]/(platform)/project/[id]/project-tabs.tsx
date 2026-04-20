'use client'

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface Tab {
  label: string
  path: string
}

interface ProjectTabsProps {
  tabs: Tab[]
  basePath: string
}

const ProjectTabs: React.FC<ProjectTabsProps> = ({ tabs, basePath }) => {
  const pathname = usePathname()

  const isActive = (tabPath: string) => {
    if (tabPath === '') {
      return pathname === basePath || pathname === `${basePath}/`
    }
    return pathname.startsWith(`${basePath}${tabPath}`)
  }

  return (
    <nav className="border-b px-4">
      <div className="flex gap-1 overflow-x-auto">
        {tabs.map((tab) => (
          <Link
            key={tab.path}
            href={`${basePath}${tab.path}`}
            className={cn(
              "px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
              isActive(tab.path)
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}

export default ProjectTabs
