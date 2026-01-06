import Link from "next/link"
import { cookies } from "next/headers"
import { IconPackageOff, IconArrowLeft, IconSearch } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { i18n, getDir, type Locale } from "@/components/internationalization/config"

export default async function TrackingNotFound() {
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get("NEXT_LOCALE")?.value
  const locale = (localeCookie && i18n.locales.includes(localeCookie as Locale)
    ? localeCookie
    : i18n.defaultLocale) as Locale

  const dict = await getDictionary(locale)
  const dir = getDir(locale)

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-background px-4"
      dir={dir}
    >
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
          <IconPackageOff className="h-12 w-12 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          {dict.tracking.notFound}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {dict.tracking.invalidNumber}
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild variant="default">
            <Link href={`/${locale}/track`}>
              <IconSearch className="me-2 h-4 w-4" />
              {dict.tracking.trackButton}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/${locale}`}>
              <IconArrowLeft className="me-2 h-4 w-4" />
              {dict.common.back}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
