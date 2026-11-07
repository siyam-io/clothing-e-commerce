"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useOrders } from "@/app/payment/success/lib/useOrders";
import { getImageUrl } from "@/utils/imageUtils";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Package,
  ArrowRight,
  ShoppingBag,
  Clock,
  MapPin,
  FileText,
  Download
} from "lucide-react";
import { useProductStore } from "@/store/productStore";
import { useTrackingStore } from "@/store/trackingStore";
import { getTranslation } from "@/utils/typography/handler";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { downloadOrderReceipt } from "@/utils/orderReceipt";
import { notify } from "@/utils/swal";
import { Price } from "@/components/common/Price";


function SuccessSkeleton() {
  return (
    <div className="success-page-wrapper">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <div className="flex justify-center">
             <Skeleton className="w-20 h-20 rounded-full" />
          </div>
          <Skeleton className="h-12 w-3/4 mx-auto rounded-xl" />
          <Skeleton className="h-4 w-1/2 mx-auto rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-[400px] w-full rounded-3xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-40 w-full rounded-3xl" />
            <Skeleton className="h-40 w-full rounded-3xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");
  
  // Get language from cookies (simple client-side check)
  const lang = typeof document !== 'undefined' ? document.cookie.split('; ').find(row => row.startsWith('vanguard-lang='))?.split('=')[1] || "en" : "en";
  const t = getTranslation('success', lang);

  const { orderDetails: order, orderDetailsLoading: isLoading } = useOrders(orderId);
  const { clearCart } = useProductStore();
  const trackPurchase = useTrackingStore((state) => state.trackPurchase);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadReceipt = async () => {
    if (!order?._id || downloading) return;
    setDownloading(true);
    try {
      await downloadOrderReceipt(order._id);
    } catch (err) {
      notify.error("Download failed", err.message || "Could not download receipt.");
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    if (order && !isLoading) {
      // 🚀 Track Purchase for Meta (Pixel + CAPI)
      const productIds = order.orderItems?.map(item => item.product?._id || item.product) || [];
      trackPurchase(order._id, order.totalPrice, productIds);

      if (order.isDirectBuy) {
        clearCart("direct");
      } else {
        clearCart("all");
      }
    }
  }, [order, isLoading, clearCart, trackPurchase]);

  if (isLoading) return <SuccessSkeleton />;

  if (!order)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center font-sans tracking-tight p-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center"
        >
          <Package size={64} className="mb-6 text-muted-foreground opacity-20" />
          <h2 className="text-2xl font-black uppercase italic tracking-tighter">{t.orderNotFound}</h2>
          <p className="text-sm text-muted-foreground mt-2 font-medium max-w-xs">{t.orderNotFoundMsg}</p>
          <button 
            onClick={() => router.push("/")}
            className="mt-8 px-10 py-4 bg-foreground text-background rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-105 transition-all"
          >
            {t.returnHome}
          </button>
        </motion.div>
      </div>
    );

  const isBn = lang === 'bn';

  return (
    <div className="success-page-wrapper">
      <div className="max-w-4xl mx-auto">
        {/* Success Banner */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="success-icon-container"
          >
            <CheckCircle2 size={40} />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={cn("success-title", isBn && "font-sans normal-case italic-none")}
          >
            {t.thankYou}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="success-subtitle"
          >
            {t.confirmationMsg}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="md:col-span-2 space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="success-card"
            >
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-border/10">
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-primary" />
                  <span className={cn("text-[10px] font-black uppercase tracking-[0.3em]", isBn && "font-bold tracking-normal")}>
                    {t.orderSummary}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleDownloadReceipt}
                    disabled={downloading}
                    className="p-2 rounded-xl bg-accent/5 hover:bg-accent/10 transition-colors text-muted-foreground group disabled:opacity-50"
                    title="Download Receipt"
                    aria-label="Download receipt"
                  >
                    {downloading ? (
                      <span className="block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Download size={14} className="group-hover:scale-110 transition-transform" />
                    )}
                  </button>
                  <span className="text-[10px] font-black font-mono bg-primary text-background px-4 py-1.5 rounded-full shadow-lg">
                    #{order._id?.slice(-8).toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {order.orderItems?.map((item, idx) => (
                  <div key={idx} className="success-item-card">
                    <div className="success-item-image">
                      <img
                        src={getImageUrl(item.image)}
                        className="w-full h-full object-cover"
                        alt={item.name}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-xs font-black uppercase truncate", isBn && "font-bold tracking-tight")}>
                        {item.name}
                      </p>
                      <p className="text-[9px] text-muted-foreground font-bold mt-1 uppercase tracking-widest">
                        {isBn ? 'সাইজ' : 'Size'}: {item.size?.name || item.size || "Standard"} • {isBn ? 'পরিমাণ' : 'Qty'}: {item.quantity}
                      </p>
                    </div>
                    <Price
                      amount={item.price * item.quantity}
                      className="text-sm font-black"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-border/10 space-y-3">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  <span>{t.subtotal}</span>
                  <Price amount={order.itemsPrice} className="text-foreground" />
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-emerald-500">
                    <span>{t.discount}</span>
                    <span className="inline-flex items-baseline gap-0.5">
                      <span>-</span>
                      <Price amount={order.discountAmount} className="text-emerald-500" />
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  <span>{t.shipping}</span>
                  <Price amount={order.shippingPrice} className="text-foreground" />
                </div>
                <div className="success-total-row flex justify-between items-center">
                  <span className={isBn ? "font-bold" : ""}>{t.total}</span>
                  <Price amount={order.totalPrice} className="text-3xl font-black" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Logistics Summary */}
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="success-card"
            >
              <div className="flex items-center gap-3 mb-6">
                <MapPin size={18} className="text-primary" />
                <span className={cn("text-[10px] font-black uppercase tracking-[0.3em]", isBn && "font-bold tracking-normal")}>
                  {t.shippingDetails}
                </span>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-black uppercase tracking-tight">{order.shippingAddress?.name}</p>
                <p className="text-[10px] text-muted-foreground font-medium leading-relaxed uppercase tracking-wider">
                  {order.shippingAddress?.address}
                </p>
                <div className="h-px w-8 bg-primary/20 my-4" />
                <p className="text-xs font-black text-primary">
                  {order.shippingAddress?.phone}
                </p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="success-card"
            >
              <div className="flex items-center gap-3 mb-6">
                <Clock size={18} className="text-primary" />
                <span className={cn("text-[10px] font-black uppercase tracking-[0.3em]", isBn && "font-bold tracking-normal")}>
                  {t.paymentDetails}
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black uppercase tracking-tight">{order.paymentMethod}</p>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                  {t.status}: <span className="text-emerald-500">{order.paymentResult?.status || (isBn ? "প্রসেসিং" : "Processing")}</span>
                </p>
              </div>
            </motion.div>

            <div className="pt-4 space-y-4">
              <button
                onClick={() => router.push("/profile/order")}
                className="w-full py-5 bg-foreground text-background rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-xl"
              >
                {t.trackOrder} <ArrowRight size={14} />
              </button>
              <button
                onClick={() => router.push("/products")}
                className="w-full py-5 bg-accent/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-accent/20 transition-all border border-border/10"
              >
                <ShoppingBag size={14} /> {t.continueShopping}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<SuccessSkeleton />}>
      <SuccessContent />
    </Suspense>
  );
}

