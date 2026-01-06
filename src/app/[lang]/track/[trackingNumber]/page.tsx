import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { type Locale, getDir } from "@/components/internationalization/config"
import { getPublicTracking } from "@/actions/tracking"
import { TrackingHeader, TrackingTimeline } from "@/components/platform/tracking"
import { LanguageToggle } from "@/components/template/site-header/language-toggle"
import { ModeToggle } from "@/components/atom/mode-toggle"
import Link from "next/link"
import Image from "next/image"

interface TrackingPageProps {
  params: Promise<{ lang: string; trackingNumber: string }>
}

export async function generateMetadata({
  params,
}: TrackingPageProps): Promise<Metadata> {
  const { lang, trackingNumber } = await params
  const dict = await getDictionary(lang as Locale)

  return {
    title: `${dict.tracking.trackingNumber}: ${trackingNumber}`,
    description: `${dict.tracking.publicSubtitle} - ${trackingNumber}`,
    openGraph: {
      title: `${dict.tracking.trackingNumber}: ${trackingNumber}`,
      description: dict.tracking.publicSubtitle,
      type: "website",
    },
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      languages: {
        ar: `/ar/track/${trackingNumber}`,
        en: `/en/track/${trackingNumber}`,
      },
    },
  }
}

export default async function TrackingPage({ params }: TrackingPageProps) {
  const { lang: langParam, trackingNumber } = await params
  const lang = langParam as Locale
  const dict = await getDictionary(lang)
  const dir = getDir(lang)

  // Fetch public tracking data
  const trackingData = await getPublicTracking(trackingNumber)

  if (!trackingData) {
    notFound()
  }

  // Convert stages to TrackingStage format for timeline
  const stages = trackingData.stages.map((stage) => ({
    id: `${trackingNumber}-${stage.stageType}`,
    shipmentId: "",
    stageType: stage.stageType,
    status: stage.status,
    startedAt: stage.startedAt,
    completedAt: stage.completedAt,
    estimatedAt: stage.estimatedAt,
    notes: null,
    updatedById: null,
    paymentRequested: false,
    paymentReceived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }))

  const currentStageName =
    dict.tracking.stages[
      trackingData.currentStage as keyof typeof dict.tracking.stages
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
          <div className="flex items-center gap-4">
            <Link
              href={`/${lang}/track`}
              className="text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md px-2 py-1 transition-colors"
            >
              {dict.tracking.trackButton}
            </Link>
            <LanguageToggle />
            <ModeToggle />
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto px-4 md:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Left Column - Package Image */}
            <aside className="flex flex-col justify-start items-center md:items-start">
              <Image
                src="/box.png"
                alt={dict.tracking.shipmentInfo}
                width={250}
                height={250}
                className="w-48 md:w-full max-w-[250px] h-auto object-contain"
                priority
              />

              {/* Status Badge */}
              <div className="mt-6 text-center md:text-start">
                <span
                  className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                  role="status"
                  aria-label={`${dict.tracking.currentStatus}: ${currentStageName}`}
                >
                  {currentStageName}
                </span>
              </div>

              {/* Back to Track Link */}
              <Link
                href={`/${lang}/track`}
                className="mt-4 px-6 py-3 rounded-full font-bold border border-input text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors text-sm"
              >
                {dict.common.back}
              </Link>
            </aside>

            {/* Right Columns (span 2) - Tracking Details */}
            <article className="md:col-span-2" aria-labelledby="tracking-title">
              <header>
                <h1 id="tracking-title" className="text-4xl font-bold text-foreground">
                  {dict.tracking.publicTitle}
                </h1>
                <p className="text-2xl text-muted-foreground mt-2 font-mono" dir="ltr">
                  {trackingNumber}
                </p>
              </header>

              {/* Shipment Info Section */}
              <section className="mt-8 border-t pt-6" aria-labelledby="shipment-info-heading">
                <h2 id="shipment-info-heading" className="text-xl text-foreground font-semibold mb-4">
                  {dict.tracking.shipmentInfo}
                </h2>
                <TrackingHeader data={trackingData} dictionary={dict} locale={lang} />
              </section>

              {/* Timeline Section */}
              <section className="mt-8 border-t pt-6" aria-labelledby="timeline-heading">
                <h2 id="timeline-heading" className="text-xl text-foreground font-semibold mb-4">
                  {dict.tracking.title}
                </h2>
                <TrackingTimeline stages={stages} dictionary={dict} locale={lang} />
              </section>
            </article>
          </div>
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
