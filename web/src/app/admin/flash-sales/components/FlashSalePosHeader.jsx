"use client";

import Link from "next/link";
import { 
  Zap, 
  ArrowLeft, 
  Package, 
  RotateCcw, 
  Sparkles, 
  Search,
  CheckCircle2,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function FlashSalePosHeader({
  selectedCount = 0,
  onResetProducts,
  isEdit = false,
  saleName = "",
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-8 py-3.5 bg-card/80 backdrop-blur-2xl border-b border-border/40 shadow-sm transition-all">
      {/* Left: Navigation & Event Identity */}
      <div className="flex items-center gap-3 md:gap-4">
        <Button
          asChild
          variant="ghost"
          size="icon-sm"
          className="size-9 rounded-xl border border-border/40 hover:bg-muted/60 text-muted-foreground hover:text-foreground shrink-0"
          title="Back to Flash Sales"
        >
          <Link href="/admin/flash-sales">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>

        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20 shrink-0">
            <Zap className="size-5 fill-white/20" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm md:text-base font-black tracking-tight text-foreground uppercase">
                {isEdit ? (saleName || "Edit Flash Campaign") : "Flash Sale Terminal"}
              </h1>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
                  isEdit 
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30" 
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                )}
              >
                {isEdit ? "Editing Mode" : "New Campaign"}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              Visual product catalog & instantaneous promotional pricing manifest
            </p>
          </div>
        </div>
      </div>

      {/* Right: Counter, Shortcut & Action Controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Keyboard shortcut indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/40 border border-border/40 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          <Search className="size-3 text-rose-500" />
          <span>Press</span>
          <kbd className="px-1.5 py-0.5 rounded bg-background border border-border/60 text-[9px] font-mono text-foreground font-black shadow-xs">
            F2
          </kbd>
          <span>to search</span>
        </div>

        {/* Selected Products Counter Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
          <Package className="size-4 shrink-0" />
          <span className="text-xs font-black tracking-wider uppercase">
            {selectedCount} {selectedCount === 1 ? "Product" : "Products"} Selected
          </span>
        </div>

        {/* Reset Selection Button */}
        {selectedCount > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onResetProducts}
            className="h-9 px-3 rounded-xl text-xs font-bold gap-1.5 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all"
            title="Reset selected products"
          >
            <RotateCcw className="size-3.5" />
            <span className="hidden md:inline">Clear Items</span>
          </Button>
        )}
      </div>
    </header>
  );
}

