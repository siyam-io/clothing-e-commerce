"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useAppStore } from "@/store/appStore";
import { useProductStore } from "@/store/productStore";
import { useSettings } from "@/hooks/useSettings";
import { useOrders } from "@/app/cart/lib/useOrders";
import { useCoupons } from "@/app/cart/lib/useCoupons";
import { useTrackingStore } from "@/store/trackingStore";
import { swalError, swalToast, swalConfirm } from "@/utils/swal";
import { getTranslation } from "@/utils/typography/handler";

/**
 * Custom hook orchestrating shopping cart state, pricing calculations, and checkout submission.
 */
export function useCartCheckout() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDirectBuy = searchParams.get("type") === "direct";

  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { lang } = useAppStore();
  const {
    cart,
    buyNowItem,
    updateCartItem,
    updateBuyNowQuantity,
    removeFromCart,
    clearCart,
  } = useProductStore();
  const { settings, isLoading: settingsLoading, refetch: refetchSettings } = useSettings();
  const { initOrder } = useOrders();
  const { validateCoupon } = useCoupons();
  const trackPurchase = useTrackingStore((state) => state.trackPurchase);
  const trackInitiateCheckout = useTrackingStore((state) => state.trackInitiateCheckout);

  const t = useMemo(() => getTranslation("cart", lang), [lang]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("ssl");
  const [couponCode, setCouponCode] = useState("");
  const [deliveryZone, setDeliveryZone] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [shippingInfo, setShippingInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [editModal, setEditModal] = useState({ isOpen: false, item: null });

  useEffect(() => {
    refetchSettings();
  }, [refetchSettings]);

  const activeCouriers = useMemo(() => {
    return settings?.shipping?.couriers?.filter((c) => c.isActive) || [];
  }, [settings]);

  useEffect(() => {
    if (activeCouriers.length > 0 && (!deliveryZone || !activeCouriers.some((c) => c.name === deliveryZone))) {
      setDeliveryZone(activeCouriers[0].name);
    }
  }, [activeCouriers, deliveryZone]);

  const items = useMemo(() => {
    if (isDirectBuy && buyNowItem) return [buyNowItem];
    if (!cart?.itemsMap) return [];
    return Object.values(cart.itemsMap).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  }, [isDirectBuy, buyNowItem, cart?.itemsMap]);

  const subtotal = useMemo(() => {
    if (!items.length) return 0;
    return items.reduce(
      (sum, i) => sum + (i.discountedPrice || 0) * (i.quantity || 0),
      0
    );
  }, [items]);

  const totalQuantity = useMemo(() => {
    if (!items.length) return 0;
    return items.reduce((sum, i) => sum + (i.quantity || 0), 0);
  }, [items]);

  useEffect(() => {
    if (user) {
      setShippingInfo({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.addresses?.[0]?.address || user.addresses?.[0]?.street || "",
      });
    }
  }, [user]);

  useEffect(() => {
    if (items.length > 0) {
      trackInitiateCheckout();
    }
  }, [items.length, trackInitiateCheckout]);

  const paymentOptions = useMemo(
    () => ({
      ssl: settings?.paymentOptions?.online ?? true,
      bkash: settings?.paymentOptions?.bkash ?? true,
      cod: settings?.paymentOptions?.cod ?? true,
    }),
    [settings]
  );

  useEffect(() => {
    if (!settingsLoading) {
      if (paymentOptions.ssl) setPaymentMethod("ssl");
      else if (paymentOptions.bkash) setPaymentMethod("bkash");
      else if (paymentOptions.cod) setPaymentMethod("cod");
    }
  }, [paymentOptions, settingsLoading]);

  const shippingCharge = useMemo(() => {
    const selected = activeCouriers.find((c) => c.name === deliveryZone);
    return selected ? selected.charge : 0;
  }, [deliveryZone, activeCouriers]);

  const finalTotal = subtotal - (appliedCoupon?.discountAmount || 0) + shippingCharge;

  const handleRemove = useCallback(
    async (productId, sizeId) => {
      const confirmed = await swalConfirm(
        t.purgeArtifact || "Remove Item?",
        t.removeDescription || "Are you sure you want to remove this item?"
      );
      if (confirmed) removeFromCart(productId, sizeId, isAuthenticated);
    },
    [t, removeFromCart, isAuthenticated]
  );

  const handleQuantityChange = useCallback(
    (productId, sizeId, currentQty, delta) => {
      const newQty = currentQty + delta;
      if (newQty < 1) {
        if (isDirectBuy) {
          router.push("/products");
        } else {
          handleRemove(productId, sizeId);
        }
      } else {
        if (isDirectBuy) {
          updateBuyNowQuantity(newQty);
        } else {
          updateCartItem(productId, sizeId, newQty, isAuthenticated);
        }
      }
    },
    [isDirectBuy, router, handleRemove, updateBuyNowQuantity, updateCartItem, isAuthenticated]
  );

  const handleApplyCoupon = useCallback(async () => {
    if (!couponCode.trim()) return;
    try {
      const data = await validateCoupon({
        code: couponCode,
        cartTotal: subtotal,
      });
      if (data.valid) {
        setAppliedCoupon(data);
        swalToast(t.syncCode || "Coupon Applied", "success");
      }
    } catch {
      swalError(
        t.protocolDenied || "Invalid Coupon",
        t.voucherUnrecognized || "The coupon code is invalid."
      );
    }
  }, [couponCode, subtotal, validateCoupon, t]);

  const handlePlaceOrder = useCallback(async () => {
    if (!shippingInfo.phone || !shippingInfo.address || !shippingInfo.name) {
      return swalError(
        t.manifestIncomplete || "Information Missing",
        t.provideLogistics || "Please provide your name, phone and address."
      );
    }

    setIsProcessing(true);
    try {
      const result = await initOrder({
        orderItems: items.map((i) => ({
          product: i.product._id,
          size: i.size?._id || i.size,
          quantity: i.quantity,
        })),
        shippingAddress: { ...shippingInfo },
        shippingPrice: shippingCharge,
        deliveryZone,
        paymentMethod,
        couponCode: appliedCoupon?.coupon?.code,
        isDirectBuy,
      });

      if (paymentMethod === "cod") {
        trackPurchase(
          result.orderId,
          finalTotal,
          items.map((i) => i.product._id)
        );
        clearCart();
        router.push("/profile/order");
      }
    } catch {
      setIsProcessing(false);
    }
  }, [
    shippingInfo,
    items,
    shippingCharge,
    deliveryZone,
    paymentMethod,
    appliedCoupon,
    isDirectBuy,
    initOrder,
    trackPurchase,
    finalTotal,
    clearCart,
    router,
    t,
  ]);

  return {
    t,
    isDirectBuy,
    items,
    subtotal,
    totalQuantity,
    shippingCharge,
    finalTotal,
    settings,
    settingsLoading,
    authLoading,
    isAuthenticated,
    isProcessing,
    shippingInfo,
    setShippingInfo,
    deliveryZone,
    setDeliveryZone,
    paymentMethod,
    setPaymentMethod,
    paymentOptions,
    couponCode,
    setCouponCode,
    appliedCoupon,
    handleQuantityChange,
    handleRemove,
    handleApplyCoupon,
    handlePlaceOrder,
    editModal,
    setEditModal,
  };
}

