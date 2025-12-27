import {
  IconCircleCheckFilled,
  IconClock,
  IconEdit,
  IconFileOff,
  IconSend,
} from "@tabler/icons-react"

import type { Option } from "@/components/table/types/data-table"

/**
 * Invoice status configuration with icons and styles
 */
export const invoiceStatusConfig = {
  DRAFT: {
    label: "Draft",
    icon: IconEdit,
    className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  },
  SENT: {
    label: "Sent",
    icon: IconSend,
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  },
  PAID: {
    label: "Paid",
    icon: IconCircleCheckFilled,
    className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  },
  OVERDUE: {
    label: "Overdue",
    icon: IconClock,
    className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: IconFileOff,
    className: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500",
  },
} as const

export type InvoiceStatusKey = keyof typeof invoiceStatusConfig

/**
 * Invoice status options for filters
 */
export const invoiceStatusOptions: Option[] = [
  { label: "Draft", value: "DRAFT", icon: IconEdit },
  { label: "Sent", value: "SENT", icon: IconSend },
  { label: "Paid", value: "PAID", icon: IconCircleCheckFilled },
  { label: "Overdue", value: "OVERDUE", icon: IconClock },
  { label: "Cancelled", value: "CANCELLED", icon: IconFileOff },
]

/**
 * Currency options for filters
 */
export const currencyOptions: Option[] = [
  { label: "SDG", value: "SDG" },
  { label: "USD", value: "USD" },
  { label: "SAR", value: "SAR" },
]

/**
 * Invoice status literals for validation
 */
export const invoiceStatusLiterals = [
  "DRAFT",
  "SENT",
  "PAID",
  "OVERDUE",
  "CANCELLED",
] as const

/**
 * Currency literals for validation
 */
export const currencyLiterals = ["SDG", "USD", "SAR"] as const
