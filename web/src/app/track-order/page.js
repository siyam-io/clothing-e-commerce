"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Package, 
  Truck, 
  Clock, 
  ChevronRight, 
  AlertCircle,
  ShoppingBag,
  ArrowRight,
  Phone,
  FileText
} from "lucide-react";
import { useOrders } from "@/app/track-order/lib/useOrders";
import { getImageUrl } from "@/utils/imageUtils";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import OrderDetailsDialog from "@/app/profile/components/OrderDetailsDialog";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/appStore";
import { Price } from "@/components/common/Price";

export default function TrackOrderPage() {
  const router = useRouter();
  const { settings } = useAppStore();
  const siteName = settings?.branding?.siteName || "Store";

  useEffect(() => {
    document.title = `Track Order | ${siteName}`;
  }, [siteName]);

  const [orderIdInput, setOrderIdInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [selectedDetailsId, setSelectedDetailsId] = useState(null);

  // Auto-fetch my orders for the current guest session
  const { myOrders, isLoading: ordersLoading } = useOrders();
  
  // Specific order search
  const { orderDetails, orderDetailsLoading, isError } = useOrders(
    searchTriggered ? orderIdInput : null, 
    searchTriggered ? phoneInput : null
  );

  const handleSearch = (e) => {
    e.preventDefault();
    if (orderIdInput.trim() && phoneInput.trim()) {
      setSearchTriggered(true);
    }
  };

  const statusColors = {
    "Pending": "bg-amber-500",
    "Processing": "bg-blue-500",
    "Shipped": "bg-indigo-500",
    "Delivered": "bg-emerald-500",
    "Cancelled": "bg-rose-500"
  };

  return (
    <div className="min-h-screen bg-background pt-32 pb-24 px-4 overflow-hidden relative">
      {/* Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-primary/5 to-transparent -z-10" />
      <div className="absolute top-[20%] -right-24 w-96 h-96 bg-accent/5 blur-[120px] rounded-full -z-10 animate-pulse" />
      
      <div className="max-w-4xl mx-auto space-y-12 relative">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 bg-foreground text-background rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl rotate-3"
          >
            <Truck size={32} />
          </motion.div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter"
          >
            Track Your <span className="text-primary italic-none not-italic">Order</span>
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground"
          >
            Real-time fulfillment protocol tracking
          </motion.p>
        </div>

        {/* Search Form Card */}
        <motion.div 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-accent/5 backdrop-blur-3xl border border-border/10 p-8 md:p-12 rounded-[3rem] shadow-2xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
             <Search size={120} />
          </div>

          <form onSubmit={handleSearch} className="space-y-8 relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Order Identity</label>
                <div className="relative">
                  <FileText className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <input 
                    type="text" 
                    placeholder="E.G. 6A079..."
                    value={orderIdInput}
                    onChange={(e) => {
                      setOrderIdInput(e.target.value);
                      setSearchTriggered(false);
                    }}
                    className="w-full bg-background/50 border border-border/20 rounded-2xl py-5 pl-14 pr-6 text-sm font-bold uppercase tracking-widest focus:ring-2 ring-primary/20 transition-all outline-none"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <input 
                    type="text" 
                    placeholder="01XXXXXXXXX"
                    value={phoneInput}
                    onChange={(e) => {
                      setPhoneInput(e.target.value);
                      setSearchTriggered(false);
                    }}
                    className="w-full bg-background/50 border border-border/20 rounded-2xl py-5 pl-14 pr-6 text-sm font-bold tracking-widest focus:ring-2 ring-primary/20 transition-all outline-none"
                  />
                </div>
              </div>
            </div>
            <button 
              type="submit"
              disabled={!orderIdInput || !phoneInput || orderDetailsLoading}
              className="w-full bg-foreground text-background py-6 rounded-3xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {orderDetailsLoading ? "Syncing..." : "Initialize Search"} <ChevronRight size={16} />
            </button>
          </form>
        </motion.div>

        {/* Search Results */}
        <AnimatePresence mode="wait">
          {searchTriggered && (orderDetails || isError) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-4 px-4">
                <div className="h-px flex-1 bg-border/20" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Search Manifest</span>
                <div className="h-px flex-1 bg-border/20" />
              </div>

              {orderDetails ? (
                <div 
                  onClick={() => setSelectedDetailsId(orderDetails._id)}
                  className="bg-accent/10 border border-primary/20 p-8 rounded-[2.5rem] cursor-pointer hover:bg-accent/20 transition-all group"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary">Order Found</p>
                      <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                        Status: <span className="text-foreground italic-none not-italic">{orderDetails.orderStatus}</span>
                      </h3>
                      <p className="text-xs font-bold text-muted-foreground">Placed on {new Date(orderDetails.createdAt).toLocaleDateString(undefined, { dateStyle: 'full' })}</p>
                    </div>
                    <Badge className={cn("px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-widest border-none shadow-xl", statusColors[orderDetails.orderStatus])}>
                      {orderDetails.orderStatus}
                    </Badge>
                  </div>
                  <div className="mt-8 flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-primary transition-colors">
                    Click to view full protocol details <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              ) : (
                <div className="bg-rose-500/10 border border-rose-500/20 p-12 rounded-[2.5rem] text-center space-y-4">
                  <AlertCircle size={40} className="text-rose-500 mx-auto" />
                  <p className="text-sm font-black uppercase tracking-widest">Protocol mismatch</p>
                  <p className="text-xs text-muted-foreground">No order found matching these credentials. Please check and try again.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* History Section (Auto-fetched for guests) */}
        {!searchTriggered && (
          <div className="space-y-10">
            <div className="flex items-center justify-between px-4">
              <h2 className="text-2xl font-black uppercase italic tracking-tighter">Recent Sessions</h2>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <Clock size={12} /> Auto-synced
              </div>
            </div>

            {ordersLoading ? (
              <div className="space-y-6">
                {[1, 2].map(i => (
                  <div key={i} className="h-40 w-full bg-accent/10 animate-pulse rounded-[2.5rem]" />
                ))}
              </div>
            ) : myOrders?.length > 0 ? (
              <div className="space-y-6">
                {myOrders.map((order) => (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => setSelectedDetailsId(order._id)}
                    className="bg-accent/5 border border-border/10 p-6 md:p-8 rounded-[2.5rem] hover:border-accent-secondary/30 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between gap-6">
                      <div className="flex gap-6 items-center">
                        <div className="w-16 h-16 bg-background rounded-2xl flex items-center justify-center border border-border/10 shadow-lg group-hover:scale-110 transition-transform">
                          <Package className="text-primary w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-black uppercase tracking-tighter text-primary">#{order._id.slice(-8).toUpperCase()}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="hidden sm:flex flex-col items-end gap-2">
                        <Badge className={cn("px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border-none", statusColors[order.orderStatus])}>
                          {order.orderStatus}
                        </Badge>
                        <Price
                          amount={order.totalPrice}
                          className="text-sm font-black not-italic"
                        />
                      </div>
                      <ChevronRight size={20} className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center space-y-6 border-2 border-dashed border-border/10 rounded-[3rem]">
                <ShoppingBag size={48} className="mx-auto text-muted-foreground/20" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">No active fulfillment sessions detected</p>
                <button 
                  onClick={() => router.push("/products")}
                  className="px-10 py-4 bg-foreground text-background rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
                >
                  Start Shopping
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Order Details Dialog */}
      <OrderDetailsDialog 
        orderId={selectedDetailsId}
        open={!!selectedDetailsId}
        onOpenChange={(val) => !val && setSelectedDetailsId(null)}
        phone={phoneInput}
      />
    </div>
  );
}
