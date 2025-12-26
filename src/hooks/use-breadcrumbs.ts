"use client"

import { useMemo } from "react"
import { usePathname } from "next/navigation"

export interface BreadcrumbItem {
  title: string
  link: string
}

const routeTitles: Record<string, string> = {
  dashboard: "Dashboard",
  shipments: "Shipments",
  customs: "Customs",
  invoices: "Invoices",
  settings: "Settings",
  new: "New",
  edit: "Edit",
}

export function useBreadcrumbs(): BreadcrumbItem[] {
  const pathname = usePathname()

  return useMemo(() => {
    if (!pathname) return []

    const segments = pathname.split("/").filter(Boolean)

    // Remove locale segment (first segment like 'en' or 'ar')
    const isLocale = segments[0]?.length === 2
    const pathSegments = isLocale ? segments.slice(1) : segments
    const locale = isLocale ? segments[0] : "en"

    if (pathSegments.length === 0) return []

    const breadcrumbs: BreadcrumbItem[] = []
    let currentPath = `/${locale}`

    for (const segment of pathSegments) {
      currentPath += `/${segment}`

      // Skip UUID-like segments (for detail pages)
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          segment
        )
      if (isUuid) {
        breadcrumbs.push({
          title: "Details",
          link: currentPath,
        })
        continue
      }

      // Get title from mapping or capitalize segment
      const title =
        routeTitles[segment] ||
        segment.charAt(0).toUpperCase() + segment.slice(1)

      breadcrumbs.push({
        title,
        link: currentPath,
      })
    }

    return breadcrumbs
  }, [pathname])
}
