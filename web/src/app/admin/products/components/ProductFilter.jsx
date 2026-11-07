"use client";

import { useRef, useState, useEffect } from "react";
import { useAdminProducts } from "@/app/admin/products/lib/useAdminProducts";
import { useAdminCategories } from "@/app/admin/categories/lib/useAdminCategories";
import { useSubcategories } from "@/app/admin/subcategories/lib/useSubcategories";
import { useAdminFlashSales } from "@/app/admin/flash-sales/lib/useAdminFlashSales";
import { getImageUrl } from "@/utils/imageUtils";
import { cn } from "@/lib/utils";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, RotateCcw, Layers, Box, Eye, CircleDollarSign, Zap, SlidersHorizontal, ChevronRight, ChevronLeft } from "lucide-react";

export default function ProductFilter() {
  const [showFilters, setShowFilters] = useState(false);
  const { 
    filters, 
    setSearch, 
    setSort, 
    setCategory, 
    setSubcategory,
    setStockStatus,
    setIsActive,
    setPriceRange,
    setFlashSale,
    resetFilters
  } = useAdminProducts();
  
  const { categories } = useAdminCategories();
  const { subcategories } = useSubcategories();
  const { flashSales } = useAdminFlashSales();

  const [localSearch, setLocalSearch] = useState(filters.search || "");
  const [localMin, setLocalMin] = useState(filters.minPrice || "");
  const [localMax, setLocalMax] = useState(filters.maxPrice || "");

  // Debounce search
  useEffect(() => {
    setLocalSearch(filters.search || "");
  }, [filters.search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== filters.search) {
        setSearch(localSearch);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [localSearch, filters.search, setSearch]);

  // Debounce price range
  useEffect(() => {
    setLocalMin(filters.minPrice || "");
    setLocalMax(filters.maxPrice || "");
  }, [filters.minPrice, filters.maxPrice]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localMin !== filters.minPrice || localMax !== filters.maxPrice) {
        setPriceRange(localMin, localMax);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [localMin, localMax, setPriceRange, filters.minPrice, filters.maxPrice]);

  const sliderRef = useRef(null);

  const filteredSubcategories = subcategories?.filter(sub => {
    if (filters.category === "all") return true;
    const cat = categories?.find(c => c.slug === filters.category);
    return sub.category?._id === cat?._id || sub.category === cat?._id;
  }) || [];

  const clearFilters = () => {
    setLocalSearch("");
    setLocalMin("");
    setLocalMax("");
    resetFilters();
  };

  const hasActiveFilters = Boolean(
    filters.search || 
    (filters.category && filters.category !== "all") ||
    (filters.subcategory && filters.subcategory !== "all") ||
    (filters.stockStatus && filters.stockStatus !== "all") ||
    (filters.isActive && filters.isActive !== "all") ||
    (filters.flashSale && filters.flashSale !== "all") ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.sort !== "newest"
  );

  return (
    <div className="space-y-4">
      {/* 1. Main Search & Primary Controls */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input 
            placeholder="Search products by name or SKU..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-9 pr-4 h-10 rounded-xl bg-background/80 border-border/60 text-sm focus-visible:ring-1"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Sort Selection */}
          <Select value={filters.sort || "newest"} onValueChange={setSort}>
            <SelectTrigger className="h-10 min-w-[140px] rounded-xl border-border/60 bg-background/80 text-xs font-medium">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border bg-card">
              <SelectItem value="newest" className="text-xs">Newest Added</SelectItem>
              <SelectItem value="oldest" className="text-xs">Oldest Added</SelectItem>
              <SelectItem value="price-asc" className="text-xs">Price: Low to High</SelectItem>
              <SelectItem value="price-desc" className="text-xs">Price: High to Low</SelectItem>
              <SelectItem value="name-asc" className="text-xs">Alphabetical (A-Z)</SelectItem>
              <SelectItem value="stock-desc" className="text-xs">Highest Stock</SelectItem>
              <SelectItem value="stock-asc" className="text-xs">Lowest Stock</SelectItem>
            </SelectContent>
          </Select>

          {/* Toggle More Filters */}
          <Button 
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "h-10 px-3.5 rounded-xl text-xs font-medium border-border/60 gap-1.5 transition-colors cursor-pointer",
              showFilters && "bg-muted border-border font-semibold text-foreground"
            )}
          >
            <SlidersHorizontal className="size-3.5" />
            {showFilters ? "Hide Filters" : "More Filters"}
          </Button>

          {hasActiveFilters && (
            <Button 
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-10 px-3 rounded-xl text-xs text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer"
            >
              <RotateCcw className="size-3.5" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* 2. Collapsible Extended Filters Grid */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-4 rounded-xl border border-border/50 bg-muted/20 animate-in fade-in duration-200">
          {/* Subcategory Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Layers className="size-3.5" /> Subcategory
            </label>
            <Select value={filters.subcategory || "all"} onValueChange={setSubcategory}>
              <SelectTrigger className="h-9 bg-background/80 rounded-lg border-border/60 text-xs">
                <SelectValue placeholder="All Subcategories" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border bg-card">
                <SelectItem value="all" className="text-xs">All Subcategories</SelectItem>
                {filteredSubcategories.map(sub => (
                  <SelectItem key={sub._id} value={sub._id} className="text-xs">
                    {sub.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stock Status Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Box className="size-3.5" /> Stock Status
            </label>
            <Select value={filters.stockStatus || "all"} onValueChange={setStockStatus}>
              <SelectTrigger className="h-9 bg-background/80 rounded-lg border-border/60 text-xs">
                <SelectValue placeholder="All Stock Levels" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border bg-card">
                <SelectItem value="all" className="text-xs">All Stock Levels</SelectItem>
                <SelectItem value="inStock" className="text-xs text-emerald-600 dark:text-emerald-400">In Stock</SelectItem>
                <SelectItem value="lowStock" className="text-xs text-amber-600 dark:text-amber-400">Low Stock (&lt; 10)</SelectItem>
                <SelectItem value="outOfStock" className="text-xs text-rose-600 dark:text-rose-400">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Visibility Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Eye className="size-3.5" /> Visibility
            </label>
            <Select value={filters.isActive || "all"} onValueChange={setIsActive}>
              <SelectTrigger className="h-9 bg-background/80 rounded-lg border-border/60 text-xs">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border bg-card">
                <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
                <SelectItem value="true" className="text-xs text-emerald-600 dark:text-emerald-400">Active / Visible</SelectItem>
                <SelectItem value="false" className="text-xs text-muted-foreground">Hidden / Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Flash Sale Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Zap className="size-3.5 text-amber-500" /> Flash Sale
            </label>
            <Select value={filters.flashSale || "all"} onValueChange={setFlashSale}>
              <SelectTrigger className="h-9 bg-background/80 rounded-lg border-border/60 text-xs">
                <SelectValue placeholder="All Campaigns" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border bg-card">
                <SelectItem value="all" className="text-xs">All Campaigns</SelectItem>
                {flashSales?.map(sale => (
                  <SelectItem key={sale._id} value={sale._id} className="text-xs">
                    {sale.name} ({sale.discount}% off)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <CircleDollarSign className="size-3.5" /> Price Range (৳)
            </label>
            <div className="flex items-center gap-2">
              <Input 
                type="number" 
                placeholder="Min" 
                value={localMin}
                onChange={(e) => setLocalMin(e.target.value)}
                className="h-9 bg-background/80 rounded-lg border-border/60 text-xs text-center"
              />
              <span className="text-xs text-muted-foreground">—</span>
              <Input 
                type="number" 
                placeholder="Max" 
                value={localMax}
                onChange={(e) => setLocalMax(e.target.value)}
                className="h-9 bg-background/80 rounded-lg border-border/60 text-xs text-center"
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. Category Horizontal Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          type="button"
          onClick={() => setCategory("all")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer",
            (filters.category === "all" || !filters.category)
              ? "bg-foreground text-background shadow-2xs font-semibold"
              : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          All Categories
        </button>
        {categories?.map((cat) => {
          const active = filters.category === cat.slug;
          return (
            <button
              key={cat._id}
              type="button"
              onClick={() => setCategory(cat.slug)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer",
                active
                  ? "bg-foreground text-background shadow-2xs font-semibold"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {cat.image && (
                <img
                  src={getImageUrl(cat.image)}
                  alt=""
                  className="size-3.5 rounded-full object-cover"
                />
              )}
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
