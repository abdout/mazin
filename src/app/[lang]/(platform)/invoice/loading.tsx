import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonDataTable, SkeletonPageNavWide } from "@/components/atom/loading"

export default function InvoiceLoading() {
  return (
    <div className="space-y-6 p-4 lg:p-6">
      <Skeleton className="h-8 w-36" />
      <SkeletonPageNavWide count={3} />
      <SkeletonDataTable columns={6} rows={8} />
    </div>
  )
}
