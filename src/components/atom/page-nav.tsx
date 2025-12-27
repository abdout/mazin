"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

export interface PageNavItem {
  name: string
  href: string
  hidden?: boolean
}

interface PageNavProps extends React.HTMLAttributes<HTMLDivElement> {
  pages: PageNavItem[]
  defaultPage?: PageNavItem
}

export function PageNav({
  pages,
  defaultPage,
  className,
  ...props
}: PageNavProps) {
  const pathname = usePathname()

  const isPageActive = (pageHref: string) => {
    const normalizedPath = pathname.replace(/\/$/, "")
    const normalizedHref = pageHref.replace(/\/$/, "")
    return normalizedPath === normalizedHref
  }

  return (
    <div className={cn("border-b", className)} {...props}>
      <ScrollArea className="max-w-[600px] lg:max-w-none">
        <nav className="flex items-center gap-6 rtl:flex-row-reverse">
          {defaultPage && (
            <PageLink
              page={defaultPage}
              isActive={isPageActive(defaultPage.href)}
            />
          )}
          {pages.map((page) => (
            <PageLink
              key={page.href}
              page={page}
              isActive={isPageActive(page.href)}
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
}: {
  page: PageNavItem
  isActive: boolean
}) {
  if (page.hidden) {
    return null
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
        <span className="bg-primary absolute right-0 bottom-0 left-0 h-0.5" />
      )}
    </Link>
  )
}
