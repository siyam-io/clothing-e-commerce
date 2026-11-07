"use client";

import { useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { useAppStore } from "@/store/appStore";
import { useProductStore } from "@/store/productStore";
import { useTrackingStore } from "@/store/trackingStore";
import { swalToast, swalError } from "@/utils/swal";
import { getTranslation } from "@/utils/typography/handler";
import WishlistCard from "@/app/wishlist/components/WishlistCard";
import WishlistSkeleton from "./WishlistSkeleton";
import WishlistEmptyState from "./WishlistEmptyState";

/**
 * Interactive Wishlist page content managing client-side stores and actions.
 */
export default function WishlistPageContent() {
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { lang, isMounted } = useAppStore();

  const t = useMemo(() => getTranslation("wishlist", lang), [lang]);

  const trackAddToCart = useTrackingStore((state) => state.trackAddToCart);
  const wishlistItems = useProductStore((state) => state.wishlistItems);
  const toggleWishlist = useProductStore((state) => state.toggleWishlist);
  const addToCart = useProductStore((state) => state.addToCart);

  const handleMoveToCart = (product) => {
    const availableSizes = product.sizes?.filter((s) => s.stock > 0);
    if (!availableSizes?.length) {
      return swalError(
        lang === "bn" ? "স্টক নেই" : "Out of Stock",
        lang === "bn" ? "পণ্যটি এখন পাওয়া যাচ্ছে না।" : "Item unavailable."
      );
    }

    const sizeId = availableSizes[0].size?._id || availableSizes[0].size;
    const discountedPrice =
      product.price - (product.price * (product.discount || 0)) / 100;

    addToCart(product, sizeId, 1, isAuthenticated);
    toggleWishlist(product, isAuthenticated);

    trackAddToCart(product._id, discountedPrice, 1);
    swalToast(t.movedToBag, "success");
  };

  const handleRemove = (product) => {
    toggleWishlist(product, isAuthenticated);
    swalToast(t.removedFromVault, "success");
  };

  if (!isMounted || authLoading) {
    return <WishlistSkeleton />;
  }

  const items = wishlistItems || [];

  return (
    <div className="min-h-screen bg-background pt-4 lg:pt-10 px-4 sm:px-10 space-y-12 pb-24">
      <header className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-foreground">
          {t?.title || "My Wishlist"}
        </h1>
        <p className="text-sm text-muted-foreground font-medium">
          {items.length}{" "}
          {items.length === 1
            ? t?.itemSaved || "saved item"
            : t?.itemsSaved || "saved items"}
        </p>
      </header>

      {items.length === 0 ? (
        <WishlistEmptyState t={t} />
      ) : (
        <div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8"
          role="region"
          aria-label="Wishlist items grid"
        >
          <AnimatePresence mode="popLayout">
            {items.map((product) => (
              <WishlistCard
                key={product._id}
                product={product}
                onRemove={handleRemove}
                onMoveToCart={handleMoveToCart}
                t={t}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

