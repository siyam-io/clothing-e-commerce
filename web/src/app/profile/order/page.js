"use client";

import { useState, useMemo, useEffect } from "react";
import { useProfileOrders } from "@/app/profile/lib/useProfileOrders";
import { useSearchParams } from "next/navigation";
import { useAppStore } from "@/store/appStore";
import { toast } from "sonner";
import ProfileOrders from "@/app/profile/components/ProfileOrders";
import OrderDetailsDialog from "@/app/profile/components/OrderDetailsDialog";
import Pagination from "@/components/common/Pagination";

const DICTIONARY = {
  en: {
    orderTitle: "Collection Archives",
    orderSub: "Historical records of your premium acquisitions.",
    noOrders: "No Assets Logged",
    noOrdersSub: "Your archive is currently empty. Initiate your first drop.",
    startShop: "Enter Marketplace",
  },
  bn: {
    orderTitle: "কালেকশন আর্কাইভ",
    orderSub: "আপনার প্রিমিয়াম কেনাকাটার ঐতিহাসিক রেকর্ড।",
    noOrders: "কোনো সম্পদ নেই",
    noOrdersSub: "আপনার আর্কাইভ বর্তমানে খালি। প্রথম ড্রপ শুরু করুন।",
    startShop: "মার্কেটপ্লেসে প্রবেশ",
  },
};

export default function ProfileOrdersPage() {
  const searchParams = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const { myOrders: ordersData, myOrdersLoading, myOrdersError } = useProfileOrders(null, null, currentPage, itemsPerPage);
  const { lang } = useAppStore();
  
  // Order Details Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const ui = useMemo(() => DICTIONARY[lang] || DICTIONARY["en"], [lang]);

  const orders = useMemo(() => {
    if (Array.isArray(ordersData)) return ordersData;
    return ordersData?.orders || [];
  }, [ordersData]);

  const totalPages = useMemo(() => {
    if (Array.isArray(ordersData)) {
      return Math.ceil(ordersData.length / itemsPerPage);
    }
    return ordersData?.totalPages || 0;
  }, [ordersData]);

  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages);
  }

  useEffect(() => {
    const status = searchParams.get("status");

    if (status === "success") {
      toast.success("Transaction Logged Successfully", {
        description: "Your order sequence has been initiated."
      });
      window.history.replaceState(null, "", "/profile/order");
    } else if (status === "failed") {
      toast.error("Protocol Interrupted", {
        description: "Payment failed. Please re-initiate the sequence."
      });
      window.history.replaceState(null, "", "/profile/order");
    }
  }, [searchParams]);

  useEffect(() => {
    if (myOrdersError) {
      console.error("❌ ORDER FETCH ERROR", myOrdersError);
      toast.error("Failed to load orders", {
        description: myOrdersError?.message || "Unable to fetch your orders"
      });
    }
  }, [myOrdersError]);

  const handleOpenDetails = (id) => {
    setSelectedOrder(id);
    setDetailsOpen(true);
  };

  if (myOrdersError) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="py-24 text-center space-y-8 border-2 border-dashed border-red-500/30 rounded-[3rem] bg-red-500/5">
          <div className="text-red-500 text-lg font-black">❌ Error Loading Orders</div>
          <p className="text-muted-foreground">{myOrdersError?.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <ProfileOrders 
        orders={orders} 
        ui={ui} 
        loading={myOrdersLoading} 
        onOpenDetails={handleOpenDetails}
      />

      {totalPages > 1 && (
        <Pagination
          page={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      <OrderDetailsDialog 
        orderId={selectedOrder} 
        open={detailsOpen} 
        onOpenChange={setDetailsOpen} 
        ui={ui} 
      />
    </div>
  );
}



