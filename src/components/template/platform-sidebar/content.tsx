"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useLocale } from "@/components/internationalization"
import type { Dictionary, Locale } from "@/components/internationalization"
import { platformNav, type Role } from "./config"
import { Icons } from "./icons"

interface PlatformSidebarProps extends React.ComponentProps<typeof Sidebar> {
  dictionary: Dictionary
  locale: Locale
  userRole?: string
}

export default function PlatformSidebar({
  dictionary,
  locale,
  userRole = "USER",
  ...props
}: PlatformSidebarProps) {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()
  const { isRTL } = useLocale()
  const currentRole = userRole as Role

  const handleLinkClick = React.useCallback(() => {
    setOpenMobile(false)
  }, [setOpenMobile])

  return (
    <Sidebar
      {...props}
      className="top-16 w-56 px-2"
      collapsible="offcanvas"
      side={isRTL ? "right" : "left"}
    >
      <SidebarContent className="border-0 bg-transparent">
        <SidebarGroup className="p-2 pb-16">
          <SidebarMenu className="list-none space-y-1">
            {platformNav
              .filter((item) => item.roles.includes(currentRole))
              .map((item) => {
                const localizedHref = `/${locale}${item.href}`
                const isActive =
                  pathname === localizedHref ||
                  pathname?.startsWith(localizedHref + "/")

                const sidebarDict = dictionary?.navigation as
                  | Record<string, string>
                  | undefined
                const translatedTitle =
                  sidebarDict?.[item.title.toLowerCase()] || item.title

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} size="sm">
                      <Link
                        href={localizedHref}
                        className="muted"
                        onClick={handleLinkClick}
                      >
                        <span className="inline-flex size-4 items-center justify-center">
                          {(() => {
                            const Icon = Icons[item.icon]
                            if (item.className) {
                              return Icon ? (
                                <Icon className={item.className} />
                              ) : null
                            }
                            return Icon ? <Icon className="h-4 w-4" /> : null
                          })()}
                        </span>
                        {translatedTitle}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
