/* eslint-disable @next/next/no-img-element */
"use client";

import { use, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAdminProduct } from "@/app/admin/products/lib/useAdminProducts";
import { useSizes } from "@/app/admin/sizes/lib/useSizes";
import Loader from "@/components/common/Loader";
import { getImageUrl } from "@/utils/imageUtils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AdminPageContainer from "@/app/admin/_components/AdminPageContainer";
import { AdminBackLink } from "@/app/admin/_components/AdminPageHeader";
import { AdminCard } from "@/app/admin/_components/AdminCard";
import {
  Package,
  DollarSign,
  Image as ImageIcon,
  MessageSquare,
  Search,
  ExternalLink,
  Edit2,
  Tag,
  Star,
  Layers,
  Sparkles,
} from "lucide-react";

// Subcomponents for each Tab
import ManageStockTab from "@/app/admin/products/components/ManageStockTab";
import ManagePricingTab from "@/app/admin/products/components/ManagePricingTab";
import ManageImagesTab from "@/app/admin/products/components/ManageImagesTab";
import ManageReviewsTab from "@/app/admin/products/components/ManageReviewsTab";
import ManageSeoTab from "@/app/admin/products/components/ManageSeoTab";

export default function ProductManagementPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const { id } = params;
  const { product: fetchedProduct, isLoading, updateProduct, patchProduct } = useAdminProduct(id);
  const { sizes } = useSizes();

  const [product, setProduct] = useState(null);
  const [activeTab, setActiveTab] = useState("stock");

  // Find and bind current product
  useEffect(() => {
    if (fetchedProduct) {
      setProduct(fetchedProduct);
    }
  }, [fetchedProduct]);

  const filteredSizes = useMemo(() => {
    if (!product || !sizes) return [];
    const catId = product.category?._id || product.category;
    return sizes.filter(
      (size) => (size.category?._id || size.category) === catId
    );
  }, [product, sizes]);

  // Total stock calculated across all size variants
  const totalStock = useMemo(() => {
    if (!product?.sizes || !Array.isArray(product.sizes)) return 0;
    return product.sizes.reduce((acc, curr) => acc + (Number(curr.stock) || 0), 0);
  }, [product?.sizes]);

  if (isLoading || !product) {
    return (
      <div className="admin-page-container flex items-center justify-center min-h-[60vh]">
        <Loader />
      </div>
    );
  }

  const primaryImage = product.images?.[0] ? getImageUrl(product.images[0]) : null;
  const discountedPrice =
    product.discount > 0
      ? Math.round(product.price * (1 - product.discount / 100))
      : product.price;

  return (
    <AdminPageContainer maxWidth="max-w-7xl">
      {/* Top Breadcrumb Link */}
      <AdminBackLink href="/admin/products" label="Back to Products Catalog" />

      {/* ============================================================ */}
      {/* 1. PRODUCT HERO GLANCE HEADER (EXECUTIVE SUMMARY)             */}
      {/* ============================================================ */}
      <div className="mb-6 rounded-2xl border border-border/70 bg-card/80 backdrop-blur-md p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Left: Product Thumbnail & Title Identity */}
          <div className="flex items-start sm:items-center gap-4 min-w-0">
            <div className="size-16 sm:size-18 rounded-2xl border border-border/80 overflow-hidden bg-muted/30 shrink-0 relative shadow-2xs">
              {primaryImage ? (
                <img
                  src={primaryImage}
                  alt={product.name}
                  className="size-full object-cover"
                />
              ) : (
                <div className="size-full flex items-center justify-center text-muted-foreground">
                  <Package className="size-6 opacity-40" />
                </div>
              )}
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-muted/50 border-border/70"
                >
                  {product.category?.name || "Apparel"}
                </Badge>
                {product.brand && (
                  <span className="text-xs font-semibold text-muted-foreground">
                    • {product.brand}
                  </span>
                )}
                <span className="font-mono text-xs text-muted-foreground">
                  SKU: <strong className="text-foreground">{product.sku || "UNASSIGNED"}</strong>
                </span>
              </div>

              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground truncate max-w-xl">
                {product.name}
              </h1>

              {/* Pricing & Stock Glance */}
              <div className="flex items-center gap-3 pt-0.5 text-xs text-muted-foreground">
                <div className="flex items-baseline gap-1.5 font-bold tabular-nums">
                  <span className="text-base text-foreground font-extrabold">৳{discountedPrice}</span>
                  {product.discount > 0 && (
                    <>
                      <span className="text-xs text-muted-foreground line-through">৳{product.price}</span>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                        -{product.discount}%
                      </span>
                    </>
                  )}
                </div>

                <span>•</span>

                <span
                  className={`inline-flex items-center gap-1 font-semibold ${
                    totalStock > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
                  }`}
                >
                  <span className={`size-1.5 rounded-full ${totalStock > 0 ? "bg-emerald-500" : "bg-rose-500"}`} />
                  {totalStock > 0 ? `${totalStock} units in stock` : "Out of Stock"}
                </span>

                {product.rating > 0 && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-semibold text-amber-500">
                      <Star className="size-3 fill-amber-500" />
                      {product.rating} ({product.numReviews || 0})
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Quick External Action Buttons */}
          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            {product.slug && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-9 px-3 rounded-xl text-xs font-semibold gap-1.5 border-border/80 bg-background hover:bg-muted text-foreground cursor-pointer shadow-2xs"
              >
                <Link href={`/products/${product.slug}`} target="_blank" rel="noopener noreferrer">
                  <span>View Storefront</span>
                  <ExternalLink className="size-3.5 text-muted-foreground" />
                </Link>
              </Button>
            )}

            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-9 px-3 rounded-xl text-xs font-semibold gap-1.5 border-border/80 bg-background hover:bg-muted text-foreground cursor-pointer shadow-2xs"
            >
              <Link href={`/admin/products/${product._id}`}>
                <Edit2 className="size-3.5 text-muted-foreground" />
                <span>Full Edit Form</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. TOP MANAGEMENT TAB BAR & WORKSPACE                        */}
      {/* ============================================================ */}
      <Tabs defaultValue="stock" value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        {/* Prominent Top Tab List (Desktop & Mobile Friendly) */}
        <div className="overflow-x-auto pb-1 scrollbar-none">
          <TabsList className="w-full sm:w-auto inline-flex h-11 p-1 bg-muted/50 rounded-2xl border border-border/60 gap-1">
            <TabsTrigger
              value="stock"
              className="h-9 px-4 rounded-xl text-xs font-semibold gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all cursor-pointer"
            >
              <Package className="size-3.5" />
              <span>Stock & Variants</span>
            </TabsTrigger>

            <TabsTrigger
              value="pricing"
              className="h-9 px-4 rounded-xl text-xs font-semibold gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all cursor-pointer"
            >
              <DollarSign className="size-3.5" />
              <span>Pricing Dynamics</span>
            </TabsTrigger>

            <TabsTrigger
              value="images"
              className="h-9 px-4 rounded-xl text-xs font-semibold gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all cursor-pointer"
            >
              <ImageIcon className="size-3.5" />
              <span>Media Gallery ({product.images?.length || 0})</span>
            </TabsTrigger>

            <TabsTrigger
              value="reviews"
              className="h-9 px-4 rounded-xl text-xs font-semibold gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all cursor-pointer"
            >
              <MessageSquare className="size-3.5" />
              <span>Reviews & Ratings</span>
            </TabsTrigger>

            <TabsTrigger
              value="seo"
              className="h-9 px-4 rounded-xl text-xs font-semibold gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all cursor-pointer"
            >
              <Search className="size-3.5" />
              <span>SEO & AI Marketing</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Contents Wrapped in Card */}
        <AdminCard className="rounded-2xl border-border/80 shadow-2xs min-h-[520px] p-6 sm:p-8">
          <TabsContent value="stock" className="focus-visible:outline-none mt-0 w-full">
            <ManageStockTab
              product={product}
              filteredSizes={filteredSizes}
              updateProduct={updateProduct}
              setProduct={setProduct}
            />
          </TabsContent>

          <TabsContent value="pricing" className="focus-visible:outline-none mt-0 w-full">
            <ManagePricingTab
              product={product}
              updateProduct={updateProduct}
              patchProduct={patchProduct}
              setProduct={setProduct}
            />
          </TabsContent>

          <TabsContent value="images" className="focus-visible:outline-none mt-0 w-full">
            <ManageImagesTab
              product={product}
              updateProduct={updateProduct}
              setProduct={setProduct}
            />
          </TabsContent>

          <TabsContent value="reviews" className="focus-visible:outline-none mt-0 w-full">
            <ManageReviewsTab
              product={product}
              patchProduct={patchProduct}
              setProduct={setProduct}
            />
          </TabsContent>

          <TabsContent value="seo" className="focus-visible:outline-none mt-0 w-full">
            <ManageSeoTab
              product={product}
              updateProduct={updateProduct}
              setProduct={setProduct}
            />
          </TabsContent>
        </AdminCard>
      </Tabs>
    </AdminPageContainer>
  );
}
