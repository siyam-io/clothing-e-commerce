"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag, Truck, ShieldCheck, CreditCard } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useAppStore } from "@/store/appStore";
import { useProductStore } from "@/store/productStore";
import { useTrackingStore } from "@/store/trackingStore";
import { notify } from "@/utils/swal";
import Loader from "@/components/common/Loader";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Price } from "@/components/common/Price";

const DICTIONARY = {
  en: {
    add: "Secure to Bag",
    buy: "Instant Checkout",
    selectSize: "Architecture",
    price: "Investment",
  },
  bn: {
    add: "ব্যাগে নিন",
    buy: "অর্ডার দিন",
    selectSize: "সাইজ নির্বাচন",
    price: "মূল্য",
  },
};

export default function ProductActionsClient({ product }) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { lang } = useAppStore();
  const { addToCart, initiateBuyNow } = useProductStore();
  const trackAddToCart = useTrackingStore((state) => state.trackAddToCart);

  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const ui = useMemo(() => DICTIONARY[lang] || DICTIONARY.en, [lang]);
  const discountedPrice = useMemo(
    () =>
      product
        ? product.price - (product.price * (product.discount || 0)) / 100
        : 0,
    [product],
  );

  useEffect(() => {
    if (product) {
      const available = product.sizes?.filter(Boolean).find((s) => s && s.stock > 0 && s.size);
      if (available && !selectedSize) setSelectedSize(available.size._id);
    }
  }, [product]);

  const handleBagAction = async () => {
    if (!selectedSize)
      return notify.error("Error", "Please select a size.");
    setIsAdding(true);
    try {
      await addToCart(product, selectedSize, quantity, isAuthenticated);
      notify.success(
        lang === "bn" ? "ব্যাগে যোগ হয়েছে" : "Added to Bag"
      );
      trackAddToCart(product._id, discountedPrice, quantity);
    } catch (err) {
      notify.error("Error", "Could not add to bag.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleInstantBuy = () => {
    if (!selectedSize)
      return notify.error("Error", "Please select a size.");
    initiateBuyNow(product, selectedSize, quantity);
    router.push("/cart?type=direct");
  };

  return (
    <div className="flex flex-col gap-12">
      {/* Pricing / Investment Display */}
      <div className="glass p-8 rounded-[2rem] border-accent-secondary/10 flex flex-col gap-2 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent-secondary/5 blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-1000" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-accent-secondary">
          {ui.price}
        </p>
        <div className="flex items-baseline gap-6">
          <Price
            amount={discountedPrice.toFixed(0)}
            className="text-5xl md:text-6xl font-black text-foreground not-italic tracking-normal"
          />
          {product.discount > 0 && (
            <Price
              amount={product.price}
              lineThrough
              className="text-2xl font-bold text-muted-foreground/40 not-italic tracking-normal"
            />
          )}
        </div>
      </div>

      {/* Size Architecture Selector */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-1">
           <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">
            {ui.selectSize}
          </h3>
          <Button variant="link" className="text-[9px] font-bold uppercase tracking-widest text-accent-secondary h-auto p-0">
            Size Blueprint →
          </Button>
        </div>
        <RadioGroup 
          value={selectedSize} 
          onValueChange={setSelectedSize}
          className="grid grid-cols-4 gap-3"
        >
          {product.sizes?.filter((s) => s && s.size).map((s) => (
            <div key={s.size._id}>
              <RadioGroupItem
                value={s.size._id}
                id={s.size._id}
                className="peer sr-only"
                disabled={s.stock <= 0}
              />
              <Label
                htmlFor={s.size._id}
                className={cn(
                  "flex h-16 items-center justify-center rounded-2xl border-2 border-accent/50 bg-background text-xs font-black uppercase transition-all duration-300 cursor-pointer peer-data-[state=checked]:border-accent-secondary peer-data-[state=checked]:bg-accent-secondary peer-data-[state=checked]:text-white peer-data-[state=checked]:shadow-lg peer-data-[state=checked]:shadow-accent-secondary/20 peer-disabled:opacity-20 peer-disabled:grayscale hover:border-accent-secondary/50",
                  s.stock <= 0 && "cursor-not-allowed"
                )}
              >
                {s.size.name}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Action Core */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-accent/30 rounded-full p-1.5 border border-border/50 shadow-inner">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-12 h-12 rounded-full hover:bg-background hover:shadow-sm"
              disabled={quantity <= 1}
            >
              <Minus size={18} />
            </Button>
            <span className="w-12 text-center font-black text-foreground text-xl tabular-nums italic">
              {quantity}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setQuantity(quantity + 1)}
              className="w-12 h-12 rounded-full hover:bg-background hover:shadow-sm"
            >
              <Plus size={18} />
            </Button>
          </div>
          <Button
            onClick={handleBagAction}
            disabled={isAdding}
            className="flex-1 h-14 rounded-full bg-foreground text-background hover:bg-accent-secondary hover:text-white font-black uppercase text-[10px] tracking-[0.2em] transition-all shadow-xl shadow-foreground/5"
          >
            {isAdding ? <Loader size="small" /> : (
              <span className="flex items-center gap-3">
                <ShoppingBag size={16} />
                {ui.add}
              </span>
            )}
          </Button>
        </div>
        <Button
          onClick={handleInstantBuy}
          className="w-full h-16 bg-accent-secondary hover:brightness-110 text-white rounded-full font-black uppercase text-[11px] tracking-[0.4em] shadow-2xl shadow-accent-secondary/20 transition-all active:scale-[0.98]"
        >
          <CreditCard size={18} className="mr-4" />
          {ui.buy}
        </Button>
      </div>

      {/* Trust Signifiers */}
      <div className="pt-10 border-t border-border/30 grid grid-cols-2 gap-8">
        <div className="flex items-center gap-5 group">
          <div className="w-14 h-14 rounded-3xl glass flex items-center justify-center text-muted-foreground group-hover:text-accent-secondary group-hover:scale-110 transition-all shadow-sm border-accent-secondary/5">
            <Truck size={24} />
          </div>
          <div className="flex flex-col">
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">Global Logistics</span>
             <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Expedited Transit</span>
          </div>
        </div>
        <div className="flex items-center gap-5 group">
          <div className="w-14 h-14 rounded-3xl glass flex items-center justify-center text-muted-foreground group-hover:text-accent-secondary group-hover:scale-110 transition-all shadow-sm border-accent-secondary/5">
            <ShieldCheck size={24} />
          </div>
          <div className="flex flex-col">
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">Secured Origin</span>
             <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Authenticity Lock</span>
          </div>
        </div>
      </div>

      {/* MOBILE ACTION BAR - FLOAT */}
      <div className="lg:hidden fixed bottom-6 left-6 right-6 z-[130] glass backdrop-blur-3xl p-5 rounded-[2.5rem] flex items-center gap-4 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border-white/5 animate-in slide-in-from-bottom-20 duration-700">
        <div className="flex-1 min-w-0">
          <Price
            amount={discountedPrice.toFixed(0)}
            className="text-2xl font-black text-foreground not-italic tracking-normal leading-none"
          />
          <p className="text-[9px] text-accent-secondary uppercase font-black mt-1 truncate tracking-widest">
            {product.name}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleBagAction}
          className="w-14 h-14 rounded-2xl bg-accent/20 border-none hover:bg-foreground hover:text-background"
          aria-label="Add to bag"
        >
          <ShoppingBag size={20} />
        </Button>
        <Button
          onClick={handleInstantBuy}
          className="flex-[2] h-14 bg-accent-secondary text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-accent-secondary/20"
        >
          {lang === "bn" ? "অর্ডার" : "Checkout"}
        </Button>
      </div>
    </div>
  );
}
