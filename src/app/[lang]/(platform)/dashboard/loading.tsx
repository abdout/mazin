import { Skeleton } from "@/components/ui/skeleton"
import {
  SkeletonChartGrid,
  SkeletonListCompact,
  SkeletonStats,
} from "@/components/atom/loading"

export default function DashboardLoading() {
  return (
    <div className="space-y-6 p-4 lg:p-6">
      <Skeleton className="h-8 w-48" />
      <SkeletonStats count={4} />
      <SkeletonChartGrid count={2} />
      <div className="grid gap-4 lg:grid-cols-2">
        <SkeletonListCompact items={5} />
        <SkeletonListCompact items={5} />
      </div>
    </div>
  )
}
