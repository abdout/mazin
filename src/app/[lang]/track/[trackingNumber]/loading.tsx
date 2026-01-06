import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function TrackingLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Skeleton */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
      </header>

      {/* Main Content Skeleton */}
      <main className="container mx-auto px-4 md:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Left Column - Package Image Skeleton */}
          <div className="flex flex-col justify-start items-center md:items-start">
            <Skeleton className="w-48 md:w-full max-w-[250px] aspect-square rounded-lg" />
            <div className="mt-6 text-center md:text-start">
              <Skeleton className="h-8 w-32 rounded-full" />
            </div>
            <Skeleton className="mt-4 h-12 w-32 rounded-full" />
          </div>

          {/* Right Columns - Tracking Details Skeleton */}
          <div className="md:col-span-2 space-y-8">
            {/* Title */}
            <div>
              <Skeleton className="h-10 w-64 mb-2" />
              <Skeleton className="h-7 w-40" />
            </div>

            {/* Shipment Info Section */}
            <div className="border-t pt-6">
              <Skeleton className="h-6 w-40 mb-4" />
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div>
                        <Skeleton className="h-5 w-32 mb-1" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-9 w-28" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="space-y-1.5">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-6 w-28" />
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 border-t border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-2.5 w-full rounded-full" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Timeline Section Skeleton */}
            <div className="border-t pt-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-6">
                {/* Progress bar skeleton */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-2.5 w-full rounded-full" />
                </div>

                {/* Timeline items skeleton */}
                <ol className="relative">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <li key={i} className="relative flex gap-4 pb-8 last:pb-0">
                      {/* Connector line */}
                      {i < 5 && (
                        <div
                          className="absolute start-6 top-12 h-[calc(100%-3rem)] w-0.5 bg-muted"
                          aria-hidden="true"
                        />
                      )}
                      {/* Icon circle */}
                      <Skeleton className="h-12 w-12 rounded-full shrink-0 relative z-10" />
                      {/* Content card */}
                      <Card className="flex-1">
                        <CardContent className="p-4">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex-1 space-y-1">
                              <Skeleton className="h-5 w-40" />
                              <Skeleton className="h-4 w-56" />
                            </div>
                            <Skeleton className="h-6 w-20 rounded-full" />
                          </div>
                          <div className="mt-3 flex flex-wrap gap-4">
                            <Skeleton className="h-4 w-32" />
                          </div>
                        </CardContent>
                      </Card>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Skeleton */}
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 flex justify-center">
          <Skeleton className="h-4 w-48" />
        </div>
      </footer>
    </div>
  )
}
