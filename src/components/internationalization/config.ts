export const i18n = {
  defaultLocale: 'ar',
  locales: ['ar', 'en'],
} as const

export type Locale = (typeof i18n)['locales'][number]

export const localeConfig = {
  ar: {
    name: 'Arabic',
    nativeName: 'العربية',
    dir: 'rtl',
    flag: '🇸🇩',
    dateFormat: 'dd/MM/yyyy',
    currency: 'SDG',
  },
  en: {
    name: 'English',
    nativeName: 'English',
    dir: 'ltr',
    flag: '🇺🇸',
    dateFormat: 'MM/dd/yyyy',
    currency: 'USD',
  },
} as const

export function isRTL(locale: Locale): boolean {
  return localeConfig[locale]?.dir === 'rtl'
}

export function getDir(locale: Locale): 'rtl' | 'ltr' {
  return localeConfig[locale]?.dir ?? 'ltr'
}
