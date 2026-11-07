import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton placeholder for Wishlist page loading state.
 */
export default function WishlistSkeleton() {
  return (
    <div
      className="min-h-screen bg-background pt-4 lg:pt-10 px-4 sm:px-10 space-y-12"
      aria-busy="true"
      aria-label="Loading wishlist"
    >
      <div className="space-y-4">
        <Skeleton className="h-14 w-1/3 rounded-2xl" />
        <Skeleton className="h-4 w-1/4 rounded-full" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="aspect-3/4 w-full rounded-2xl" />
            <Skeleton className="h-4 w-3/4 rounded-md" />
            <Skeleton className="h-4 w-1/2 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

