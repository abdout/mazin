"use client"

import Link from "next/link"
import { Ship, FileText, Receipt, Users, Plus, ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import type { Dictionary, Locale } from "@/components/internationalization"

/**
 * QuickActions Component - Hogwarts Edition
 * Elegant action cards with magical hover effects
 * Uses house-inspired colors and parchment aesthetics
 */

interface QuickActionsProps {
  dictionary: Dictionary
  locale: Locale
  className?: string
}

// Hogwarts-themed action configurations
const actionConfigs = [
  {
    key: "newShipment",
    icon: Ship,
    plusIcon: true,
    // Gryffindor style - bold and brave
    bg: "bg-gradient-to-br from-red-800 via-red-900 to-amber-950",
    hoverBg: "hover:from-red-700 hover:via-red-800 hover:to-amber-900",
    border: "border-amber-600/30",
    hoverBorder: "hover:border-amber-500/50",
    iconBg: "bg-amber-500/20",
    iconColor: "text-amber-400",
  },
  {
    key: "newDeclaration",
    icon: FileText,
    plusIcon: true,
    // Ravenclaw style - wise and creative
    bg: "bg-gradient-to-br from-blue-900 via-blue-950 to-slate-900",
    hoverBg: "hover:from-blue-800 hover:via-blue-900 hover:to-slate-800",
    border: "border-blue-500/30",
    hoverBorder: "hover:border-blue-400/50",
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-400",
  },
  {
    key: "newInvoice",
    icon: Receipt,
    plusIcon: true,
    // Slytherin style - ambitious and resourceful
    bg: "bg-gradient-to-br from-emerald-900 via-emerald-950 to-slate-900",
    hoverBg: "hover:from-emerald-800 hover:via-emerald-900 hover:to-slate-800",
    border: "border-emerald-500/30",
    hoverBorder: "hover:border-emerald-400/50",
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-400",
  },
  {
    key: "view",
    icon: Users,
    plusIcon: false,
    // Hufflepuff style - loyal and patient
    bg: "bg-gradient-to-br from-amber-800 via-yellow-900 to-stone-900",
    hoverBg: "hover:from-amber-700 hover:via-yellow-800 hover:to-stone-800",
    border: "border-yellow-500/30",
    hoverBorder: "hover:border-yellow-400/50",
    iconBg: "bg-yellow-500/20",
    iconColor: "text-yellow-400",
  },
]

export function QuickActions({
  dictionary,
  locale,
  className,
}: QuickActionsProps) {
  const actions = [
    {
      ...actionConfigs[0],
      label: dictionary.dashboard.newShipment,
      href: `/${locale}/shipments/new`,
    },
    {
      ...actionConfigs[1],
      label: dictionary.dashboard.newDeclaration,
      href: `/${locale}/customs/new`,
    },
    {
      ...actionConfigs[2],
      label: dictionary.dashboard.newInvoice,
      href: `/${locale}/invoice/new`,
    },
    {
      ...actionConfigs[3],
      label: dictionary.common.view || "Clients",
      href: `/${locale}/settings`,
    },
  ]

  return (
    <div className={cn("w-full", className)}>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon

          return (
            <Link
              key={action.href}
              href={action.href}
              className="focus-visible:ring-primary block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              <div
                className={cn(
                  "group relative overflow-hidden rounded-xl",
                  action.bg,
                  action.hoverBg,
                  "border",
                  action.border,
                  action.hoverBorder,
                  "shadow-lg shadow-black/30",
                  "transition-all duration-300",
                  "hover:shadow-xl hover:shadow-black/40",
                  "hover:scale-[1.02]",
                  "p-4"
                )}
              >
                {/* Magical shimmer on hover */}
                <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </div>

                {/* Decorative corner */}
                <div className="absolute -top-4 -right-4 h-8 w-8 rotate-45 bg-white/5" />

                <div className="relative flex items-center gap-3">
                  {/* Icon container */}
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                      action.iconBg,
                      "transition-transform duration-300",
                      "group-hover:scale-110"
                    )}
                  >
                    {action.plusIcon ? (
                      <div className="relative">
                        <Icon className={cn("h-5 w-5", action.iconColor)} />
                        <Plus
                          className={cn(
                            "absolute -right-1 -top-1 h-3 w-3",
                            action.iconColor
                          )}
                        />
                      </div>
                    ) : (
                      <Icon className={cn("h-5 w-5", action.iconColor)} />
                    )}
                  </div>

                  {/* Label */}
                  <span className="flex-1 truncate text-sm font-semibold text-white/90">
                    {action.label}
                  </span>

                  {/* Arrow indicator */}
                  <ArrowRight
                    className={cn(
                      "h-4 w-4 text-white/50",
                      "transition-all duration-300",
                      "group-hover:text-white/80",
                      "group-hover:translate-x-1",
                      "rtl:rotate-180 rtl:group-hover:-translate-x-1"
                    )}
                  />
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
