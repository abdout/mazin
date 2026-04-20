import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonCard } from "@/components/atom/loading"

export default function InvoiceDetailLoading() {
  return (
    <div className="space-y-6 p-4 lg:p-6">
      <Skeleton className="h-8 w-64" />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  )
}
