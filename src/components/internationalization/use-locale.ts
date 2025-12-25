'use client'

import { usePathname, useParams } from 'next/navigation'
import type { Locale } from './config'
import { i18n, localeConfig } from './config'

export function useSwitchLocaleHref() {
  const pathname = usePathname()

  return function switchLocaleHref(targetLocale: Locale): string {
    const currentLocale = i18n.locales.find(locale =>
      pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    )

    if (!currentLocale) {
      return `/${targetLocale}${pathname}`
    }

    const newPathname = pathname.replace(`/${currentLocale}`, `/${targetLocale}`)
    return newPathname
  }
}

export function useLocale() {
  const params = useParams()
  const locale = (params?.lang as Locale) || i18n.defaultLocale

  return {
    locale,
    isRTL: localeConfig[locale]?.dir === 'rtl',
    dir: localeConfig[locale]?.dir ?? 'ltr',
    localeConfig: localeConfig[locale]
  }
}
