"use client";

import { useAdminProducts } from "@/app/admin/products/lib/useAdminProducts";
import DataTable from "@/app/admin/_components/DataTable";
import Pagination from "@/components/common/Pagination";
import AdminStatusBadge from "@/app/admin/_components/AdminStatusBadge";
import ProductActionButtons from "@/app/admin/products/components/ProductActionButtons";
import { getImageUrl } from "@/utils/imageUtils";
import { ImageIcon } from "lucide-react";
import { Price } from "@/components/common/Price";

export default function ProductTable() {
  const {
    products,
    pagination,
    isFetching,
    setPage,
  } = useAdminProducts();

  const columns = [
    {
      label: "Product",
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-xl overflow-hidden border border-border/60 bg-muted shrink-0">
            {item.images?.[0] ? (
              <img
                src={getImageUrl(item.images[0])}
                alt={item.name}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <ImageIcon className="size-4 opacity-40" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground tracking-tight truncate max-w-[240px] sm:max-w-xs">
              {item.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {item.category?.name || "Uncategorized"}
              {item.sku && <span className="ml-2 font-mono text-[11px]">SKU: {item.sku}</span>}
            </p>
          </div>
        </div>
      ),
    },
    {
      label: "Price",
      render: (item) => (
        <Price
          amount={item.price || 0}
          decimals={2}
          className="text-sm font-semibold text-foreground"
        />
      ),
    },
    {
      label: "Stock Status",
      render: (item) => {
        const stock = item.totalStock ?? 0;
        let status = "in_stock";
        let label = "In Stock";
        if (stock === 0) {
          status = "out_of_stock";
          label = "Out of Stock";
        } else if (stock < 10) {
          status = "low_stock";
          label = `Low Stock (${stock})`;
        } else {
          label = `${stock} in stock`;
        }
        
        return (
          <div className="flex items-center gap-2">
            <AdminStatusBadge value={status} label={label} />
          </div>
        );
      },
    },
    {
      label: "Visibility",
      render: (item) => (
        <AdminStatusBadge 
          value={item.isActive ? "active" : "inactive"} 
          label={item.isActive ? "Active" : "Hidden"} 
        />
      ),
    },
    {
      label: "Actions",
      align: "right",
      render: (item) => <ProductActionButtons product={item} />,
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable 
        columns={columns} 
        data={products || []} 
        className="border-none shadow-none rounded-none" 
      />
      
      {pagination && pagination.pages > 1 && (
        <div className="p-4 border-t border-border/40 bg-muted/10">
          <Pagination
            page={pagination?.page}
            totalPages={pagination?.pages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
