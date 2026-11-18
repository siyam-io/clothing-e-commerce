"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Truck, 
  ChevronRight, 
  AlertCircle,
  ArrowRight,
  Phone,
  FileText
} from "lucide-react";
import { useOrders } from "@/app/track-order/lib/useOrders";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import OrderDetailsDialog from "@/app/profile/components/OrderDetailsDialog";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/appStore";

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

        {/* How It Works / Secure Tracking Guidelines */}
        {!searchTriggered && (
          <div className="space-y-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-accent/5 border border-border/10 p-6 md:p-8 rounded-[2.5rem] space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <FileText size={20} />
                </div>
                <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                  1. Order Identity
                </h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Enter your unique Order ID found in your SMS notification or email invoice slip.
                </p>
              </div>

              <div className="bg-accent/5 border border-border/10 p-6 md:p-8 rounded-[2.5rem] space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Phone size={20} />
                </div>
                <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                  2. Phone Verification
                </h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Enter the exact mobile number provided during checkout to verify ownership.
                </p>
              </div>

              <div className="bg-accent/5 border border-border/10 p-6 md:p-8 rounded-[2.5rem] space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Truck size={20} />
                </div>
                <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                  3. Live Tracking
                </h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Track courier status, parcel dispatch milestones, and estimated arrival in real time.
                </p>
              </div>
            </div>

            <div className="text-center pt-2">
              <p className="text-xs text-muted-foreground">
                Looking for your previous order history?{" "}
                <button
                  type="button"
                  onClick={() => router.push("/profile")}
                  className="font-bold text-foreground hover:text-primary underline underline-offset-4 transition-colors"
                >
                  View all past orders in your Profile
                </button>
              </p>
            </div>
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
