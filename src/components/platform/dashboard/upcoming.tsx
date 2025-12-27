"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { AnthropicIcons } from "@/components/icons/anthropic"
import type { UpcomingData } from "./actions"
import type { Locale } from "@/components/internationalization"

/**
 * Upcoming Component
 * 3D flip card with role-based content
 * - Front: pulsing circles animation, title, subtitle, badge
 * - Back: details list with navigation link
 */

interface UpcomingProps {
  data: UpcomingData
  locale: Locale
  className?: string
}

export function Upcoming({ data, locale, className }: UpcomingProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  return (
    <div
      className={cn(
        "group relative h-[320px] w-full max-w-[280px] cursor-pointer lg:max-w-[320px]",
        className
      )}
      style={{ perspective: "2000px" }}
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
    >
      <div
        className={cn(
          "relative h-full w-full transition-all duration-700",
          isFlipped ? "[transform:rotateY(180deg)]" : "[transform:rotateY(0deg)]"
        )}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front of card */}
        <div
          className={cn(
            "absolute inset-0 h-full w-full",
            "[transform:rotateY(0deg)] [backface-visibility:hidden]",
            "overflow-hidden rounded-2xl",
            "bg-card border shadow-sm",
            "transition-all duration-700",
            "group-hover:shadow-lg",
            isFlipped ? "opacity-0" : "opacity-100"
          )}
        >
          <div className="from-muted/50 to-background relative h-full overflow-hidden bg-gradient-to-b">
            {/* Pulsing circles animation */}
            <div className="absolute inset-0 flex items-start justify-center pt-24">
              <div className="relative flex h-[100px] w-[200px] items-center justify-center">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "absolute h-[50px] w-[50px]",
                      "rounded-[140px]",
                      "animate-pulse",
                      "opacity-20",
                      "bg-primary/30"
                    )}
                    style={{
                      animationDelay: `${i * 0.3}s`,
                      transform: `scale(${1 + i * 0.2})`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="absolute right-0 bottom-0 left-0 p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1.5">
                <h3 className="text-foreground text-lg leading-snug font-semibold tracking-tighter transition-all duration-500 ease-out group-hover:translate-y-[-4px]">
                  {data.title}
                </h3>
                <p className="text-muted-foreground line-clamp-2 text-sm tracking-tight transition-all delay-[50ms] duration-500 ease-out group-hover:translate-y-[-4px]">
                  {data.subtitle}
                </p>
              </div>
              <div className="group/icon relative">
                <div
                  className={cn(
                    "absolute inset-[-8px] rounded-lg transition-opacity duration-300",
                    "from-primary/20 via-primary/10 bg-gradient-to-br to-transparent"
                  )}
                />
                <Badge
                  variant={data.badgeVariant}
                  className="relative z-10 text-xs"
                >
                  {data.badge}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Back of card */}
        <div
          className={cn(
            "absolute inset-0 h-full w-full",
            "[transform:rotateY(180deg)] [backface-visibility:hidden]",
            "flex flex-col rounded-2xl border p-6",
            "from-muted/50 to-background bg-gradient-to-b",
            "shadow-sm",
            "transition-all duration-700",
            "group-hover:shadow-lg",
            !isFlipped ? "opacity-0" : "opacity-100"
          )}
        >
          <div className="flex-1 space-y-6">
            <div className="space-y-2">
              <h3 className="text-foreground text-lg leading-snug font-semibold tracking-tight transition-all duration-500 ease-out group-hover:translate-y-[-2px]">
                {data.title}
              </h3>
              <p className="text-muted-foreground line-clamp-2 text-sm tracking-tight transition-all duration-500 ease-out group-hover:translate-y-[-2px]">
                {data.subtitle}
              </p>
            </div>

            <div className="space-y-2">
              {data.details.slice(0, 4).map((detail, index) => (
                <div
                  key={detail.label}
                  className="flex items-center justify-between text-sm transition-all duration-500"
                  style={{
                    transform: isFlipped ? "translateX(0)" : "translateX(-10px)",
                    opacity: isFlipped ? 1 : 0,
                    transitionDelay: `${index * 100 + 200}ms`,
                  }}
                >
                  <span className="text-muted-foreground">{detail.label}</span>
                  <span
                    className={cn(
                      "text-foreground font-medium",
                      detail.highlight && "text-destructive"
                    )}
                  >
                    {detail.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 border-t pt-6">
            <Link
              href={`/${locale}${data.link}`}
              className={cn(
                "group/start relative",
                "flex items-center justify-between",
                "-m-3 rounded-xl p-3",
                "transition-all duration-300",
                "bg-muted/50",
                "hover:bg-primary/10",
                "hover:scale-[1.02]"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-foreground group-hover/start:text-primary text-sm font-medium transition-colors duration-300">
                {data.linkLabel}
              </span>
              <div className="group/icon relative">
                <div
                  className={cn(
                    "absolute inset-[-6px] rounded-lg transition-all duration-300",
                    "from-primary/20 via-primary/10 bg-gradient-to-br to-transparent",
                    "scale-90 opacity-0 group-hover/start:scale-100 group-hover/start:opacity-100"
                  )}
                />
                <ArrowRight className="text-primary relative z-10 h-4 w-4 transition-all duration-300 group-hover/start:translate-x-0.5 group-hover/start:scale-110 rtl:rotate-180" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
