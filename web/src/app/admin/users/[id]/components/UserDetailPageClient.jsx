"use client";

import { useParams } from "next/navigation";
import { useAdminUsers } from "@/app/admin/users/lib/useAdminUsers";
import { useAdminOrders } from "@/app/admin/orders/lib/useAdminOrders";
import { useMemo } from "react";
import Loader from "@/components/common/Loader";
import Link from "next/link";
import { 
  ShoppingBag, 
  ArrowLeft, 
  ShieldCheck, 
  DollarSign,
  Package,
  Calendar,
  Edit3,
  ExternalLink
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getImageUrl } from "@/utils/imageUtils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminPageContainer } from "@/app/admin/_components/AdminPageContainer";
import AdminPageHeader, { AdminBackLink } from "@/app/admin/_components/AdminPageHeader";
import { AdminCard, AdminCardHeader, AdminCardTitle, AdminCardContent } from "@/app/admin/_components/AdminCard";
import { AdminDataTable } from "@/app/admin/_components/AdminDataTable";
import StatusBadge from "@/app/admin/_components/StatusBadge";
import { useFilters } from "@/app/admin/_hooks/useFilters";
import { useAppStore } from "@/store/appStore";
import { cn } from "@/lib/utils";
import { Price } from "@/components/common/Price";

export default function UserDetailPage() {
  const { id } = useParams();
  const { settings } = useAppStore();
  const siteName = settings?.branding?.siteName || "Store";
  const { 
    page, 
    setPage, 
    queryParams 
  } = useFilters({
    initialLimit: 20
  });

  const { useUser } = useAdminUsers();
  const { data: userData, isLoading: isUserLoading } = useUser(id);
  
  const { orders, total, pages, isLoading: allOrdersLoading } = useAdminOrders({ 
    ...queryParams,
    user: id 
  });

  const stats = useMemo(() => {
    if (!orders) return { totalSpent: 0, totalOrders: 0 };
    const successfulOrders = orders.filter(o => o.paymentResult?.status === "Completed" || o.orderStatus === "Delivered");
    return {
      totalSpent: successfulOrders.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0),
      totalOrders: total || 0
    };
  }, [orders, total]);

  if (isUserLoading || allOrdersLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  const roleName = userData?.role?.name || "Customer";
  const memberSince = userData?.createdAt 
    ? new Date(userData.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "N/A";

  const orderColumns = [
    {
      label: "Order",
      render: (order) => (
        <div>
          <span className="font-mono text-xs font-semibold text-foreground">
            #{order._id.slice(-8).toUpperCase()}
          </span>
          <p className="text-xs text-muted-foreground">
            {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>
      ),
    },
    {
      label: "Status",
      render: (order) => <StatusBadge value={order.orderStatus} />,
    },
    {
      label: "Payment",
      render: (order) => (
        <span className="text-xs text-muted-foreground uppercase font-medium">
          {order.paymentMethod || "COD"}
        </span>
      ),
    },
    {
      label: "Total Amount",
      render: (order) => (
        <Price
          amount={order.totalPrice || 0}
          className="text-sm font-semibold text-foreground"
        />
      ),
    },
    {
      label: "Actions",
      className: "text-right",
      render: (order) => (
        <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1">
          <Link href={`/admin/orders/${order._id}`}>
            View Order <ExternalLink className="size-3" />
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <AdminPageContainer className="space-y-6">
      <AdminBackLink href="/admin/users" label="Back to Users" />

      {/* Profile Summary Card */}
      <AdminCard>
        <AdminCardContent className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <Avatar className="size-16 rounded-full border border-border/60">
              <AvatarImage src={getImageUrl(userData?.avatar)} className="object-cover" referrerPolicy="no-referrer" />
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                {userData?.name?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-foreground">
                  {userData?.name}
                </h1>
                <Badge
                  variant="outline"
                  className={cn(
                    "px-2.5 py-0.5 text-xs font-medium rounded-full capitalize",
                    roleName === "admin" || roleName === "superadmin"
                      ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/60"
                      : "bg-muted text-muted-foreground border-border/60"
                  )}
                >
                  {roleName}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    "px-2.5 py-0.5 text-xs font-medium rounded-full",
                    userData?.isActive !== false
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/60"
                      : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200/60"
                  )}
                >
                  {userData?.isActive !== false ? "Active" : "Blocked"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {userData?.email} {userData?.phone && `• ${userData.phone}`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button asChild className="h-10 text-xs gap-2 flex-1 md:flex-none">
              <Link href={`/admin/users/${id}/edit`}>
                <Edit3 className="size-4" />
                Edit Profile
              </Link>
            </Button>
          </div>
        </AdminCardContent>
      </AdminCard>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminCard>
          <AdminCardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Lifetime Spent</p>
              <Price
                amount={stats.totalSpent}
                className="text-2xl font-bold text-foreground"
              />
            </div>
            <div className="size-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <DollarSign className="size-5" />
            </div>
          </AdminCardContent>
        </AdminCard>

        <AdminCard>
          <AdminCardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold text-foreground tabular-nums">
                {stats.totalOrders}
              </p>
            </div>
            <div className="size-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Package className="size-5" />
            </div>
          </AdminCardContent>
        </AdminCard>

        <AdminCard>
          <AdminCardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Customer Since</p>
              <p className="text-lg font-bold text-foreground">
                {memberSince}
              </p>
            </div>
            <div className="size-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Calendar className="size-5" />
            </div>
          </AdminCardContent>
        </AdminCard>
      </div>

      {/* Orders History */}
      <AdminCard>
        <AdminCardHeader className="pb-3 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="size-4 text-primary" />
            <AdminCardTitle className="text-base font-semibold">
              Order History
            </AdminCardTitle>
          </div>
          <span className="text-xs text-muted-foreground">
            {total || 0} total orders
          </span>
        </AdminCardHeader>
        <AdminCardContent className="p-0">
          <AdminDataTable
            columns={orderColumns}
            data={orders || []}
            isLoading={allOrdersLoading}
            page={page}
            totalPages={pages}
            onPageChange={setPage}
            emptyTitle="No orders found"
            emptyMessage="This customer has not placed any orders yet."
          />
        </AdminCardContent>
      </AdminCard>
    </AdminPageContainer>
  );
}
