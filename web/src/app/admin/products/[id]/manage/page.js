"use client";

import { use, useEffect, useState, useMemo } from "react";
import { useAdminProduct } from "@/app/admin/products/lib/useAdminProducts";
import { useSizes } from "@/app/admin/sizes/lib/useSizes";
import Loader from "@/components/common/Loader";
import { getImageUrl } from "@/utils/imageUtils";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import AdminPageContainer from "@/app/admin/_components/AdminPageContainer";
import AdminPageHeader, { AdminBackLink } from "@/app/admin/_components/AdminPageHeader";
import { AdminCard, AdminCardContent } from "@/app/admin/_components/AdminCard";

// Subcomponents for each Tab
import ManageStockTab from "@/app/admin/products/components/ManageStockTab";
import ManagePricingTab from "@/app/admin/products/components/ManagePricingTab";
import ManageImagesTab from "@/app/admin/products/components/ManageImagesTab";
import ManageReviewsTab from "@/app/admin/products/components/ManageReviewsTab";
import ManageSeoTab from "@/app/admin/products/components/ManageSeoTab";
import ProductManageNavigation from "@/app/admin/products/components/ProductManageNavigation";

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

  if (isLoading || !product) {
    return (
      <div className="admin-page-container flex items-center justify-center min-h-[60vh]">
        <Loader />
      </div>
    );
  }

  return (
    <AdminPageContainer maxWidth="max-w-6xl" className="pb-28">
      <AdminBackLink href="/admin/products" label="Back to Products" />

      <AdminPageHeader
        title="Manage Product"
        description={
          product?.name
            ? `Stock, pricing, images, reviews, and SEO for ${product.name}.`
            : "Configure product parameters, variants, and marketing attributes."
        }
        actions={
          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 px-3.5 py-2.5 shadow-2xs">
            <div className="size-10 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-muted">
              <img
                src={getImageUrl(product?.images?.[0])}
                alt={product?.name || "Product"}
                className="size-full object-cover"
              />
            </div>
            <div>
              <p className="line-clamp-1 max-w-[200px] text-xs font-semibold text-foreground tracking-tight">{product?.name}</p>
              <p className="text-[11px] font-mono text-muted-foreground">SKU: {product?.sku || "—"}</p>
            </div>
          </div>
        }
      />

      <Tabs defaultValue="stock" onValueChange={setActiveTab} className="w-full space-y-4">
        <AdminCard className="p-6 md:p-8 min-h-[600px]">
          <TabsContent value="stock" className="focus-visible:outline-none mt-0 w-full">
            <ManageStockTab 
              product={product} 
              filteredSizes={filteredSizes} 
              updateProduct={updateProduct} 
            />
          </TabsContent>

          <TabsContent value="pricing" className="focus-visible:outline-none mt-0 w-full">
            <ManagePricingTab 
              product={product} 
              patchProduct={patchProduct} 
            />
          </TabsContent>

          <TabsContent value="images" className="focus-visible:outline-none mt-0 w-full">
            <ManageImagesTab 
              product={product} 
              updateProduct={updateProduct} 
            />
          </TabsContent>

          <TabsContent value="reviews" className="focus-visible:outline-none mt-0 w-full">
            <ManageReviewsTab 
              product={product} 
              patchProduct={patchProduct} 
            />
          </TabsContent>

          <TabsContent value="seo" className="focus-visible:outline-none mt-0 w-full">
            <ManageSeoTab 
              product={product} 
              updateProduct={updateProduct} 
            />
          </TabsContent>
        </AdminCard>

        {/* Floating Bottom Navigation */}
        <ProductManageNavigation activeTab={activeTab} product={product} />
      </Tabs>
    </AdminPageContainer>
  );
}
