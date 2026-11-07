import { Suspense } from "react";
import CartPageContent from "@/features/cart/components/CartPageContent";
import { Skeleton } from "@/components/ui/skeleton";
import { getSettings } from "@/lib/settings";

export async function generateMetadata() {
  const settings = await getSettings();
  const siteName = settings?.branding?.siteName || "Store";

  return {
    title: `Checkout & Cart | ${siteName}`,
    description: "Review items in your bag, select delivery logistics, and proceed to secure settlement.",
    robots: {
      index: false,
      follow: false,
    },
  };
}

function CartPageFallback() {
  return (
    <div
      className="min-h-screen bg-background p-4 sm:p-12 lg:p-24 space-y-12 animate-pulse"
      aria-busy="true"
      aria-label="Loading cart"
    >
      <div className="flex items-center gap-6">
        <Skeleton className="h-14 w-14 rounded-2xl" />
        <Skeleton className="h-20 w-[60%] rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 space-y-8">
          <Skeleton className="h-[200px] w-full rounded-[2.5rem]" />
          <Skeleton className="h-[200px] w-full rounded-[2.5rem]" />
        </div>
        <div className="lg:col-span-5">
          <Skeleton className="h-[400px] w-full rounded-[3.5rem]" />
        </div>
      </div>
    </div>
  );
}

/**
 * Server Component entrypoint for user shopping bag and checkout settlement.
 */
export default function CartPage() {
  return (
    <Suspense fallback={<CartPageFallback />}>
      <CartPageContent />
    </Suspense>
  );
}
