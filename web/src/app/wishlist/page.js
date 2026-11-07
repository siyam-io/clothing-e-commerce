import { Suspense } from "react";
import WishlistPageContent from "@/features/wishlist/components/WishlistPageContent";
import WishlistSkeleton from "@/features/wishlist/components/WishlistSkeleton";
import { getSettings } from "@/lib/settings";

export async function generateMetadata() {
  const settings = await getSettings();
  const siteName = settings?.branding?.siteName || "Store";

  return {
    title: `My Wishlist | ${siteName}`,
    description: "View and manage your saved wardrobe items and favorites.",
    robots: {
      index: false,
      follow: false,
    },
  };
}

/**
 * Server Component entrypoint for user wishlist.
 */
export default function WishlistPage() {
  return (
    <Suspense fallback={<WishlistSkeleton />}>
      <WishlistPageContent />
    </Suspense>
  );
}
