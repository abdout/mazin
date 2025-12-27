import type { ReactNode } from "react"

/**
 * Trend direction for stat items
 */
export type TrendDirection = "up" | "down" | "neutral"

/**
 * Visual variant for stat items
 */
export type StatVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "muted"

/**
 * Size variant for stat components
 */
export type StatSize = "sm" | "md" | "lg" | "xl"

/**
 * Trend data for a stat item
 */
export interface TrendData {
  value: number
  direction: TrendDirection
}

/**
 * Base stat item with trending support (blocks stats-01/04 pattern)
 */
export interface TrendingStatItem {
  /** Display label */
  label: string
  /** Current value (can be formatted string or number) */
  value: string | number
  /** Change percentage (e.g., 12.5 for +12.5%) */
  change?: number
  /** Whether change is positive or negative */
  changeType?: "positive" | "negative"
  /** Optional icon element */
  icon?: ReactNode
  /** Visual variant */
  variant?: StatVariant
}

/**
 * Progress stat item (blocks stats-09 pattern)
 */
export interface ProgressStatItem {
  /** Display label */
  label: string
  /** Current value */
  value: number | string
  /** Maximum/limit value */
  limit?: number | string
  /** Progress percentage (0-100) */
  percentage: number
  /** Progress bar color variant */
  variant?: StatVariant
  /** Optional status message */
  status?: string
  /** Optional warning message */
  warning?: string
}

/**
 * Grid configuration for stat layouts
 */
export interface StatGridConfig {
  /** Number of columns on mobile */
  mobile?: 1 | 2
  /** Number of columns on tablet */
  tablet?: 1 | 2 | 3
  /** Number of columns on desktop */
  desktop?: 1 | 2 | 3 | 4 | 5
}

/**
 * Dictionary type for stat labels (i18n support)
 */
export interface StatsDictionary {
  /** Common stat labels */
  labels?: {
    totalStudents?: string
    attendance?: string
    averageGrade?: string
    pendingGrading?: string
    totalRevenue?: string
    outstanding?: string
    collectionRate?: string
    present?: string
    absent?: string
    late?: string
    excused?: string
    total?: string
    change?: string
    vsLastPeriod?: string
  }
  /** Formatting */
  format?: {
    currency?: string
    percentage?: string
    decimal?: string
  }
}
