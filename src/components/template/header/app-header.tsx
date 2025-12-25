"use client"

import { signOut } from "next-auth/react"
import { LogOut, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  type Dictionary,
  type Locale,
  i18n,
  localeConfig,
  useSwitchLocaleHref,
} from "@/components/internationalization"
import Link from "next/link"

interface AppHeaderProps {
  dictionary: Dictionary
  locale: Locale
  user: {
    id: string
    email: string
    name: string | null
    role: string
  }
}

export function AppHeader({ dictionary, locale, user }: AppHeaderProps) {
  const switchLocaleHref = useSwitchLocaleHref()

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-6" />

      <div className="flex-1" />

      {/* Language Switcher */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <Globe className="h-4 w-4" />
            <span>{localeConfig[locale].flag}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{dictionary.settings.language}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {i18n.locales.map((loc) => (
            <DropdownMenuItem key={loc} asChild>
              <Link href={switchLocaleHref(loc)} className="cursor-pointer">
                <span className="me-2">{localeConfig[loc].flag}</span>
                {localeConfig[loc].nativeName}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {getInitials(user.name, user.email)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline">{user.name || user.email}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span>{user.name || user.email}</span>
              <span className="text-xs text-muted-foreground font-normal">
                {dictionary.users.roles[user.role as keyof typeof dictionary.users.roles]}
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={`/${locale}/settings`}>
              {dictionary.navigation.settings}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive cursor-pointer"
            onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
          >
            <LogOut className="h-4 w-4 me-2" />
            {dictionary.navigation.logout}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
