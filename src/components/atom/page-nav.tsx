"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

import { cn } from "@/lib/utils"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

export interface PageNavItem {
  name: string
  href: string
  hidden?: boolean
  comingSoon?: boolean
}

interface PageNavProps extends React.HTMLAttributes<HTMLDivElement> {
  pages: PageNavItem[]
  defaultPage?: PageNavItem
  comingSoonLabel?: string
}

export function PageNav({
  pages,
  defaultPage,
  comingSoonLabel = "Soon",
  className,
  ...props
}: PageNavProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const isPageActive = (pageHref: string) => {
    // Parse the href to get pathname and query params
    const url = new URL(pageHref, "http://localhost")
    const hrefPathname = url.pathname.replace(/\/$/, "")
    const normalizedPath = pathname.replace(/\/$/, "")

    // Check if pathnames match
    if (normalizedPath !== hrefPathname) return false

    // Check if it's the base path (no query params in href)
    if (!url.search) {
      // Active only if current URL also has no relevant query params
      return searchParams.size === 0
    }

    // Compare query params
    const hrefParams = url.searchParams
    for (const [key, value] of hrefParams) {
      if (searchParams.get(key) !== value) return false
    }
    return true
  }

  return (
    <div className={cn("border-b", className)} {...props}>
      <ScrollArea className="max-w-[600px] lg:max-w-none">
        <nav className="flex items-center gap-6">
          {defaultPage && (
            <PageLink
              page={defaultPage}
              isActive={isPageActive(defaultPage.href)}
              comingSoonLabel={comingSoonLabel}
            />
          )}
          {pages.map((page) => (
            <PageLink
              key={page.href}
              page={page}
              isActive={isPageActive(page.href)}
              comingSoonLabel={comingSoonLabel}
            />
          ))}
        </nav>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>
    </div>
  )
}

function PageLink({
  page,
  isActive,
  comingSoonLabel,
}: {
  page: PageNavItem
  isActive: boolean
  comingSoonLabel: string
}) {
  if (page.hidden) {
    return null
  }

  if (page.comingSoon) {
    return (
      <span
        key={page.href}
        className={cn(
          "relative inline-flex cursor-not-allowed items-center gap-1.5 px-1 pb-3 text-sm font-medium whitespace-nowrap",
          "text-muted-foreground/60"
        )}
        aria-disabled="true"
        title={comingSoonLabel}
      >
        {page.name}
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium leading-none",
            "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
          )}
        >
          {comingSoonLabel}
        </span>
      </span>
    )
  }

  return (
    <Link
      href={page.href}
      key={page.href}
      className={cn(
        "hover:text-primary relative px-1 pb-3 text-sm font-medium whitespace-nowrap transition-colors",
        isActive ? "text-primary" : "text-muted-foreground"
      )}
    >
      {page.name}
      {isActive && (
        <span className="bg-primary absolute inset-x-0 bottom-0 h-0.5" />
      )}
    </Link>
  )
}
