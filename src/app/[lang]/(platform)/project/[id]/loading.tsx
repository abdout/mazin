import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonStats } from "@/components/atom/loading"

export default function ProjectDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-4 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      <SkeletonStats count={4} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  )
}
