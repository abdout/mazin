// Client-safe exports only
export { i18n, localeConfig, isRTL, getDir } from './config'
export type { Locale } from './config'
export { useLocale, useSwitchLocaleHref } from './use-locale'

// Re-export Dictionary type from a separate file to avoid server-only import
export type { Dictionary } from './types'
