"use client"

import { useMemo } from "react"
import { usePathname } from "next/navigation"
import { Search } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useLocale, type Dictionary, type Locale } from "@/components/internationalization"
import { LanguageSwitcher } from "@/components/atom/language-switcher"
import { ModeSwitcher } from "@/components/template/site-header/mode-switcher"
import { UserButton } from "@/components/auth/user-button"
import { MobileNav } from "@/components/template/mobile-nav"
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs"
import { platformNav, type Role } from "@/components/template/platform-sidebar/config"
import { usePageHeading } from "@/components/platform/context/page-heading-context"

interface PlatformHeaderProps {
  dictionary: Dictionary
  locale: Locale
  userRole?: string
}

export default function PlatformHeader({
  dictionary,
  locale,
  userRole = "USER",
}: PlatformHeaderProps) {
  const breadcrumbItems = useBreadcrumbs()
  const { isRTL } = useLocale()
  const pathname = usePathname()
  const role = userRole as Role

  let pageHeading = null
  try {
    const context = usePageHeading()
    pageHeading = context.heading
  } catch {
    // PageHeading context not available
  }

  const mobileNavItems = useMemo(() => {
    return platformNav
      .filter((item) => item.roles.includes(role))
      .map((item) => ({
        href: item.href,
        label:
          (dictionary?.navigation as Record<string, string>)?.[
            item.title.toLowerCase()
          ] || item.title,
      }))
  }, [role, dictionary])

  // Enhanced breadcrumbs that replace "Details" with actual page heading when available
  const enhancedBreadcrumbs = useMemo(() => {
    if (!pageHeading?.title) return breadcrumbItems

    return breadcrumbItems.map((item, index) => {
      // Replace the last breadcrumb item's title if it's "Details"
      if (index === breadcrumbItems.length - 1 && item.title === "Details") {
        return { ...item, title: pageHeading.title }
      }
      return item
    })
  }, [breadcrumbItems, pageHeading])

  return (
    <div className="bg-background sticky top-0 z-40">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b px-8">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ms-1.5 hidden size-7 lg:flex" />
          <MobileNav
            items={mobileNavItems}
            className="flex lg:hidden"
            dictionary={dictionary}
            locale={locale}
          />
          <div className="hidden items-center md:flex">
            {breadcrumbItems.length > 0 && (
              <Breadcrumb>
                <BreadcrumbList className="flex items-center space-x-1 rtl:space-x-reverse">
                  {breadcrumbItems.map((item, index) => {
                    const titleKey = item.title.toLowerCase()
                    const breadcrumbDict = dictionary?.navigation as
                      | Record<string, string>
                      | undefined
                    const translatedTitle =
                      breadcrumbDict?.[titleKey] || item.title

                    return (
                      <div key={item.title} className="flex items-center">
                        {index !== breadcrumbItems.length - 1 && (
                          <BreadcrumbItem className="flex items-center">
                            <BreadcrumbLink
                              href={item.link}
                              className="flex items-center"
                            >
                              {translatedTitle}
                            </BreadcrumbLink>
                          </BreadcrumbItem>
                        )}
                        {index < breadcrumbItems.length - 1 && (
                          <BreadcrumbSeparator className="ms-2 hidden md:block" />
                        )}
                        {index === breadcrumbItems.length - 1 && (
                          <BreadcrumbPage className="flex items-center">
                            {translatedTitle}
                          </BreadcrumbPage>
                        )}
                      </div>
                    )
                  })}
                </BreadcrumbList>
              </Breadcrumb>
            )}
          </div>
        </div>
        <div className="ms-auto flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="size-7 hidden sm:flex"
            title={dictionary.common.search}
          >
            <Search className="h-4 w-4" />
            <span className="sr-only">{dictionary.common.search}</span>
          </Button>
          <LanguageSwitcher variant="icon" />
          <ModeSwitcher />
          <UserButton dictionary={dictionary} />
        </div>
      </header>
    </div>
  )
}
