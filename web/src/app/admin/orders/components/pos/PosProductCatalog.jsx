/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Barcode,
  X,
  ShoppingBag,
  PackageCheck,
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
  searchRef,
}) {
  const [selectedProductForSize, setSelectedProductForSize] = useState(null);
  const [inStockOnly, setInStockOnly] = useState(false);

  // Filter products by in-stock if toggle is active
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!inStockOnly) return products;
    return products.filter((p) => {
      const totalStock =
        p.totalStock !== undefined
          ? p.totalStock
          : p.sizes?.reduce((sum, s) => sum + (s.stock || 0), 0) || 0;
      return totalStock > 0;
    });
  }, [products, inStockOnly]);

  const handleProductCardClick = (product) => {
    const totalStock =
      product.totalStock !== undefined
        ? product.totalStock
        : product.sizes?.reduce((sum, s) => sum + (s.stock || 0), 0) || 0;

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
      if (
        e.key === "F2" ||
        (e.key === "/" &&
          document.activeElement?.tagName !== "INPUT" &&
          document.activeElement?.tagName !== "TEXTAREA")
      ) {
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
      {/* Top Search & Filter Bar */}
      <div className="space-y-3 bg-card/85 backdrop-blur-2xl p-4 rounded-2xl border border-border/40 shadow-xs">
        <div className="flex items-center gap-3">
          {/* Barcode & Search Input with Optical Centering */}
          <div className="relative flex-1">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-muted-foreground pointer-events-none">
              <Barcode size={17} className="text-primary" />
              <Search size={15} />
            </div>
            <Input
              ref={searchRef}
              type="text"
              placeholder="Scan Barcode or Search Product / SKU... (Press F2)"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-11 pl-14 pr-9 rounded-xl bg-background/80 border-border/60 text-xs font-semibold uppercase tracking-wider focus-visible:ring-1 focus-visible:ring-primary/30 text-foreground placeholder:text-muted-foreground/60 transition-[border-color,background-color]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 size-5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors"
                title="Clear search"
              >
                <X size={14} />
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
              "h-11 px-3.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-[color,background-color,border-color,transform] active:scale-95 shrink-0 gap-1.5",
              inStockOnly
                ? "bg-primary/10 text-primary border-primary/35 shadow-2xs"
                : "bg-background/80 text-muted-foreground border-border/60 hover:text-foreground hover:bg-muted"
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
              "px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider shrink-0 transition-[color,background-color,border-color,box-shadow,transform] active:scale-95 border",
              selectedCategory === "all"
                ? "bg-foreground text-background border-foreground shadow-sm"
                : "bg-background/80 text-muted-foreground border-border/50 hover:bg-muted hover:text-foreground"
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
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider shrink-0 transition-[color,background-color,border-color,box-shadow,transform] active:scale-95 border",
                  isSelected
                    ? "bg-foreground text-background border-foreground shadow-sm"
                    : "bg-background/80 text-muted-foreground border-border/50 hover:bg-muted hover:text-foreground"
                )}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Grid Area with Weightless Floating Cards & Concentric Radii */}
      <div className="flex-1 overflow-y-auto no-scrollbar pr-1">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-64 rounded-2xl bg-card/40 border border-border/30 animate-pulse p-3.5 flex flex-col justify-between"
              >
                <div className="w-full h-36 bg-muted/40 rounded-xl" />
                <div className="space-y-2">
                  <div className="w-3/4 h-3 bg-muted/40 rounded" />
                  <div className="w-1/2 h-4 bg-muted/40 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {filteredProducts.map((product) => {
              const image = product.images?.[0];
              const totalStock =
                product.totalStock !== undefined
                  ? product.totalStock
                  : product.sizes?.reduce((sum, s) => sum + (s.stock || 0), 0) || 0;
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
                    "group relative flex flex-col justify-between rounded-2xl p-3 border text-left cursor-pointer select-none transition-[background-color,border-color,box-shadow,transform] duration-200",
                    isOutOfStock
                      ? "bg-card/30 border-border/20 opacity-50 cursor-not-allowed"
                      : "bg-card/80 hover:bg-card border-border/50 hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]"
                  )}
                >
                  {/* Thumbnail & Badges */}
                  <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-muted/40 border border-border/30 mb-2.5">
                    <img
                      src={getImageUrl(image)}
                      alt={product.name}
                      className={cn(
                        "size-full object-cover outline outline-1 outline-black/10 dark:outline-white/10 -outline-offset-1 transition-transform duration-500",
                        !isOutOfStock && "group-hover:scale-105",
                        isOutOfStock && "grayscale"
                      )}
                    />

                    {/* Discount Badge */}
                    {hasDiscount && !isOutOfStock && (
                      <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-rose-500 text-white text-[9px] font-black uppercase tracking-wider shadow-sm tabular-nums font-mono">
                        -{product.discount}%
                      </span>
                    )}

                    {/* Stock Indicator Badge */}
                    <div className="absolute bottom-2 right-2">
                      {isOutOfStock ? (
                        <span className="px-2 py-0.5 rounded-md bg-red-600/90 text-white text-[8px] font-black uppercase tracking-wider backdrop-blur-md">
                          Out of Stock
                        </span>
                      ) : totalStock <= 5 ? (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/90 text-white text-[8px] font-black uppercase tracking-wider backdrop-blur-md tabular-nums font-mono">
                          {totalStock} Left
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-background/85 text-foreground text-[8px] font-bold uppercase tracking-wider backdrop-blur-md border border-border/30 tabular-nums font-mono">
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

                    <div className="pt-2 flex items-center justify-between border-t border-border/30">
                      <div className="flex items-baseline gap-1.5">
                        <Price
                          amount={discountedPrice}
                          className="text-xs font-black text-foreground tabular-nums font-mono"
                        />
                        {hasDiscount && (
                          <Price
                            amount={product.price}
                            lineThrough
                            className="text-[9px] font-bold text-muted-foreground opacity-60 tabular-nums font-mono"
                          />
                        )}
                      </div>

                      <div className="size-7 rounded-lg bg-muted/60 group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center transition-[background-color,color,transform] active:scale-90 shadow-2xs">
                        <ShoppingBag size={13} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-center p-8 rounded-2xl bg-card/30 border border-dashed border-border/40">
            <ShoppingBag className="text-muted-foreground/30 mb-3" size={44} strokeWidth={1.5} />
            <p className="text-xs font-black uppercase tracking-wider text-foreground">
              No Products Found
            </p>
            <p className="text-[11px] text-muted-foreground mt-1 uppercase tracking-wider">
              Try adjusting your search query or category filter
            </p>
          </div>
        )}
      </div>

      {/* Size Selection Popover / Modal with Spatial Depth */}
      {selectedProductForSize && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-card/95 border border-border/60 rounded-2xl shadow-2xl p-5 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={getImageUrl(selectedProductForSize.images?.[0])}
                  alt={selectedProductForSize.name}
                  className="size-14 object-cover rounded-xl border border-border/40 outline outline-1 outline-black/10 -outline-offset-1"
                />
                <div>
                  <h3 className="text-sm font-black uppercase tracking-tight text-foreground line-clamp-1">
                    {selectedProductForSize.name}
                  </h3>
                  <Price
                    amount={
                      selectedProductForSize.discount > 0
                        ? Math.round(
                          selectedProductForSize.price *
                          (1 - selectedProductForSize.discount / 100)
                        )
                        : selectedProductForSize.price
                    }
                    className="text-xs font-bold text-primary tracking-normal mt-0.5 tabular-nums font-mono"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProductForSize(null)}
                className="size-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2.5">
                Select Size / Variant:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {selectedProductForSize.sizes?.map((sizeObj, idx) => {
                  const sizeId =
                    typeof sizeObj.size === "object" && sizeObj.size
                      ? sizeObj.size._id
                      : sizeObj.size;
                  let sizeName =
                    typeof sizeObj.size === "object" && sizeObj.size
                      ? sizeObj.size.name
                      : sizeObj.size || "Standard";
                  if (/^[0-9a-fA-F]{24}$/.test(sizeName)) {
                    sizeName = "Standard";
                  }
                  const stock = sizeObj.stock || 0;
                  const isAvailable = stock > 0;

                  return (
                    <button
                      key={`${sizeId}-${idx}`}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => handleSizePick(sizeObj.size)}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-xl border text-left transition-[background-color,border-color,color,transform] active:scale-95 group",
                        isAvailable
                          ? "bg-background/90 hover:bg-foreground hover:text-background border-border/50 hover:border-foreground shadow-2xs"
                          : "bg-muted/30 border-border/20 opacity-40 cursor-not-allowed"
                      )}
                    >
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {sizeName}
                      </span>
                      <span
                        className={cn(
                          "text-[9px] font-bold uppercase px-2 py-0.5 rounded-md tabular-nums font-mono",
                          isAvailable
                            ? "bg-muted/80 text-foreground group-hover:bg-background group-hover:text-foreground"
                            : "text-muted-foreground"
                        )}
                      >
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
