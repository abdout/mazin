"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { LogIn, LogOut, Settings, User, LayoutDashboard } from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Dictionary } from "@/components/internationalization/types"

interface UserButtonProps {
  className?: string
  dictionary?: Dictionary
}

export function UserButton({ className, dictionary }: UserButtonProps) {
  const { data: session, status } = useSession()
  const pathname = usePathname()

  const locale = pathname.split("/")[1] || "ar"
  const loginUrl = `/${locale}/login`

  if (status === "loading") {
    return (
      <Button variant="ghost" size="icon" className={cn("size-8", className)}>
        <div className="size-4 animate-pulse rounded-full bg-muted" />
      </Button>
    )
  }

  if (!session?.user) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn("size-8", className)}
        asChild
      >
        <Link href={loginUrl}>
          <LogIn className="size-4 rtl:-scale-x-100" />
          <span className="sr-only">{dictionary?.auth?.login ?? "Login"}</span>
        </Link>
      </Button>
    )
  }

  const user = session.user
  const userInitials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email?.charAt(0).toUpperCase() || "U"

  const displayName = user.name || user.email?.split("@")[0] || (dictionary?.users?.name ?? "User")
  const displayEmail = user.email || ""

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("size-8", className)}>
          <Avatar className="size-5">
            <AvatarFallback className="bg-primary text-primary-foreground text-[8px] font-medium">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <span className="sr-only">{dictionary?.common?.actions ?? "User menu"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" sideOffset={8}>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm leading-none font-medium">{displayName}</p>
            <p className="text-muted-foreground text-xs leading-none">
              {displayEmail}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href={`/${locale}/dashboard`}>
              <LayoutDashboard className="size-4" />
              {dictionary?.navigation?.dashboard ?? "Dashboard"}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href={`/${locale}/profile`}>
              <User className="size-4" />
              {dictionary?.settings?.profile ?? "Profile"}
              <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href={`/${locale}/settings`}>
              <Settings className="size-4" />
              {dictionary?.navigation?.settings ?? "Settings"}
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          onClick={() => signOut({ callbackUrl: `/${locale}` })}
        >
          <LogOut className="size-4 rtl:-scale-x-100" />
          {dictionary?.navigation?.logout ?? "Logout"}
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
