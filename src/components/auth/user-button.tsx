"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { ExitIcon } from "@radix-ui/react-icons"
import { LogIn, Settings, User } from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { LogoutButton } from "@/components/auth/logout-button"
import { useCurrentUser } from "./use-current-user"
import type { Dictionary } from "@/components/internationalization"

interface UserButtonProps {
  className?: string
  dictionary?: Dictionary
}

export const UserButton = ({ className, dictionary }: UserButtonProps) => {
  const user = useCurrentUser()
  const params = useParams()
  const locale = (params?.lang as string) || "en"

  const loginUrl = `/${locale}/login`

  if (!user) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn("size-7", className)}
        asChild
      >
        <Link href={loginUrl}>
          <LogIn className="size-4 rtl:-scale-x-100" />
          <span className="sr-only">{dictionary?.auth?.login || "Login"}</span>
        </Link>
      </Button>
    )
  }

  const userInitials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email?.charAt(0).toUpperCase() || "U"

  const displayName = user.name || user.email?.split("@")[0] || "User"
  const displayEmail = user.email || ""

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("size-7", className)}>
          <Avatar className="size-4">
            <AvatarImage src={user.image || ""} alt={displayName} />
            <AvatarFallback className="bg-primary text-primary-foreground text-[8px] font-medium">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <span className="sr-only">{dictionary?.navigation?.userMenu || "User menu"}</span>
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
            <Link href={`/${locale}/profile`}>
              <User />
              {dictionary?.settings?.profile || "Profile"}
              <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href={`/${locale}/settings`}>
              <Settings />
              {dictionary?.settings?.title || "Settings"}
              <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <LogoutButton>
          <DropdownMenuItem variant="destructive" className="cursor-pointer">
            <ExitIcon />
            {dictionary?.auth?.logout || "Logout"}
            <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
          </DropdownMenuItem>
        </LogoutButton>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
