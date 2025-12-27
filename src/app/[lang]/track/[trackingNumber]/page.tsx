import { notFound } from "next/navigation"
import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization/config"
import { getPublicTracking } from "@/actions/tracking"
import { TrackingHeader, TrackingTimeline } from "@/components/platform/tracking"
import { LanguageToggle } from "@/components/template/site-header/language-toggle"
import { ModeToggle } from "@/components/atom/mode-toggle"
import { IconPackage } from "@tabler/icons-react"
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
  const stages = trackingData.stages.map((stage, index) => ({
    id: `${trackingNumber}-${stage.stageType}`,
    shipmentId: "",
    stageType: stage.stageType,
    status: stage.status,
    startedAt: stage.startedAt,
    completedAt: stage.completedAt,
    estimatedAt: stage.estimatedAt,
    notes: null,
    updatedById: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }))

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href={`/${lang}`} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <IconPackage className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">{dict.common.appName}</span>
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
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8 md:flex-row md:gap-12">
          {/* Left: Box Image */}
          <div className="flex items-start justify-center md:w-2/5 md:sticky md:top-24 md:self-start">
            <Image
              src="/box.png"
              alt="Package"
              width={400}
              height={400}
              className="w-48 md:w-full max-w-xs"
              priority
            />
          </div>

          {/* Right: Tracking Details */}
          <div className="flex-1 space-y-8">
            {/* Page Title */}
            <div className="text-center md:text-start">
              <h1 className="text-3xl font-bold">{dict.tracking.publicTitle}</h1>
              <p className="mt-2 text-muted-foreground">
                {dict.tracking.trackingNumber}: {trackingNumber}
              </p>
            </div>

            {/* Tracking Header with info */}
            <TrackingHeader data={trackingData} dictionary={dict} locale={lang} />

            {/* Timeline */}
            <div className="rounded-lg border bg-card p-6">
              <h2 className="mb-6 text-xl font-semibold">{dict.tracking.title}</h2>
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
