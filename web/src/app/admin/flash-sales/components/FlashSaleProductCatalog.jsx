"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Search, 
  Barcode, 
  X, 
  Check, 
  PackageCheck, 
  Layers, 
  CheckSquare, 
  Square,
  Sparkles,
  AlertCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getImageUrl } from "@/utils/imageUtils";
import { Price } from "@/components/common/Price";
import { cn } from "@/lib/utils";
import { playBeep, playErrorSound } from "@/app/admin/orders/lib/posAudio";

export default function FlashSaleProductCatalog({
  products = [],
  categories = [],
  isLoading = false,
  searchTerm = "",
  onSearchChange,
  selectedCategory = "all",
  onSelectCategory,
  selectedProducts = [],
  onToggleProduct,
  onBatchToggleProducts,
  discountPercentage = 0,
  searchRef,
}) {
  const [inStockOnly, setInStockOnly] = useState(false);

  // Set of selected product IDs for O(1) fast lookup
  const selectedIdSet = useMemo(() => {
    return new Set(selectedProducts.map((p) => p._id));
  }, [selectedProducts]);

  // Filter products by in-stock toggle
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

  // Check how many of the currently visible products are selected
  const visibleSelectedCount = useMemo(() => {
    return filteredProducts.filter((p) => selectedIdSet.has(p._id)).length;
  }, [filteredProducts, selectedIdSet]);

  const allVisibleSelected = filteredProducts.length > 0 && visibleSelectedCount === filteredProducts.length;

  const handleCardClick = (product) => {
    onToggleProduct(product);
    playBeep();
  };

  const handleToggleAllVisible = () => {
    if (allVisibleSelected) {
      // Deselect all visible
      const idsToRemove = new Set(filteredProducts.map((p) => p._id));
      onBatchToggleProducts(false, idsToRemove);
    } else {
      // Select all visible
      onBatchToggleProducts(true, filteredProducts);
    }
    playBeep();
  };

  // Keyboard shortcut listener: F2 or / to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "F2" || (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA")) {
        e.preventDefault();
        searchRef?.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchRef]);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Search & Category Filter Controls */}
      <div className="space-y-3 bg-card/70 backdrop-blur-2xl p-4 rounded-3xl border border-border/30 shadow-sm">
        <div className="flex items-center gap-3">
          {/* Barcode & Search Input */}
          <div className="relative flex-1">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-muted-foreground/60 pointer-events-none">
              <Barcode size={18} className="text-rose-500" />
              <Search size={16} />
            </div>
            <Input
              ref={searchRef}
              type="text"
              placeholder="Scan Barcode or Search Products for Flash Sale... (F2)"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-12 pl-16 pr-10 rounded-2xl bg-background/60 border-border/30 text-xs font-bold uppercase tracking-wider focus:ring-2 focus:ring-rose-500/20 text-foreground placeholder:text-muted-foreground/50 transition-all"
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

          {/* In-Stock Filter Toggle */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setInStockOnly(!inStockOnly)}
            className={cn(
              "h-12 px-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border-border/30 gap-2 shrink-0 transition-all",
              inStockOnly 
                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30" 
                : "bg-background/60 text-muted-foreground hover:text-foreground"
            )}
            title="Filter In-Stock Only"
          >
            <PackageCheck size={16} />
            <span className="hidden sm:inline">In-Stock</span>
          </Button>

          {/* Select All Visible Bulk Button */}
          {filteredProducts.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleToggleAllVisible}
              className={cn(
                "h-12 px-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border-border/30 gap-2 shrink-0 transition-all",
                allVisibleSelected
                  ? "bg-rose-500 text-white border-rose-500"
                  : "bg-background/60 text-foreground hover:bg-muted/60"
              )}
              title={allVisibleSelected ? "Deselect all visible products" : "Select all visible products"}
            >
              {allVisibleSelected ? <CheckSquare size={16} /> : <Square size={16} />}
              <span className="hidden md:inline">
                {allVisibleSelected ? "Deselect View" : `Add View (${filteredProducts.length})`}
              </span>
            </Button>
          )}
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
                : "bg-background/60 text-muted-foreground border-border/20 hover:bg-muted/40 hover:text-foreground"
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
                    : "bg-background/60 text-muted-foreground border-border/20 hover:bg-muted/40 hover:text-foreground"
                )}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Grid Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar pr-1 pb-4">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div 
                key={i} 
                className="h-64 rounded-3xl bg-card/40 border border-border/20 animate-pulse p-4 flex flex-col justify-between"
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

              const isSelected = selectedIdSet.has(product._id);
              const numericDiscount = Number(discountPercentage) || 0;
              const projectedPrice = numericDiscount > 0
                ? Math.round(product.price * (1 - numericDiscount / 100))
                : product.price;

              return (
                <div
                  key={product._id}
                  onClick={() => handleCardClick(product)}
                  className={cn(
                    "group relative flex flex-col justify-between p-3.5 rounded-3xl cursor-pointer transition-all border select-none overflow-hidden",
                    isSelected
                      ? "bg-rose-500/10 border-rose-500/80 shadow-lg shadow-rose-500/10 ring-2 ring-rose-500/40"
                      : "bg-card/60 backdrop-blur-md border-border/30 hover:border-border/80 hover:shadow-md hover:bg-card/90"
                  )}
                >
                  {/* Status Badges */}
                  <div className="absolute top-5 left-5 right-5 z-10 flex items-center justify-between pointer-events-none">
                    {/* Selected Badge */}
                    {isSelected ? (
                      <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider shadow-md flex items-center gap-1 animate-in zoom-in-75 duration-150">
                        <Check className="size-3 stroke-[3]" />
                        <span>In Sale</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-background/80 backdrop-blur-md text-foreground text-[9px] font-black uppercase tracking-wider border border-border/30">
                        + Add
                      </span>
                    )}

                    {/* Stock Pill */}
                    <span 
                      className={cn(
                        "px-2 py-0.5 rounded-md text-[9px] font-bold backdrop-blur-md",
                        totalStock > 0 
                          ? "bg-background/80 text-foreground/80 border border-border/30" 
                          : "bg-rose-500/80 text-white"
                      )}
                    >
                      {totalStock > 0 ? `Stock: ${totalStock}` : "Out"}
                    </span>
                  </div>

                  {/* Product Thumbnail */}
                  <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-muted/40 mb-3 border border-border/10">
                    {image ? (
                      <img
                        src={getImageUrl(image)}
                        alt={product.name}
                        className={cn(
                          "w-full h-full object-cover transition-transform duration-300 group-hover:scale-105",
                          !isSelected && "group-hover:grayscale-0"
                        )}
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                        <Layers size={32} />
                      </div>
                    )}

                    {/* Selected Indicator Overlay */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-rose-600/15 backdrop-blur-[0.5px] flex items-center justify-center">
                        <div className="size-10 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg">
                          <Check className="size-5 stroke-[3]" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Product Details & Prices */}
                  <div className="space-y-1.5 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-foreground line-clamp-2 leading-tight tracking-tight">
                        {product.name}
                      </h4>
                      {product.category?.name && (
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mt-0.5">
                          {product.category.name}
                        </p>
                      )}
                    </div>

                    {/* Pricing: Original vs Projected Flash Sale Price */}
                    <div className="pt-2 border-t border-border/20 flex items-baseline justify-between">
                      {numericDiscount > 0 ? (
                        <div className="flex items-baseline gap-1.5">
                          <Price
                            amount={projectedPrice}
                            className="text-xs font-black text-rose-600 dark:text-rose-400 tabular-nums"
                          />
                          <span className="text-[10px] text-muted-foreground line-through tabular-nums">
                            ৳{product.price}
                          </span>
                        </div>
                      ) : (
                        <Price
                          amount={product.price}
                          className="text-xs font-black text-foreground tabular-nums"
                        />
                      )}

                      {numericDiscount > 0 && (
                        <span className="text-[9px] font-black text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">
                          -{numericDiscount}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-96 rounded-3xl border border-dashed border-border/40 flex flex-col items-center justify-center p-8 text-center bg-card/20">
            <div className="size-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground mb-3">
              <AlertCircle className="size-6 opacity-40" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">No Products Found</h3>
            <p className="text-xs text-muted-foreground max-w-xs mt-1 mb-4">
              {searchTerm 
                ? `No products match "${searchTerm}". Try a different search term or category.` 
                : "No products available in this category."}
            </p>
            {searchTerm && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onSearchChange("")}
                className="rounded-xl text-xs font-bold"
              >
                Clear Search
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

