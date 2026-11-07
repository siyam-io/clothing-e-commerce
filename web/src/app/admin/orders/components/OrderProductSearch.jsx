"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getImageUrl } from "@/utils/imageUtils";
import { Price } from "@/components/common/Price";

export default function OrderProductSearch({
  searchTerm,
  onSearchChange,
  products,
  onAddItem,
  isSearching = false
}) {
  return (
    <div className="space-y-6">
      <div className="relative">
        <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1 mb-4 block">
          Search & Add Products
        </Label>
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={20} />
          <Input
            placeholder="Search by product name..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-16 bg-muted/30 border-border/50 rounded-2xl pl-16 text-[11px] font-black uppercase tracking-[0.2em] focus:ring-2 focus:ring-indigo-600/20 transition-all text-foreground placeholder:text-muted-foreground/50"
          />
        </div>
      </div>

      {searchTerm && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-500 max-h-[350px] overflow-y-auto p-2 bg-muted/10 rounded-[2rem] border border-border/20">
          {isSearching ? (
            <div className="col-span-full py-8 text-center text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Searching variants...
            </div>
          ) : products && products.length > 0 ? (
            products.map((product) => (
              <div key={product._id} className="p-4 rounded-2xl border border-border/40 bg-card shadow-md flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <img 
                    src={getImageUrl(product.images?.[0])} 
                    className="h-14 w-10 object-cover rounded-xl grayscale" 
                    alt={product.name}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-tight truncate block text-foreground">
                      {product.name}
                    </span>
                    <Price
                      amount={product.price}
                      className="text-[9px] font-bold text-indigo-500 mt-0.5 block"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes?.map((s, idx) => {
                    const sizeId = typeof s.size === "object" && s.size ? s.size._id : s.size;
                    const sizeName = typeof s.size === "object" && s.size ? s.size.name : s.size;
                    
                    return (
                      <Button
                        key={`${sizeId}-${idx}`}
                        disabled={s.stock === 0}
                        variant="outline"
                        type="button"
                        onClick={() => onAddItem(product, s.size)}
                        className="h-10 px-4 text-[8px] font-black uppercase tracking-widest rounded-lg border-border/50 hover:bg-foreground hover:text-background transition-all"
                      >
                        {sizeName} ({s.stock})
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-8 text-center text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              No matching products found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
