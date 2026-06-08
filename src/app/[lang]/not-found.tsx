import Link from "next/link"
import { cookies } from "next/headers"
import { i18n, type Locale } from "@/components/internationalization"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ReportIssue } from "@/components/report-issue"

export default async function NotFound() {
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value
  const locale: Locale =
    cookieLocale && i18n.locales.includes(cookieLocale as Locale)
      ? (cookieLocale as Locale)
      : i18n.defaultLocale
  const dict = await getDictionary(locale)
  const t = dict.notFound

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="text-center max-w-md mx-auto">
        <div className="text-8xl font-bold text-muted-foreground/30 mb-4">404</div>
        <h1 className="text-3xl font-bold mb-3">{t.title}</h1>
        <p className="text-muted-foreground mb-8">{t.description}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {t.goHome}
          </Link>
        </div>
        <div className="mt-6 text-sm text-muted-foreground">
          <ReportIssue />
        </div>
      </div>
    </div>
  )
}
