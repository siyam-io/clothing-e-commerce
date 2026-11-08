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
  FileEdit,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

export default function PosHeader({
  cartCount = 0,
  onResetCart,
  heldOrdersCount = 0,
  onOpenHeldOrders,
  isEditing = false,
  editingOrderId = null,
  onCancelEdit = null,
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
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => { });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => { });
      }
    }
  };

  return (
    <header className="w-full bg-card/85 backdrop-blur-2xl border-b border-border/40 px-4 md:px-8 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40 shadow-2xs">
      {/* Left: Branding & Terminal Info */}
      <div className="flex items-center gap-3.5">
        <Link
          href={isEditing && editingOrderId ? `/admin/orders/${editingOrderId}` : "/admin/orders"}
          className="size-10 rounded-xl bg-muted/40 hover:bg-muted flex items-center justify-center border border-border/40 text-muted-foreground hover:text-foreground transition-[background-color,color,transform] active:scale-95"
          title={isEditing ? "Back to Order Details" : "Back to Orders List"}
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "size-10 rounded-xl flex items-center justify-center shadow-xs transition-colors",
              isEditing
                ? "bg-amber-500/10 border border-amber-500/30 text-amber-500"
                : "bg-primary/10 border border-primary/25 text-primary"
            )}
          >
            {isEditing ? <FileEdit size={20} /> : <Store size={20} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black uppercase tracking-tight text-foreground leading-none">
                {isEditing ? "Edit Order in POS" : "POS Terminal"}
              </h1>
              {isEditing ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  <span className="size-1.5 rounded-full bg-amber-500 animate-ping" />
                  #{editingOrderId?.slice(-8).toUpperCase()}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Register
                </span>
              )}
            </div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-1">
              {isEditing ? "Modify Items, Quantities & Rates" : "Point of Sale • Counter #01"}
            </p>
          </div>
        </div>
      </div>

      {/* Middle / Right: Operator, Live Clock, Shortcuts & Actions */}
      <div className="flex items-center gap-2.5">
        {/* Cancel Edit Button */}
        {isEditing && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancelEdit}
            className="h-10 px-3 rounded-xl bg-rose-500/10 border-rose-500/30 text-rose-500 hover:bg-rose-500/20 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-[background-color,transform] active:scale-95"
          >
            <RotateCcw size={13} />
            <span>Cancel Edit</span>
          </Button>
        )}

        {/* Live Clock with Tabular Numbers */}
        <div className="hidden lg:flex items-center gap-2 px-3.5 h-10 rounded-xl bg-muted/40 border border-border/40 text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground tabular-nums">
          <Clock size={14} className="text-primary" />
          <span>{time || "00:00:00"}</span>
        </div>

        {/* Held Orders Quick Trigger */}
        {heldOrdersCount > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenHeldOrders}
            className="h-10 px-3 rounded-xl bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 animate-pulse transition-[background-color,transform] active:scale-95"
          >
            <Clock size={14} />
            <span className="tabular-nums font-mono">{heldOrdersCount}</span>
            <span>Parked</span>
          </Button>
        )}

        {/* Operator Badge */}
        {user && (
          <div className="hidden sm:flex items-center gap-2 px-3 h-10 rounded-xl bg-muted/40 border border-border/40">
            <div className="size-6 rounded-lg bg-primary/15 text-primary flex items-center justify-center text-[10px] font-black">
              {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={12} />}
            </div>
            <div className="text-left">
              <p className="text-[11px] font-bold uppercase tracking-tight text-foreground leading-tight truncate max-w-[120px]">
                {user.name || "Cashier"}
              </p>
              <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">
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
            className="h-10 px-3 rounded-xl text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground border border-border/40 hover:bg-muted/60 gap-1.5 transition-[background-color,color,transform] active:scale-95"
            title="Keyboard Shortcuts"
          >
            <Keyboard size={15} />
            <span className="hidden md:inline">Shortcuts</span>
          </Button>

          {showShortcuts && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-card/95 border border-border/60 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-border/30">
                <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">
                  Keyboard Shortcuts
                </span>
                <span className="text-[10px] text-muted-foreground">Quick Keys</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Barcode / Search</span>
                  <kbd className="px-2 py-0.5 rounded-md bg-muted font-mono font-bold border border-border/40 text-[10px]">F2 / /</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Park / Hold Sale</span>
                  <kbd className="px-2 py-0.5 rounded-md bg-muted font-mono font-bold border border-border/40 text-[10px]">F7</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Clear Cart</span>
                  <kbd className="px-2 py-0.5 rounded-md bg-muted font-mono font-bold border border-border/40 text-[10px]">F8</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Complete Sale</span>
                  <kbd className="px-2 py-0.5 rounded-md bg-muted font-mono font-bold border border-border/40 text-[10px]">Ctrl + Enter</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Close Modal</span>
                  <kbd className="px-2 py-0.5 rounded-md bg-muted font-mono font-bold border border-border/40 text-[10px]">Esc</kbd>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Fullscreen Toggle with 40x40px touch area */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggleFullscreen}
          className="size-10 rounded-xl text-muted-foreground hover:text-foreground border border-border/40 hover:bg-muted/60 transition-[background-color,color,transform] active:scale-95"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen POS"}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </Button>
      </div>
    </header>
  );
}
