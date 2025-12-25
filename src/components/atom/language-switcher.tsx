"use client"

import Link from "next/link"
import { Languages } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  i18n,
  localeConfig,
  useSwitchLocaleHref,
  useLocale,
  type Locale,
} from "@/components/internationalization"

interface LanguageSwitcherProps {
  variant?: "icon" | "full" | "dropdown"
}

export function LanguageSwitcher({ variant = "dropdown" }: LanguageSwitcherProps) {
  const switchLocaleHref = useSwitchLocaleHref()
  const { locale } = useLocale()

  const currentConfig = localeConfig[locale]
  const targetLocale: Locale = locale === "ar" ? "en" : "ar"
  const targetConfig = localeConfig[targetLocale]

  if (variant === "icon") {
    return (
      <Button
        asChild
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        title={`Switch to ${targetConfig.nativeName}`}
      >
        <Link href={switchLocaleHref(targetLocale)}>
          <Languages className="h-4 w-4" />
          <span className="sr-only">Switch to {targetConfig.nativeName}</span>
        </Link>
      </Button>
    )
  }

  if (variant === "full") {
    return (
      <Button asChild variant="outline" size="sm" className="gap-2">
        <Link href={switchLocaleHref(targetLocale)}>
          <span>{targetConfig.flag}</span>
          <span>{targetConfig.nativeName}</span>
        </Link>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Languages className="h-4 w-4" />
          <span>{currentConfig.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {i18n.locales.map((loc) => (
          <DropdownMenuItem key={loc} asChild>
            <Link
              href={switchLocaleHref(loc)}
              className="cursor-pointer flex items-center gap-2"
            >
              <span>{localeConfig[loc].flag}</span>
              <span>{localeConfig[loc].nativeName}</span>
              {loc === locale && (
                <span className="ms-auto text-xs text-muted-foreground">
                  ✓
                </span>
              )}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
