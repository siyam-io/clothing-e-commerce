"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Store, 
  Clock, 
  User as UserIcon, 
  Maximize2, 
  Minimize2, 
  ArrowLeft, 
  Keyboard, 
  Sparkles 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";

export default function PosHeader({ 
  cartCount = 0, 
  onResetCart,
  heldOrdersCount = 0,
  onOpenHeldOrders,
}) {
  const { user } = useAuthStore();
  const [time, setTime] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  return (
    <header className="w-full bg-card/60 backdrop-blur-2xl border-b border-border/20 px-4 md:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40">
      {/* Left: Branding & Terminal Info */}
      <div className="flex items-center gap-4">
        <Link 
          href="/admin/orders" 
          className="h-10 w-10 rounded-xl bg-muted/40 hover:bg-muted flex items-center justify-center border border-border/20 text-muted-foreground hover:text-foreground transition-all"
          title="Back to Orders List"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-lg shadow-amber-500/5">
            <Store className="text-amber-500" size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black uppercase tracking-tight text-foreground leading-none">
                POS Terminal
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Register
              </span>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
              Point of Sale • Counter #01
            </p>
          </div>
        </div>
      </div>

      {/* Middle / Right: Operator, Live Clock, Shortcuts & Actions */}
      <div className="flex items-center gap-3">
        {/* Live Clock */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/30 border border-border/10 text-[11px] font-black uppercase tracking-widest text-muted-foreground">
          <Clock size={13} className="text-primary" />
          <span>{time || "00:00:00"}</span>
        </div>

        {/* Held Orders Quick Trigger */}
        {heldOrdersCount > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenHeldOrders}
            className="h-9 px-3 rounded-xl bg-amber-500/10 border-amber-500/25 text-amber-500 hover:bg-amber-500/20 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 animate-pulse"
          >
            <Clock size={13} />
            <span>{heldOrdersCount} Parked</span>
          </Button>
        )}

        {/* Operator Badge */}
        {user && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/30 border border-border/10">
            <div className="w-6 h-6 rounded-lg bg-primary/20 text-primary flex items-center justify-center text-[10px] font-black">
              {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={12} />}
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-tight text-foreground leading-tight truncate max-w-[120px]">
                {user.name || "Cashier"}
              </p>
              <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">
                {user.role?.name || "Staff"}
              </p>
            </div>
          </div>
        )}

        {/* Keyboard Shortcuts Helper */}
        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowShortcuts(!showShortcuts)}
            className="h-9 px-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground border border-border/10 hover:bg-muted/40 gap-1.5"
            title="Keyboard Shortcuts"
          >
            <Keyboard size={14} />
            <span className="hidden md:inline">Shortcuts</span>
          </Button>

          {showShortcuts && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-card border border-border/20 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-200 backdrop-blur-3xl">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-border/10">
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
                  Keyboard Shortcuts
                </span>
                <span className="text-[9px] text-muted-foreground">POS Quick Keys</span>
              </div>
              <div className="space-y-2 text-[10px]">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Focus Barcode / Search</span>
                  <kbd className="px-2 py-0.5 rounded bg-muted font-black border border-border/20 text-[9px]">F2 / /</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Park / Hold Sale</span>
                  <kbd className="px-2 py-0.5 rounded bg-muted font-black border border-border/20 text-[9px]">F7</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Clear Cart</span>
                  <kbd className="px-2 py-0.5 rounded bg-muted font-black border border-border/20 text-[9px]">F8</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Complete Sale</span>
                  <kbd className="px-2 py-0.5 rounded bg-muted font-black border border-border/20 text-[9px]">Ctrl + Enter</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Close Modal / Esc</span>
                  <kbd className="px-2 py-0.5 rounded bg-muted font-black border border-border/20 text-[9px]">Esc</kbd>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Fullscreen Toggle */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggleFullscreen}
          className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground border border-border/10 hover:bg-muted/40"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen POS"}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </Button>
      </div>
    </header>
  );
}

