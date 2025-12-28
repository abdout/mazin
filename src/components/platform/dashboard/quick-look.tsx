"use client"

import {
  Ship,
  FileText,
  DollarSign,
  CheckCircle,
  TrendingUp,
  TrendingDown,
} from "lucide-react"

import { cn } from "@/lib/utils"
import type { TrendingStatsData } from "./actions"

/**
 * QuickLook Component - Hogwarts Edition
 * Displays 4 elegant stat cards with house-color inspired design
 * Each card shows a metric with trend indicator
 */

interface QuickLookProps {
  stats: TrendingStatsData
  className?: string
}

// Hogwarts house-inspired colors for each stat card
const statConfigs = [
  {
    key: "totalShipments" as const,
    label: "Total Shipments",
    icon: Ship,
    // Gryffindor - Burgundy/Gold
    gradient: "from-red-900/90 via-red-800/80 to-amber-900/70",
    border: "border-amber-500/30",
    iconBg: "bg-amber-500/20",
    iconColor: "text-amber-400",
    format: (value: number) => value.toString(),
  },
  {
    key: "totalRevenue" as const,
    label: "Total Revenue",
    icon: DollarSign,
    // Slytherin - Emerald/Silver
    gradient: "from-emerald-900/90 via-emerald-800/80 to-slate-800/70",
    border: "border-emerald-500/30",
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-400",
    format: (value: number) => `SDG ${value.toLocaleString()}`,
  },
  {
    key: "pendingDeclarations" as const,
    label: "Pending Declarations",
    icon: FileText,
    // Ravenclaw - Navy/Bronze
    gradient: "from-blue-950/90 via-blue-900/80 to-amber-900/60",
    border: "border-blue-400/30",
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-400",
    format: (value: number) => value.toString(),
  },
  {
    key: "completionRate" as const,
    label: "Completion Rate",
    icon: CheckCircle,
    // Hufflepuff - Yellow/Black
    gradient: "from-amber-900/90 via-yellow-900/80 to-stone-900/70",
    border: "border-yellow-500/30",
    iconBg: "bg-yellow-500/20",
    iconColor: "text-yellow-400",
    format: (value: number) => `${value}%`,
  },
]

export function QuickLook({ stats, className }: QuickLookProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statConfigs.map((config) => {
          const stat = stats[config.key]
          const Icon = config.icon

          return (
            <div
              key={config.key}
              className={cn(
                "group relative overflow-hidden rounded-xl",
                "bg-gradient-to-br",
                config.gradient,
                "border",
                config.border,
                "shadow-lg shadow-black/20",
                "transition-all duration-500",
                "hover:shadow-xl hover:shadow-black/30",
                "hover:scale-[1.02]"
              )}
            >
              {/* Magical shimmer effect on hover */}
              <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </div>

              {/* Decorative corner accent */}
              <div className="absolute -top-6 -right-6 h-12 w-12 rotate-45 bg-white/5" />

              <div className="relative p-4">
                {/* Header with icon */}
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      config.iconBg
                    )}
                  >
                    <Icon className={cn("h-5 w-5", config.iconColor)} />
                  </div>
                  {/* Trend badge */}
                  {stat.change !== undefined && (
                    <div
                      className={cn(
                        "flex items-center gap-1 rounded-full px-2 py-0.5",
                        "text-xs font-medium",
                        stat.changeType === "positive"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-red-500/20 text-red-300"
                      )}
                    >
                      {stat.changeType === "positive" ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      <span>
                        {stat.changeType === "positive" ? "+" : "-"}
                        {stat.change}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Label */}
                <p className="text-white/70 text-xs font-medium mb-1 truncate">
                  {config.label}
                </p>

                {/* Value */}
                <p className="text-white text-2xl font-bold tracking-tight truncate">
                  {config.format(stat.value)}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
