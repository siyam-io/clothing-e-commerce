"use client";

import { getImageUrl } from "@/utils/imageUtils";
import { Plus, Minus, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/common/Price";

export default function OrderItemsEditor({ items, onUpdateQuantity, onRemoveItem }) {
  return (
    <div className="space-y-6">
      {items.map((item, idx) => {
        const itemImage = item.image || item.product?.images?.[0];
        const itemId = item.product?._id || item.product;
        
        return (
          <div 
            key={`${itemId}-${item.size}-${idx}`} 
            className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-[2rem] bg-muted/20 border border-border/40 group transition-all hover:bg-muted/40"
          >
            <div className="h-24 w-18 bg-muted rounded-2xl overflow-hidden shrink-0 border border-border/50">
              <img
                src={getImageUrl(itemImage)}
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                alt={item.name}
              />
            </div>
            <div className="flex-1 text-center sm:text-left min-w-0">
              <p className="font-black text-base text-foreground uppercase truncate italic tracking-tight">
                {item.name}
              </p>
              <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">
                <span>{item.sizeName || "Universal Size"}</span>
                <span>•</span>
                <Price amount={item.price} className="text-indigo-500" />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center bg-background rounded-xl border border-border/50 overflow-hidden shadow-sm">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-none border-r border-border/50 hover:bg-muted"
                  onClick={() => onUpdateQuantity(idx, -1)}
                >
                  <Minus size={14} />
                </Button>
                <span className="text-xs font-black w-10 text-center text-foreground">{item.quantity}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-none border-l border-border/50 hover:bg-muted"
                  onClick={() => onUpdateQuantity(idx, 1)}
                >
                  <Plus size={14} />
                </Button>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-xl text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20"
                onClick={() => onRemoveItem(idx)}
              >
                <Trash2 size={18} />
              </Button>
            </div>
          </div>
        );
      })}

      {items.length === 0 && (
        <div className="py-20 text-center border-2 border-dashed border-border/40 rounded-[2.5rem] bg-muted/10 opacity-60">
          <Package className="mx-auto text-muted-foreground/20 mb-6" size={64} strokeWidth={1} />
          <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.4em]">No products in this order</p>
        </div>
      )}
    </div>
  );
}
