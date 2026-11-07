"use client";

import { Suspense } from "react";
import { useAdminProducts } from "@/app/admin/products/lib/useAdminProducts";
import ProductFilter from "@/app/admin/products/components/ProductFilter";
import ProductTable from "@/app/admin/products/components/ProductTable";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import AdminPageContainer from "@/app/admin/_components/AdminPageContainer";
import AdminPageHeader, { AdminHeaderButton } from "@/app/admin/_components/AdminPageHeader";
import { AdminCard, AdminCardContent } from "@/app/admin/_components/AdminCard";

function AdminProductsContent() {
  const { pagination, isLoading } = useAdminProducts();

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="Products"
        description={`Manage your product catalog, inventory, and visibility · ${pagination?.total || 0} total products`}
        actions={
          <AdminHeaderButton href="/admin/products/new" icon={Plus}>
            Add Product
          </AdminHeaderButton>
        }
      />

      <AdminCard>
        <div className="p-4 sm:p-6 border-b border-border/40 bg-muted/20">
          <ProductFilter />
        </div>

        <AdminCardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <ProductTable />
          )}
        </AdminCardContent>
      </AdminCard>
    </AdminPageContainer>
  );
}

export default function AdminProductsPage() {
  return (
    <Suspense
      fallback={
        <AdminPageContainer>
          <Skeleton className="h-16 w-1/3 rounded-xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </AdminPageContainer>
      }
    >
      <AdminProductsContent />
    </Suspense>
  );
}
