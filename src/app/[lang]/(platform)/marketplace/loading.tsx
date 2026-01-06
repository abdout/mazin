import { Skeleton } from '@/components/ui/skeleton';

export default function MarketplaceLoading() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        {/* Page heading skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      <div className="px-4 lg:px-6">
        {/* Filter buttons skeleton */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-24" />
            ))}
          </div>
          <Skeleton className="h-10 w-full max-w-sm" />
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="py-4 text-center space-y-4">
              <div className="flex justify-center">
                <Skeleton className="w-40 h-40 rounded-lg" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-20 mx-auto" />
                <Skeleton className="h-6 w-32 mx-auto" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4 mx-auto" />
                <Skeleton className="h-5 w-24 mx-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
