import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Empty state view when no products exist in user's wishlist.
 */
export default function WishlistEmptyState({ t }) {
  return (
    <div className="py-24 text-center max-w-md mx-auto space-y-6">
      <div className="w-20 h-20 bg-muted/60 rounded-3xl mx-auto flex items-center justify-center">
        <ShoppingBag className="w-10 h-10 text-muted-foreground/50 stroke-1" aria-hidden="true" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          {t?.emptyTitle || "Your Wishlist is Empty"}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t?.emptyDesc || "Explore our latest collections and save items you want to keep track of."}
        </p>
      </div>
      <Button asChild size="lg" className="rounded-full px-8">
        <Link href="/products">{t?.exploreCatalog || "Explore Products"}</Link>
      </Button>
    </div>
  );
}

