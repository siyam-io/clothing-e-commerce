"use client";

import { use, useState } from "react";
import { useProductHistory } from "@/app/admin/products/lib/useProductHistory";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  CreditCard,
  TrendingUp,
  PackageCheck,
  ShoppingCart,
  User as UserIcon
} from "lucide-react";
import Link from "next/link";
import { getImageUrl } from "@/utils/imageUtils";
import AdminPageContainer from "@/app/admin/_components/AdminPageContainer";
import AdminPageHeader, { AdminBackLink } from "@/app/admin/_components/AdminPageHeader";
import { AdminCard, AdminCardHeader, AdminCardTitle, AdminCardContent } from "@/app/admin/_components/AdminCard";
import AdminDataTable from "@/app/admin/_components/AdminDataTable";
import AdminStatusBadge from "@/app/admin/_components/AdminStatusBadge";
import { Price } from "@/components/common/Price";

export default function ProductHistoryPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const { id } = params;
  const [page, setPage] = useState(1);
  const { data, isLoading } = useProductHistory(id, page, 10);

  if (isLoading) {
    return (
      <AdminPageContainer>
        <Skeleton className="h-10 w-48 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </AdminPageContainer>
    );
  }

  const { product, stats, history, pagination } = data || {};

  const columns = [
    {
      label: "Customer",
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-full bg-muted overflow-hidden border border-border/60 shrink-0">
            {item.customer?.avatar ? (
              <img 
                src={getImageUrl(item.customer.avatar)} 
                alt="" 
                className="size-full object-cover"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            ) : (
              <div className="size-full flex items-center justify-center text-muted-foreground">
                <UserIcon className="size-4" />
              </div>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground tracking-tight">
              {item.customer?.name || "Customer"}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {item.isGuest ? "Guest Checkout" : "Registered User"}
            </p>
          </div>
        </div>
      )
    },
    {
      label: "Quantity",
      render: (item) => (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground">
          <span className="px-2 py-0.5 rounded-md bg-muted border border-border/60 tabular-nums">
            {item.quantity}
          </span>
          <span className="text-muted-foreground font-normal">units</span>
        </span>
      )
    },
    {
      label: "Total Amount",
      render: (item) => (
        <div>
          <Price amount={item.total || 0} className="text-xs font-semibold text-foreground" />
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Price amount={item.price || 0} />
            <span>each</span>
          </span>
        </div>
      )
    },
    {
      label: "Order Date",
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="size-3.5" />
          <span>
            {new Date(item.date).toLocaleDateString()} · {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      )
    },
    {
      label: "Status",
      render: (item) => <AdminStatusBadge value={item.orderStatus} />
    },
    {
      label: "Action",
      align: "right",
      render: (item) => (
        <Button asChild variant="ghost" size="sm" className="h-8 px-2.5 rounded-lg text-xs font-medium">
          <Link href={`/admin/orders/${item.orderId}`}>
            View Order
          </Link>
        </Button>
      )
    }
  ];

  return (
    <AdminPageContainer maxWidth="max-w-6xl">
      <AdminBackLink href="/admin/products" label="Back to Products" />

      <AdminPageHeader
        title="Sales History"
        description={`Transaction log and performance metrics for ${product?.name || "Product"}`}
        actions={
          <div className="flex items-center gap-3 bg-muted/40 p-2.5 rounded-xl border border-border/60 shadow-2xs">
            <div className="size-10 rounded-lg overflow-hidden border border-border/60 bg-muted shrink-0">
              <img src={getImageUrl(product?.images?.[0])} alt="" className="size-full object-cover" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Retail Price</p>
              <Price amount={product?.price || 0} className="text-base font-semibold text-foreground" />
            </div>
          </div>
        }
      />

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          label="Total Units Sold" 
          value={stats?.totalSold || 0} 
          unit="units" 
          icon={PackageCheck} 
          description="Cumulative items sold"
        />
        <StatsCard 
          label="Total Revenue" 
          value={<Price amount={stats?.totalRevenue || 0} />} 
          icon={TrendingUp} 
          description="Total sales generated"
        />
        <StatsCard 
          label="Total Orders" 
          value={stats?.orderCount || 0} 
          unit="orders" 
          icon={ShoppingCart} 
          description="Distinct purchase orders"
        />
        <StatsCard 
          label="Avg. Order Value" 
          value={<Price amount={stats?.orderCount ? Math.round(stats.totalRevenue / stats.orderCount) : 0} />} 
          icon={CreditCard} 
          description="Average revenue per order"
        />
      </div>

      {/* Orders Table */}
      <AdminCard>
        <AdminCardHeader>
          <AdminCardTitle>Sales Transactions</AdminCardTitle>
        </AdminCardHeader>
        <AdminCardContent className="p-0">
          <AdminDataTable
            columns={columns}
            data={history || []}
            emptyTitle="No Sales Records Yet"
            emptyDescription="This product has not been purchased in any completed order."
            pagination={{
              page,
              totalPages: pagination?.pages || 1,
              total: pagination?.total,
              onPageChange: setPage,
            }}
          />
        </AdminCardContent>
      </AdminCard>
    </AdminPageContainer>
  );
}

function StatsCard({ label, value, unit, icon: Icon, description }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-2xs backdrop-blur-md relative overflow-hidden flex flex-col justify-between">
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <div className="size-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
          <Icon className="size-4" />
        </div>
      </div>
      <div>
        <div className="flex items-baseline gap-1.5">
          <h3 className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {value}
          </h3>
          {unit && <span className="text-xs text-muted-foreground font-normal">{unit}</span>}
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  );
}
