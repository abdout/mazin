import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization/config"
import { TrackingSearchForm } from "./tracking-search-form"
import { LanguageToggle } from "@/components/template/site-header/language-toggle"
import { ModeToggle } from "@/components/atom/mode-toggle"
import { IconPackage, IconTruck, IconShip, IconMapPin } from "@tabler/icons-react"
import Link from "next/link"

interface TrackingPageProps {
  params: Promise<{ lang: string }>
}

export default async function TrackingEntryPage({ params }: TrackingPageProps) {
  const { lang: langParam } = await params
  const lang = langParam as Locale
  const dict = await getDictionary(lang)

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href={`/${lang}`} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <IconPackage className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">{dict.common.appName}</span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-2xl">
          {/* Hero Section */}
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <IconPackage className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              {dict.tracking.publicTitle}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {dict.tracking.publicSubtitle}
            </p>
          </div>

          {/* Search Form */}
          <div className="mt-10">
            <TrackingSearchForm
              dictionary={dict}
              locale={lang}
            />
          </div>

          {/* Features */}
          <div className="mt-16 grid gap-6 sm:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <IconShip className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="mt-3 font-semibold">
                {dict.tracking.seaTracking}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {dict.tracking.seaTrackingDesc}
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <IconTruck className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="mt-3 font-semibold">
                {dict.tracking.landTracking}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {dict.tracking.landTrackingDesc}
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                <IconMapPin className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="mt-3 font-semibold">
                {dict.tracking.liveUpdates}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {dict.tracking.liveUpdatesDesc}
              </p>
            </div>
          </div>

          {/* Example tracking numbers */}
          <div className="mt-12 rounded-lg border bg-card p-6">
            <h3 className="font-semibold">
              {dict.tracking.demoNumbers}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {dict.tracking.demoNumbersDesc}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/${lang}/track/TRK-ABC123`}
                className="rounded-md bg-muted px-3 py-1.5 text-sm font-mono hover:bg-muted/80 transition-colors"
              >
                TRK-ABC123
              </Link>
              <Link
                href={`/${lang}/track/TRK-XYZ789`}
                className="rounded-md bg-muted px-3 py-1.5 text-sm font-mono hover:bg-muted/80 transition-colors"
              >
                TRK-XYZ789
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} {dict.common.appName}. {dict.marketing.footer.copyright}
        </div>
      </footer>
    </div>
  )
}
