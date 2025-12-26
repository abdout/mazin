"use client"

import { LaptopIcon, MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Dictionary } from "@/components/internationalization/types"

interface ModeToggleProps {
  dictionary?: Dictionary
}

export function ModeToggle({ dictionary }: ModeToggleProps) {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <SunIcon className="dark:-rotate-90 size-5 rotate-0 scale-100 transition-all dark:scale-0" />
          <MoonIcon className="absolute size-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">{dictionary?.settings?.toggleTheme ?? "Toggle theme"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <SunIcon className="me-2 size-4" />
          <span>{dictionary?.settings?.light ?? "Light"}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <MoonIcon className="me-2 size-4" />
          <span>{dictionary?.settings?.dark ?? "Dark"}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <LaptopIcon className="me-2 size-4" />
          <span>{dictionary?.settings?.system ?? "System"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
