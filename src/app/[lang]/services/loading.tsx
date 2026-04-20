import { Skeleton } from "@/components/ui/skeleton"

export default function ServicesLoading() {
  return (
    <div className="container mx-auto px-4 py-16 space-y-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-5 w-full" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    </div>
  )
}
