import { Skeleton } from "@/components/ui/skeleton"

export default function TrackLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48 mx-auto" />
          <Skeleton className="h-5 w-64 mx-auto" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  )
}
