import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonDataTable } from "@/components/atom/loading"

export default function TeamLoading() {
  return (
    <div className="space-y-6 p-4 lg:p-6">
      <Skeleton className="h-8 w-32" />
      <SkeletonDataTable columns={4} rows={6} />
    </div>
  )
}
