import Link from "next/link"
import { cookies, headers } from "next/headers"
import { i18n, type Locale, localeConfig } from "@/components/internationalization"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { Button } from "@/components/ui/button"
import { ReportIssue } from "@/components/report-issue"
import "./globals.css"

async function detectLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value
  if (cookieLocale && i18n.locales.includes(cookieLocale as Locale)) {
    return cookieLocale as Locale
  }

  const headersList = await headers()
  const acceptLanguage = headersList.get("accept-language") ?? ""
  const preferredLocale = acceptLanguage.split(",")[0]?.split("-")[0]?.toLowerCase()

  if (preferredLocale && i18n.locales.includes(preferredLocale as Locale)) {
    return preferredLocale as Locale
  }

  return i18n.defaultLocale
}

export default async function RootNotFound() {
  const locale = await detectLocale()
  const dir = localeConfig[locale]?.dir ?? "ltr"
  const dict = await getDictionary(locale)
  const t = dict.notFound

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className="antialiased">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="text-center max-w-md mx-auto">
            <div className="text-8xl font-bold text-muted-foreground/30 mb-4">404</div>
            <h1 className="text-2xl font-bold mb-3">{t.title}</h1>
            <p className="text-muted-foreground mb-8">{t.description}</p>
            <Button asChild>
              <Link href={`/${locale}`}>{t.goHome}</Link>
            </Button>
            <div className="mt-6 text-sm text-muted-foreground">
              <ReportIssue />
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
