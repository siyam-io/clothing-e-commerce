"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { X, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getImageUrl } from "@/utils/imageUtils";
import { Price } from "@/components/common/Price";

export default function WishlistCard({ product, onRemove, onMoveToCart, t }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="group relative bg-accent/10 backdrop-blur-md rounded-[2rem] sm:rounded-[2.5rem] border border-border/10 overflow-hidden hover:border-accent-secondary/30 transition-all duration-700 shadow-2xl hover:shadow-accent-secondary/10"
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <Image
          src={getImageUrl(product.images?.[0], 400, 80)}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <Button
          size="icon"
          onClick={() => onRemove(product)}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 z-20 w-10 h-10 rounded-full bg-background/80 backdrop-blur-md text-foreground hover:text-destructive hover:bg-background transition-all shadow-xl"
          aria-label={t.remove}
        >
          <X size={18} aria-hidden="true" />
        </Button>
      </div>

      <div className="p-4 sm:p-8 space-y-4 sm:space-y-6">
        <div className="space-y-1 sm:space-y-2">
          <p className="text-[8px] sm:text-[9px] font-black text-accent-secondary uppercase tracking-widest">
            {product.category?.name || "Premium Drop"}
          </p>
          <h3 className="text-base sm:text-xl font-black uppercase tracking-tighter italic leading-none line-clamp-1">
            {product.name}
          </h3>
        </div>

        <div className="flex items-center justify-between">
          <Price
            amount={(product.price - (product.price * (product.discount || 0)) / 100).toFixed(0)}
            className="text-xl sm:text-2xl font-black text-foreground"
          />
        </div>

        <Button
          onClick={() => onMoveToCart(product)}
          className="w-full h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-foreground text-background font-black uppercase tracking-widest text-[9px] sm:text-[10px] hover:bg-accent-secondary hover:text-white transition-all duration-500 group/btn"
          aria-label={t.add}
        >
          <ShoppingBag size={14} className="mr-2 group-hover/btn:scale-110 transition-transform" aria-hidden="true" />
          {t.add}
        </Button>
      </div>
    </motion.div>
  );
}
