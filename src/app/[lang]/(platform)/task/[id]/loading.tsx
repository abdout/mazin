import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonCard } from "@/components/atom/loading"

export default function TaskDetailLoading() {
  return (
    <div className="space-y-6 p-4 lg:p-6">
      <Skeleton className="h-8 w-64" />
      <SkeletonCard />
      <div className="grid gap-4 lg:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  )
}
