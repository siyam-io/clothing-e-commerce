"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import CartItemCard from "@/app/cart/components/CartItemCard";
import CartLogisticsForm from "@/app/cart/components/CartLogisticsForm";
import CartFinancialSummary from "@/app/cart/components/CartFinancialSummary";
import EmptyCartState from "@/app/cart/components/EmptyCartState";
import SizeEditModal from "@/app/cart/components/SizeEditModal";
import { useCartCheckout } from "../hooks/useCartCheckout";

/**
 * Client component presenting checkout manifest, logistics, and settlement summary.
 */
export default function CartPageContent() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const checkout = useCartCheckout();

  if (!mounted || checkout.settingsLoading || checkout.authLoading) {
    return (
      <div
        className="min-h-screen bg-background p-4 sm:p-12 lg:p-24 space-y-12 animate-pulse"
        aria-busy="true"
        aria-label="Loading checkout"
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

  if (checkout.items.length === 0) {
    return <EmptyCartState t={checkout.t} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-700">
      <div className="max-w-[1800px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-0 lg:divide-x divide-border/20">
        {/* Manifest and Logistics */}
        <div className="lg:col-span-7 p-4 sm:p-12 lg:p-16 xl:p-20 space-y-12 sm:space-y-20 pt-6 sm:pt-12 lg:pt-16">
          <header className="flex items-center gap-4 sm:gap-6">
            <Button
              variant="outline"
              size="icon"
              asChild
              className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl glass hover:bg-accent-secondary hover:text-white border-none shadow-xl transition-all"
            >
              <Link href="/products" aria-label="Back to products">
                <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
              </Link>
            </Button>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter italic text-gradient leading-none">
              {checkout.t.title}
            </h1>
          </header>

          <div className="space-y-16 sm:space-y-24">
            <section className="space-y-6 sm:space-y-8">
              <div className="flex justify-between items-end border-b border-border/10 pb-4 sm:pb-6">
                <div className="space-y-1">
                  <h2 className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.4em] sm:tracking-[0.5em] text-accent-secondary">
                    01. {checkout.t.manifest}
                  </h2>
                  <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    {checkout.t.selectedArtifacts}
                  </p>
                </div>
                <Badge className="bg-foreground text-background font-black px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[8px] sm:text-[10px] uppercase tracking-widest">
                  {checkout.totalQuantity}{" "}
                  {checkout.totalQuantity === 1 ? checkout.t.unit : checkout.t.units}
                </Badge>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <AnimatePresence mode="popLayout">
                  {checkout.items.map((item) => (
                    <CartItemCard
                      key={`${item.product._id}-${item.size._id}`}
                      item={item}
                      t={checkout.t}
                      isDirectBuy={checkout.isDirectBuy}
                      onEditSize={(itm) => checkout.setEditModal({ isOpen: true, item: itm })}
                      onRemove={checkout.handleRemove}
                      onQuantityChange={checkout.handleQuantityChange}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </section>

            <CartLogisticsForm
              t={checkout.t}
              settings={checkout.settings}
              shippingInfo={checkout.shippingInfo}
              setShippingInfo={checkout.setShippingInfo}
              deliveryZone={checkout.deliveryZone}
              setDeliveryZone={checkout.setDeliveryZone}
            />
          </div>
        </div>

        {/* Financial Summary */}
        <CartFinancialSummary
          t={checkout.t}
          subtotal={checkout.subtotal}
          appliedCoupon={checkout.appliedCoupon}
          shippingCharge={checkout.shippingCharge}
          finalTotal={checkout.finalTotal}
          couponCode={checkout.couponCode}
          setCouponCode={checkout.setCouponCode}
          handleApplyCoupon={checkout.handleApplyCoupon}
          paymentMethod={checkout.paymentMethod}
          setPaymentMethod={checkout.setPaymentMethod}
          paymentOptions={checkout.paymentOptions}
          handlePlaceOrder={checkout.handlePlaceOrder}
          isProcessing={checkout.isProcessing}
        />
      </div>

      <SizeEditModal
        isOpen={checkout.editModal.isOpen}
        onClose={() => checkout.setEditModal({ isOpen: false, item: null })}
        item={checkout.editModal.item}
        isAuth={checkout.isAuthenticated}
        t={checkout.t}
      />
    </div>
  );
}

