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
import type { Dictionary } from "@/components/internationalization"
import { useDictionary } from "@/components/internationalization/use-dictionary"

/**
 * QuickLook Component
 * Displays 4 stat cards with the original QuickActions colors
 * Each card shows a metric with trend indicator
 */

interface QuickLookProps {
  stats: TrendingStatsData
  dictionary?: Dictionary
  className?: string
}

export function QuickLook({ stats, dictionary: propDictionary, className }: QuickLookProps) {
  const hookDictionary = useDictionary()
  const dictionary = propDictionary ?? hookDictionary
  const d = dictionary.dashboard

  // Original QuickActions colors (Anthropic design colors)
  const statConfigs = [
    {
      key: "totalShipments" as const,
      label: d?.totalShipments || "Total Shipments",
      icon: Ship,
      bg: "bg-[#D97757]", // Coral/orange
      text: "text-white",
      format: (value: number) => value.toString(),
    },
    {
      key: "totalRevenue" as const,
      label: dictionary.finance?.totalRevenue || "Total Revenue",
      icon: DollarSign,
      bg: "bg-[#6A9BCC]", // Blue
      text: "text-white",
      format: (value: number) => `SDG ${value.toLocaleString()}`,
    },
    {
      key: "pendingDeclarations" as const,
      label: d?.pendingDeclarations || "Pending Declarations",
      icon: FileText,
      bg: "bg-[#CBCADB]", // Lavender
      text: "text-gray-800",
      format: (value: number) => value.toString(),
    },
    {
      key: "completionRate" as const,
      label: d?.completionRate || "Completion Rate",
      icon: CheckCircle,
      bg: "bg-[#BCD1CA]", // Mint
      text: "text-gray-800",
      format: (value: number) => `${value}%`,
    },
  ]

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
                "rounded-lg p-4 transition-all hover:opacity-90 hover:shadow-md",
                config.bg
              )}
            >
              {/* Header with icon and trend */}
              <div className="flex items-center justify-between mb-2">
                <Icon className={cn("h-5 w-5", config.text)} />
                {stat.change !== undefined && (
                  <div
                    className={cn(
                      "flex items-center gap-1 rounded-full px-2 py-0.5",
                      "text-xs font-medium",
                      config.text === "text-white"
                        ? "bg-white/20"
                        : "bg-black/10"
                    )}
                  >
                    {stat.changeType === "positive" ? (
                      <TrendingUp className={cn("h-3 w-3", config.text)} />
                    ) : (
                      <TrendingDown className={cn("h-3 w-3", config.text)} />
                    )}
                    <span className={config.text}>
                      {stat.changeType === "positive" ? "+" : "-"}
                      {stat.change}%
                    </span>
                  </div>
                )}
              </div>

              {/* Label */}
              <p className={cn("text-xs font-medium mb-1 truncate opacity-80", config.text)}>
                {config.label}
              </p>

              {/* Value */}
              <p className={cn("text-2xl font-bold tracking-tight truncate", config.text)}>
                {config.format(stat.value)}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
