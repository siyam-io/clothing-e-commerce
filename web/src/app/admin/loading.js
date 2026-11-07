import { Skeleton } from "@/components/ui/skeleton";

/**
 * Lightweight, generic loader for admin transitions preventing disruptive layout shifts.
 */
export default function AdminLoading() {
  return (
    <div
      className="p-6 md:p-10 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-150"
      aria-busy="true"
      aria-label="Loading admin content"
    >
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>

      <div className="bg-card/40 border border-border/10 rounded-2xl p-6 space-y-4">
        <div className="flex justify-between items-center pb-4 border-b border-border/10">
          <Skeleton className="h-8 w-64 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
