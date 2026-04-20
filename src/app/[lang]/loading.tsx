import { Skeleton } from "@/components/ui/skeleton"

export default function HomeLoading() {
  return (
    <div className="min-h-screen">
      {/* Hero Section Skeleton */}
      <section className="container mx-auto px-4 py-16 space-y-6">
        <div className="max-w-3xl mx-auto space-y-4 text-center">
          <Skeleton className="h-12 w-3/4 mx-auto" />
          <Skeleton className="h-6 w-full mx-auto" />
          <Skeleton className="h-6 w-5/6 mx-auto" />
          <div className="flex gap-3 justify-center pt-4">
            <Skeleton className="h-11 w-32" />
            <Skeleton className="h-11 w-32" />
          </div>
        </div>
      </section>

      {/* Features Grid Skeleton */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-6 shadow-sm space-y-3">
              <Skeleton className="h-10 w-10 rounded" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
