"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconDashboard,
  IconFileDescription,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListCheck,
  IconReceipt,
  IconSettings,
  IconShip,
} from "@tabler/icons-react"

import { NavMain } from "./nav-main"
import { NavSecondary } from "./nav-secondary"
import { NavUser } from "./nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import type { Dictionary, Locale } from "@/components/internationalization"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  dictionary: Dictionary
  locale: Locale
  user: {
    id: string
    email: string
    name: string | null
    role: string
  }
}

export function AppSidebar({ dictionary, locale, user, ...props }: AppSidebarProps) {
  const navMainItems = [
    {
      title: dictionary.navigation.dashboard,
      url: `/${locale}/dashboard`,
      icon: IconDashboard,
    },
    {
      title: dictionary.navigation.project,
      url: `/${locale}/project`,
      icon: IconFolder,
    },
    {
      title: dictionary.navigation.task,
      url: `/${locale}/task`,
      icon: IconListCheck,
    },
    {
      title: dictionary.navigation.shipments,
      url: `/${locale}/shipments`,
      icon: IconShip,
    },
    {
      title: dictionary.navigation.customs,
      url: `/${locale}/customs`,
      icon: IconFileDescription,
    },
    {
      title: dictionary.navigation.invoices,
      url: `/${locale}/invoices`,
      icon: IconReceipt,
    },
  ]

  const navSecondaryItems = [
    {
      title: dictionary.navigation.settings,
      url: `/${locale}/settings`,
      icon: IconSettings,
    },
    {
      title: dictionary.navigation.help || "Help",
      url: "#",
      icon: IconHelp,
    },
  ]

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href={`/${locale}/dashboard`}>
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">{dictionary.common.appName}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainItems} locale={locale} dictionary={dictionary} />
        <NavSecondary items={navSecondaryItems} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} dictionary={dictionary} locale={locale} />
      </SidebarFooter>
    </Sidebar>
  )
}
