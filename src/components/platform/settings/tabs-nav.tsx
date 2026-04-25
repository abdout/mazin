// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import type { Dictionary } from "@/components/internationalization/types"

type Locale = "ar" | "en"

interface SettingsTabsNavProps {
  locale: Locale
  dictionary: Dictionary
}

/**
 * Horizontal tab bar for /settings/*. Uses next/link for route-based nav so
 * each tab is a real page — refresh-safe, SSR-hydrated, and server-fetched.
 * The active tab is derived from the pathname's last settings segment.
 */
export function SettingsTabsNav({ locale, dictionary }: SettingsTabsNavProps) {
  const pathname = usePathname()

  // Strip locale + leading slashes → e.g. "settings", "settings/organization"
  const rel = (pathname ?? "")
    .replace(new RegExp(`^/${locale}`), "")
    .replace(/^\//, "")

  const activeTab =
    rel === "settings" ? "profile" : (rel.split("/")[1] ?? "profile")

  const labels = dictionary.settings?.tabs
  const tabs: Array<{ key: string; href: string; label: string }> = [
    {
      key: "profile",
      href: `/${locale}/settings`,
      label: labels?.profile ?? dictionary.settings?.profile ?? "Profile",
    },
    {
      key: "organization",
      href: `/${locale}/settings/organization`,
      label: labels?.organization ?? "Organization",
    },
    {
      key: "security",
      href: `/${locale}/settings/security`,
      label: labels?.security ?? "Security",
    },
    {
      key: "team",
      href: `/${locale}/settings/team`,
      label: labels?.team ?? "Team",
    },
    {
      key: "notifications",
      href: `/${locale}/settings/notifications`,
      label: labels?.notifications ?? "Notifications",
    },
    {
      key: "integrations",
      href: `/${locale}/settings/integrations`,
      label: labels?.integrations ?? "Integrations",
    },
  ]

  return (
    <div className="border-b">
      <nav
        className="flex gap-1 overflow-x-auto"
        aria-label={dictionary.settings?.title ?? "Settings"}
      >
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab
          return (
            <Link
              key={tab.key}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "border-b-2 border-transparent px-3 py-2 text-sm font-medium transition-colors",
                "hover:text-foreground",
                isActive
                  ? "border-primary text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
