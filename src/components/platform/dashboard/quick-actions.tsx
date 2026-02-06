"use client"

import Link from "next/link"
import { Ship, FileText, Receipt, Users } from "lucide-react"

import { cn } from "@/lib/utils"
import type { Dictionary, Locale } from "@/components/internationalization"

/**
 * QuickActions Component
 * Displays a row of quick action cards with colored backgrounds
 * - Icon and text in horizontal layout
 * - 4 actions with solid colored backgrounds (coral, blue, lavender, mint)
 */

interface QuickActionsProps {
  dictionary: Dictionary
  locale: Locale
  className?: string
}

// Card background colors (Anthropic design colors)
const cardColors = [
  { bg: "bg-[#D97757]", text: "text-white" }, // Coral/orange
  { bg: "bg-[#6A9BCC]", text: "text-white" }, // Blue
  { bg: "bg-[#CBCADB]", text: "text-gray-800" }, // Lavender
  { bg: "bg-[#BCD1CA]", text: "text-gray-800" }, // Mint
]

export function QuickActions({
  dictionary,
  locale,
  className,
}: QuickActionsProps) {
  // Labels without "New" prefix
  const actions = [
    {
      label: "Shipment",
      href: `/${locale}/shipments/new`,
      icon: Ship,
    },
    {
      label: "Declaration",
      href: `/${locale}/customs/new`,
      icon: FileText,
    },
    {
      label: "Invoice",
      href: `/${locale}/invoice/new`,
      icon: Receipt,
    },
    {
      label: dictionary?.common?.view || "View",
      href: `/${locale}/settings`,
      icon: Users,
    },
  ]

  return (
    <div className={cn("w-full", className)}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {actions.map((action, index) => {
          const Icon = action.icon
          const color = cardColors[index % cardColors.length] ?? cardColors[0]!

          return (
            <Link
              key={action.href}
              href={action.href}
              className="focus-visible:ring-primary block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              <div
                className={cn(
                  "flex items-center gap-4 rounded-lg p-4 transition-all hover:opacity-90 hover:shadow-md",
                  color.bg
                )}
              >
                <Icon
                  className={cn("h-6 w-6 shrink-0", color.text)}
                  aria-hidden={true}
                />
                <span
                  className={cn("truncate text-base font-semibold", color.text)}
                >
                  {action.label}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
