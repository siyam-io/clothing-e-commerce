"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { 
  Search, 
  Barcode, 
  X, 
  Layers, 
  Check, 
  AlertCircle, 
  ShoppingBag,
  SlidersHorizontal,
  ChevronRight,
  PackageCheck
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getImageUrl } from "@/utils/imageUtils";
import { cn } from "@/lib/utils";
import { playBeep, playErrorSound } from "@/app/admin/orders/lib/posAudio";
import { Price } from "@/components/common/Price";

export default function PosProductCatalog({
  products = [],
  categories = [],
  isLoading = false,
  searchTerm = "",
  onSearchChange,
  selectedCategory = "all",
  onSelectCategory,
  onAddItem,
  searchRef
}) {
  const [selectedProductForSize, setSelectedProductForSize] = useState(null);
  const [inStockOnly, setInStockOnly] = useState(false);

  // Filter products by in-stock if toggle is active
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!inStockOnly) return products;
    return products.filter((p) => {
      const totalStock = p.totalStock !== undefined 
        ? p.totalStock 
        : (p.sizes?.reduce((sum, s) => sum + (s.stock || 0), 0) || 0);
      return totalStock > 0;
    });
  }, [products, inStockOnly]);

  const handleProductCardClick = (product) => {
    const totalStock = product.totalStock !== undefined
      ? product.totalStock
      : (product.sizes?.reduce((sum, s) => sum + (s.stock || 0), 0) || 0);

    if (totalStock <= 0) {
      playErrorSound();
      return;
    }

    const availableSizes = product.sizes?.filter((s) => (s.stock || 0) > 0) || [];

    // If only 1 size available or no sizes array, add immediately
    if (availableSizes.length === 1) {
      onAddItem(product, availableSizes[0].size);
      playBeep();
    } else if (!product.sizes || product.sizes.length === 0) {
      onAddItem(product, null);
      playBeep();
    } else {
      // Multiple sizes: open picker modal
      setSelectedProductForSize(product);
    }
  };

  const handleSizePick = (size) => {
    if (!selectedProductForSize) return;
    onAddItem(selectedProductForSize, size);
    playBeep();
    setSelectedProductForSize(null);
  };

  // Keyboard shortcut listener: F2 or / to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "F2" || (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA")) {
        e.preventDefault();
        searchRef?.current?.focus();
      }
      if (e.key === "Escape") {
        setSelectedProductForSize(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchRef]);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top Search & Filter Bar with System Theme */}
      <div className="space-y-3 bg-card/60 backdrop-blur-2xl p-4 rounded-3xl border border-border/20 shadow-sm">
        <div className="flex items-center gap-3">
          {/* Barcode & Search Input */}
          <div className="relative flex-1">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-muted-foreground/60 pointer-events-none">
              <Barcode size={18} className="text-primary" />
              <Search size={16} />
            </div>
            <Input
              ref={searchRef}
              type="text"
              placeholder="Scan Barcode or Search Product / SKU... (Press F2)"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-12 pl-16 pr-10 rounded-2xl bg-background/60 border-border/20 text-xs font-bold uppercase tracking-wider focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground/50 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* In-Stock Toggle */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setInStockOnly(!inStockOnly)}
            className={cn(
              "h-12 px-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border-border/20 gap-2 shrink-0 transition-all",
              inStockOnly 
                ? "bg-primary/10 text-primary border-primary/30" 
                : "bg-background/60 text-muted-foreground hover:text-foreground"
            )}
            title="Filter In-Stock Only"
          >
            <PackageCheck size={16} />
            <span className="hidden sm:inline">In-Stock</span>
          </Button>
        </div>

        {/* Category Horizontal Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            type="button"
            onClick={() => onSelectCategory("all")}
            className={cn(
              "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shrink-0 transition-all border",
              selectedCategory === "all"
                ? "bg-foreground text-background border-foreground shadow-md"
                : "bg-background/60 text-muted-foreground border-border/15 hover:bg-muted/40 hover:text-foreground"
            )}
          >
            All Products
          </button>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat._id;
            return (
              <button
                key={cat._id}
                type="button"
                onClick={() => onSelectCategory(cat._id)}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shrink-0 transition-all border",
                  isSelected
                    ? "bg-foreground text-background border-foreground shadow-md"
                    : "bg-background/60 text-muted-foreground border-border/15 hover:bg-muted/40 hover:text-foreground"
                )}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Grid Area - System's Original Clean 4-Column Card Design */}
      <div className="flex-1 overflow-y-auto no-scrollbar pr-1">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div 
                key={i} 
                className="h-64 rounded-3xl bg-card/30 border border-border/10 animate-pulse p-4 flex flex-col justify-between"
              >
                <div className="w-full h-36 bg-muted/40 rounded-2xl" />
                <div className="space-y-2">
                  <div className="w-3/4 h-3 bg-muted/40 rounded" />
                  <div className="w-1/2 h-4 bg-muted/40 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => {
              const image = product.images?.[0];
              const totalStock = product.totalStock !== undefined 
                ? product.totalStock 
                : (product.sizes?.reduce((sum, s) => sum + (s.stock || 0), 0) || 0);
              const isOutOfStock = totalStock <= 0;
              const hasDiscount = product.discount > 0;
              const discountedPrice = hasDiscount
                ? Math.round(product.price * (1 - product.discount / 100))
                : product.price;

              return (
                <div
                  key={product._id}
                  onClick={() => !isOutOfStock && handleProductCardClick(product)}
                  className={cn(
                    "group relative flex flex-col justify-between rounded-3xl p-3.5 border transition-all duration-300 text-left cursor-pointer select-none",
                    isOutOfStock
                      ? "bg-card/20 border-border/10 opacity-50 cursor-not-allowed"
                      : "bg-card/50 hover:bg-card border-border/20 hover:border-primary/40 hover:shadow-xl active:scale-[0.98]"
                  )}
                >
                  {/* Thumbnail & Badges */}
                  <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-muted/40 border border-border/10 mb-3">
                    <img
                      src={getImageUrl(image)}
                      alt={product.name}
                      className={cn(
                        "w-full h-full object-cover transition-transform duration-500",
                        !isOutOfStock && "group-hover:scale-105",
                        isOutOfStock && "grayscale"
                      )}
                    />

                    {/* Discount Badge */}
                    {hasDiscount && !isOutOfStock && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-rose-500 text-white text-[9px] font-black uppercase tracking-wider shadow-md">
                        -{product.discount}%
                      </span>
                    )}

                    {/* Stock Indicator Badge */}
                    <div className="absolute bottom-2 right-2">
                      {isOutOfStock ? (
                        <span className="px-2 py-0.5 rounded-lg bg-red-600/90 text-white text-[8px] font-black uppercase tracking-wider backdrop-blur-md">
                          Out of Stock
                        </span>
                      ) : totalStock <= 5 ? (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-500/90 text-white text-[8px] font-black uppercase tracking-wider backdrop-blur-md">
                          {totalStock} Left
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg bg-background/80 text-foreground text-[8px] font-black uppercase tracking-wider backdrop-blur-md border border-border/20">
                          {totalStock} in stock
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="space-y-1.5 flex-1 flex flex-col justify-between">
                    <div>
                      {product.category?.name && (
                        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest block truncate">
                          {product.category.name}
                        </span>
                      )}
                      <h4 className="text-[11px] font-bold text-foreground line-clamp-2 leading-tight uppercase tracking-tight group-hover:text-primary transition-colors">
                        {product.name}
                      </h4>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-border/10">
                      <div className="flex items-baseline gap-1.5">
                        <Price
                          amount={discountedPrice}
                          className="text-xs font-black text-foreground"
                        />
                        {hasDiscount && (
                          <Price
                            amount={product.price}
                            lineThrough
                            className="text-[9px] font-bold text-muted-foreground opacity-60"
                          />
                        )}
                      </div>

                      <div className="w-6 h-6 rounded-lg bg-muted/60 group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center transition-all">
                        <ShoppingBag size={12} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-center p-8 rounded-3xl bg-card/20 border border-dashed border-border/30">
            <ShoppingBag className="text-muted-foreground/30 mb-3" size={48} strokeWidth={1.5} />
            <p className="text-xs font-black uppercase tracking-widest text-foreground">
              No Products Found
            </p>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
              Try adjusting your search query or category filter
            </p>
          </div>
        )}
      </div>

      {/* Size Selection Popover/Modal */}
      {selectedProductForSize && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card border border-border/20 rounded-3xl shadow-2xl p-6 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={getImageUrl(selectedProductForSize.images?.[0])}
                  alt={selectedProductForSize.name}
                  className="w-14 h-14 object-cover rounded-2xl border border-border/20"
                />
                <div>
                  <h3 className="text-sm font-black uppercase tracking-tight text-foreground line-clamp-1">
                    {selectedProductForSize.name}
                  </h3>
                  <Price
                    amount={
                      selectedProductForSize.discount > 0
                        ? Math.round(selectedProductForSize.price * (1 - selectedProductForSize.discount / 100))
                        : selectedProductForSize.price
                    }
                    className="text-[10px] font-bold text-primary tracking-normal mt-0.5"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProductForSize(null)}
                className="p-1 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">
                Select Size / Variant:
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {selectedProductForSize.sizes?.map((sizeObj, idx) => {
                  const sizeId = typeof sizeObj.size === "object" && sizeObj.size ? sizeObj.size._id : sizeObj.size;
                  const sizeName = typeof sizeObj.size === "object" && sizeObj.size ? sizeObj.size.name : (sizeObj.size || "Standard");
                  const stock = sizeObj.stock || 0;
                  const isAvailable = stock > 0;

                  return (
                    <button
                      key={`${sizeId}-${idx}`}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => handleSizePick(sizeObj.size)}
                      className={cn(
                        "flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all",
                        isAvailable
                          ? "bg-background/80 hover:bg-foreground hover:text-background border-border/20 hover:border-foreground shadow-sm active:scale-95 group"
                          : "bg-muted/30 border-border/10 opacity-40 cursor-not-allowed"
                      )}
                    >
                      <span className="text-xs font-black uppercase tracking-widest">
                        {sizeName}
                      </span>
                      <span className={cn(
                        "text-[9px] font-black uppercase px-2 py-0.5 rounded-lg",
                        isAvailable ? "bg-muted/80 text-foreground group-hover:bg-background group-hover:text-foreground" : "text-muted-foreground"
                      )}>
                        {isAvailable ? `${stock} left` : "0 left"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
