import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization/config"
import { TrackingSearchForm } from "./tracking-search-form"
import { LanguageToggle } from "@/components/template/site-header/language-toggle"
import { ModeToggle } from "@/components/atom/mode-toggle"
import { IconPackage, IconTruck, IconShip, IconMapPin } from "@tabler/icons-react"
import Link from "next/link"
import Image from "next/image"

interface TrackingPageProps {
  params: Promise<{ lang: string }>
}

export default async function TrackingEntryPage({ params }: TrackingPageProps) {
  const { lang: langParam } = await params
  const lang = langParam as Locale
  const dict = await getDictionary(lang)

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href={`/${lang}`} className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt={dict.common.appName}
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <span className="text-xl font-bold text-foreground">
              {dict.common.appName}
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-10">
        {/* Hero Section */}
        <div className="text-center my-12">
          <h1 className="text-3xl md:text-5xl text-foreground font-bold mb-6">
            {dict.tracking.publicTitle}
          </h1>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            {dict.tracking.publicSubtitle}
          </p>
        </div>

        {/* Search Form */}
        <div className="max-w-xl mx-auto">
          <TrackingSearchForm
            dictionary={dict}
            locale={lang}
          />
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-16">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="py-4 text-center"
            >
              <div className="flex justify-center items-center mb-6 h-20">
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
            </div>
          ))}
        </div>

        {/* Demo Numbers Section */}
        <div className="mt-12 border rounded-lg p-6 max-w-xl mx-auto">
          <h3 className="font-semibold text-foreground">
            {dict.tracking.demoNumbers}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {dict.tracking.demoNumbersDesc}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/${lang}/track/TRK-ABC123`}
              className="rounded-md bg-muted px-3 py-1.5 text-sm font-mono text-foreground hover:bg-muted/80 transition-colors"
            >
              TRK-ABC123
            </Link>
            <Link
              href={`/${lang}/track/TRK-XYZ789`}
              className="rounded-md bg-muted px-3 py-1.5 text-sm font-mono text-foreground hover:bg-muted/80 transition-colors"
            >
              TRK-XYZ789
            </Link>
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
