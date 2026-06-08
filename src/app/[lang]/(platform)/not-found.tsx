import Link from "next/link"
import { headers } from "next/headers"
import type { Locale } from "@/components/internationalization"
import { getDictionary } from "@/components/internationalization/dictionaries"

export default async function PlatformNotFound() {
  const headersList = await headers()
  const pathname = headersList.get("x-next-pathname") || ""
  const locale: Locale = pathname.startsWith("/en") ? "en" : "ar"
  const dict = await getDictionary(locale)
  const t = dict.notFound

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <div className="text-center max-w-md mx-auto">
        <div className="text-8xl font-bold text-muted-foreground/30 mb-4">404</div>
        <h1 className="text-2xl font-bold mb-3">{t.title}</h1>
        <p className="text-muted-foreground mb-8">{t.description}</p>
        <Link
          href={`/${locale}/dashboard`}
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {t.goDashboard}
        </Link>
      </div>
    </div>
  )
}
