import { notFound } from "next/navigation"
import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization/config"
import { getPublicTracking } from "@/actions/tracking"
import { TrackingHeader, TrackingTimeline } from "@/components/platform/tracking"
import { LanguageToggle } from "@/components/template/site-header/language-toggle"
import { ModeToggle } from "@/components/atom/mode-toggle"
import Link from "next/link"
import Image from "next/image"

interface TrackingPageProps {
  params: Promise<{ lang: string; trackingNumber: string }>
}

export default async function TrackingPage({ params }: TrackingPageProps) {
  const { lang: langParam, trackingNumber } = await params
  const lang = langParam as Locale
  const dict = await getDictionary(lang)

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
          <div className="flex items-center gap-4">
            <Link
              href={`/${lang}/track`}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {dict.tracking.trackButton}
            </Link>
            <LanguageToggle />
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 md:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Left Column - Package Image */}
          <div className="flex flex-col justify-start items-center md:items-start">
            <Image
              src="/box.png"
              alt="Package"
              width={250}
              height={250}
              className="w-48 md:w-full max-w-[250px] h-auto object-contain"
              priority
            />

            {/* Status Badge */}
            <div className="mt-6 text-center md:text-start">
              <span className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                {trackingData.currentStage}
              </span>
            </div>

            {/* Back to Track Link */}
            <Link
              href={`/${lang}/track`}
              className="mt-4 px-6 py-3 rounded-full font-bold border border-input text-foreground hover:bg-muted transition-colors text-sm"
            >
              {dict.common.back}
            </Link>
          </div>

          {/* Right Columns (span 2) - Tracking Details */}
          <div className="md:col-span-2">
            <h1 className="text-4xl font-bold text-foreground">
              {dict.tracking.publicTitle}
            </h1>
            <h2 className="text-2xl text-muted-foreground mt-2 font-mono">
              {trackingNumber}
            </h2>

            {/* Shipment Info Section */}
            <div className="mt-8 border-t pt-6">
              <h3 className="text-xl text-foreground font-semibold mb-4">
                {dict.tracking.shipmentInfo}
              </h3>
              <TrackingHeader data={trackingData} dictionary={dict} locale={lang} />
            </div>

            {/* Timeline Section */}
            <div className="mt-8 border-t pt-6">
              <h3 className="text-xl text-foreground font-semibold mb-4">
                {dict.tracking.title}
              </h3>
              <TrackingTimeline stages={stages} dictionary={dict} locale={lang} />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} {dict.common.appName}. {dict.marketing.footer.copyright}
        </div>
      </footer>
    </div>
  )
}
