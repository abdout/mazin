"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useSelectedLayoutSegment } from "next/navigation"

import { cn } from "@/lib/utils"
import { useLocale } from "@/components/internationalization"
import type { Dictionary } from "@/components/internationalization"

interface MainNavProps {
  dictionary: Dictionary
  className?: string
}

export function MainNav({ dictionary, className }: MainNavProps) {
  const segment = useSelectedLayoutSegment()
  const { locale } = useLocale()

  const t = dictionary.header

  const navItems = React.useMemo(
    () => [
      { title: t.about, href: `/${locale}/about` },
      { title: t.services, href: `/${locale}/services` },
      { title: t.blog, href: `/${locale}/blog` },
      { title: t.platform, href: `/${locale}/dashboard` },
    ],
    [t, locale]
  )

  return (
    <div className={cn("flex items-center gap-10", className)}>
      <Link href={`/${locale}`} className="flex items-center gap-2">
        <Image
          src="/logo.png"
          alt={dictionary.common.appName}
          width={32}
          height={32}
          className="w-8 h-8"
        />
        <span className="font-bold text-xl text-foreground">
          {dictionary.common.appName}
        </span>
      </Link>
      <nav className="flex items-center gap-6 xl:gap-8">
        {navItems.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            className={cn(
              "text-base font-medium transition-colors hover:text-foreground",
              item.href.includes(`/${segment}`)
                ? "text-foreground"
                : "text-muted-foreground"
            )}
          >
            {item.title}
          </Link>
        ))}
      </nav>
    </div>
  )
}
