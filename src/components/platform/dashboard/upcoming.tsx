"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, CalendarDays, Clock, ScrollText } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { UpcomingData } from "./actions"
import type { Locale } from "@/components/internationalization"

/**
 * Upcoming Component - Hogwarts Edition
 * Elegant parchment-style card with magical hover effects
 * Displays upcoming tasks, deadlines, and system overview
 */

interface UpcomingProps {
  data: UpcomingData
  locale: Locale
  className?: string
}

export function Upcoming({ data, locale, className }: UpcomingProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={cn(
        "group relative h-full w-full",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main card with elegant border */}
      <div
        className={cn(
          "relative h-full w-full overflow-hidden rounded-xl",
          "bg-gradient-to-br from-amber-50/80 via-stone-50/60 to-amber-50/40",
          "dark:from-stone-900/80 dark:via-stone-950/60 dark:to-amber-950/40",
          "border border-amber-200/60 dark:border-amber-900/40",
          "shadow-sm transition-all duration-500",
          "hover:shadow-lg hover:shadow-amber-500/10 dark:hover:shadow-amber-500/5",
          "hover:border-amber-300/80 dark:hover:border-amber-800/60"
        )}
      >
        {/* Decorative corner flourish */}
        <div className="absolute top-0 left-0 h-16 w-16 overflow-hidden opacity-30">
          <div className="absolute -top-8 -left-8 h-16 w-16 rotate-45 bg-gradient-to-br from-amber-400 to-transparent" />
        </div>
        <div className="absolute right-0 bottom-0 h-16 w-16 overflow-hidden opacity-30">
          <div className="absolute -right-8 -bottom-8 h-16 w-16 rotate-45 bg-gradient-to-tl from-amber-400 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative flex h-full flex-col p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/10 dark:from-amber-400/20 dark:to-amber-500/10">
                <ScrollText className="h-4.5 w-4.5 text-amber-700 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-foreground text-base font-semibold tracking-tight">
                  {data.title}
                </h3>
                <p className="text-muted-foreground text-xs">
                  {data.subtitle}
                </p>
              </div>
            </div>
            <Badge
              variant={data.badgeVariant}
              className={cn(
                "text-xs font-medium",
                data.badgeVariant === "destructive"
                  ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
              )}
            >
              {data.badge}
            </Badge>
          </div>

          {/* Divider with magical glow */}
          <div className="relative my-4">
            <div className="h-px bg-gradient-to-r from-transparent via-amber-300/50 to-transparent dark:via-amber-700/50" />
            <div
              className={cn(
                "absolute left-1/2 top-1/2 h-1 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full",
                "bg-amber-400/50 blur-sm transition-all duration-500",
                isHovered && "w-16 bg-amber-400/70"
              )}
            />
          </div>

          {/* Details list */}
          <div className="flex-1 space-y-2.5">
            {data.details.slice(0, 4).map((detail, index) => (
              <div
                key={detail.label}
                className={cn(
                  "flex items-center justify-between text-sm transition-all duration-300",
                  "rounded-md px-2 py-1.5",
                  "hover:bg-amber-100/50 dark:hover:bg-amber-900/20"
                )}
                style={{
                  transitionDelay: `${index * 50}ms`,
                }}
              >
                <span className="text-muted-foreground flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400/60 dark:bg-amber-500/60" />
                  {detail.label}
                </span>
                <span
                  className={cn(
                    "font-medium tabular-nums",
                    detail.highlight
                      ? "text-red-600 dark:text-red-400"
                      : "text-foreground"
                  )}
                >
                  {detail.value}
                </span>
              </div>
            ))}
          </div>

          {/* Footer action */}
          <div className="mt-4 pt-3 border-t border-amber-200/40 dark:border-amber-800/30">
            <Link
              href={`/${locale}${data.link}`}
              className={cn(
                "group/link flex items-center justify-between",
                "rounded-lg px-3 py-2",
                "bg-gradient-to-r from-amber-100/60 to-amber-50/40",
                "dark:from-amber-900/30 dark:to-amber-950/20",
                "border border-amber-200/40 dark:border-amber-800/30",
                "transition-all duration-300",
                "hover:from-amber-200/80 hover:to-amber-100/60",
                "dark:hover:from-amber-800/40 dark:hover:to-amber-900/30",
                "hover:border-amber-300/60 dark:hover:border-amber-700/50"
              )}
            >
              <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
                {data.linkLabel}
              </span>
              <ArrowRight className="h-4 w-4 text-amber-600 transition-transform duration-300 group-hover/link:translate-x-1 dark:text-amber-400 rtl:rotate-180 rtl:group-hover/link:-translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
