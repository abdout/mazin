import type { Metadata } from "next"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { type Locale, getDir } from "@/components/internationalization/config"
import { TrackingSearchForm } from "./tracking-search-form"
import { LanguageToggle } from "@/components/template/site-header/language-toggle"
import { ModeToggle } from "@/components/atom/mode-toggle"
import { IconTruck, IconShip, IconMapPin } from "@tabler/icons-react"
import Link from "next/link"
import Image from "next/image"

interface TrackingPageProps {
  params: Promise<{ lang: string }>
}

export async function generateMetadata({
  params,
}: TrackingPageProps): Promise<Metadata> {
  const { lang } = await params
  const dict = await getDictionary(lang as Locale)

  return {
    title: dict.tracking.publicTitle,
    description: dict.tracking.publicSubtitle,
    openGraph: {
      title: dict.tracking.publicTitle,
      description: dict.tracking.publicSubtitle,
      type: "website",
    },
    alternates: {
      languages: {
        ar: `/ar/track`,
        en: `/en/track`,
      },
    },
  }
}

export default async function TrackingEntryPage({ params }: TrackingPageProps) {
  const { lang: langParam } = await params
  const lang = langParam as Locale
  const dict = await getDictionary(lang)
  const dir = getDir(lang)

  const features = [
    {
      id: "sea",
      icon: IconShip,
      title: dict.tracking.seaTracking,
      description: dict.tracking.seaTrackingDesc,
    },
    {
      id: "land",
      icon: IconTruck,
      title: dict.tracking.landTracking,
      description: dict.tracking.landTrackingDesc,
    },
    {
      id: "live",
      icon: IconMapPin,
      title: dict.tracking.liveUpdates,
      description: dict.tracking.liveUpdatesDesc,
    },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background" dir={dir}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <nav
          className="container mx-auto flex h-16 items-center justify-between px-4"
          aria-label={dict.common.navigation || "Navigation"}
        >
          <Link
            href={`/${lang}`}
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
            aria-label={dict.common.appName}
          >
            <Image
              src="/logo.png"
              alt=""
              width={32}
              height={32}
              className="h-8 w-8"
              aria-hidden="true"
            />
            <span className="text-xl font-bold text-foreground">
              {dict.common.appName}
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ModeToggle />
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-10">
          {/* Hero Section */}
          <section
            className="text-center my-12"
            aria-labelledby="tracking-title"
          >
            <h1
              id="tracking-title"
              className="text-3xl md:text-5xl text-foreground font-bold mb-6"
            >
              {dict.tracking.publicTitle}
            </h1>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              {dict.tracking.publicSubtitle}
            </p>
          </section>

          {/* Search Form */}
          <div className="max-w-xl mx-auto">
            <TrackingSearchForm
              dictionary={dict}
              locale={lang}
              autoFocus
            />
          </div>

          {/* Feature Cards Grid */}
          <section
            className="mt-16"
            aria-labelledby="features-heading"
          >
            <h2 id="features-heading" className="sr-only">
              {dict.tracking.title}
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {features.map((feature) => (
                <li
                  key={feature.id}
                  className="py-4 text-center"
                >
                  <div
                    className="flex justify-center items-center mb-6 h-20"
                    aria-hidden="true"
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                      <feature.icon className="h-8 w-8 text-foreground" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mt-2 max-w-xs mx-auto">
                    {feature.description}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          {/* Demo Numbers Section */}
          <section
            className="mt-12 border rounded-lg p-6 max-w-xl mx-auto bg-card"
            aria-labelledby="demo-heading"
          >
            <h3 id="demo-heading" className="font-semibold text-foreground">
              {dict.tracking.demoNumbers}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {dict.tracking.demoNumbersDesc}
            </p>
            <div className="mt-4 flex flex-wrap gap-2" role="list">
              <Link
                href={`/${lang}/track/TRK-ABC123`}
                className="rounded-md bg-muted px-3 py-1.5 text-sm font-mono text-foreground hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
                dir="ltr"
              >
                TRK-ABC123
              </Link>
              <Link
                href={`/${lang}/track/TRK-XYZ789`}
                className="rounded-md bg-muted px-3 py-1.5 text-sm font-mono text-foreground hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
                dir="ltr"
              >
                TRK-XYZ789
              </Link>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <span dir="ltr">&copy; {new Date().getFullYear()}</span>{" "}
          {dict.common.appName}. {dict.marketing.footer.copyright}
        </div>
      </footer>
    </div>
  )
}
