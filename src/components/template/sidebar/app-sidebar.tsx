"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Ship,
  FileText,
  Receipt,
  Settings,
  Users,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"
import type { Dictionary, Locale } from "@/components/internationalization"

interface AppSidebarProps {
  dictionary: Dictionary
  locale: Locale
}

export function AppSidebar({ dictionary, locale }: AppSidebarProps) {
  const pathname = usePathname()

  const mainNav = [
    {
      title: dictionary.navigation.dashboard,
      href: `/${locale}/dashboard`,
      icon: LayoutDashboard,
    },
    {
      title: dictionary.navigation.shipments,
      href: `/${locale}/shipments`,
      icon: Ship,
    },
    {
      title: dictionary.navigation.customs,
      href: `/${locale}/customs`,
      icon: FileText,
    },
    {
      title: dictionary.navigation.invoices,
      href: `/${locale}/invoices`,
      icon: Receipt,
    },
  ]

  const settingsNav = [
    {
      title: dictionary.navigation.users,
      href: `/${locale}/settings/users`,
      icon: Users,
    },
    {
      title: dictionary.navigation.settings,
      href: `/${locale}/settings`,
      icon: Settings,
    },
  ]

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href={`/${locale}/dashboard`} className="flex items-center gap-2">
          <Ship className="h-6 w-6" />
          <span className="font-bold text-lg">{dictionary.common.appName}</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.href)}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.href)}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <p className="text-xs text-muted-foreground">
          Port Sudan Logistics
        </p>
      </SidebarFooter>
    </Sidebar>
  )
}
