import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonDataTable } from "@/components/atom/loading"

export default function ProjectInvoicesLoading() {
  return (
    <div className="space-y-6 p-4 lg:p-6">
      <Skeleton className="h-8 w-40" />
      <SkeletonDataTable columns={6} rows={8} />
    </div>
  )
}
