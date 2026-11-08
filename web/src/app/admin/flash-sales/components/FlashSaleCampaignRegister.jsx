"use client";

import { useMemo } from "react";
import { 
  Zap, 
  Trash2, 
  Clock, 
  Calendar, 
  Save, 
  Package, 
  Layers, 
  Check, 
  Sparkles, 
  Loader2,
  Percent,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { getImageUrl } from "@/utils/imageUtils";
import { Price } from "@/components/common/Price";
import { cn } from "@/lib/utils";

const DISCOUNT_PRESETS = [10, 15, 20, 25, 30, 40, 50];

export default function FlashSaleCampaignRegister({
  name,
  setName,
  description,
  setDescription,
  discount,
  setDiscount,
  startImmediately,
  setStartImmediately,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  isActive,
  setIsActive,
  selectedProducts = [],
  onRemoveProduct,
  onClearProducts,
  onSubmit,
  isSaving = false,
  isEdit = false,
}) {
  const numericDiscount = Number(discount) || 0;

  // Aggregate financial metrics for promotional manifest
  const { totalRegularValue, totalPromotionalValue, totalSavings } = useMemo(() => {
    let regular = 0;
    let promo = 0;
    selectedProducts.forEach((p) => {
      const price = Number(p.price) || 0;
      regular += price;
      const discounted = numericDiscount > 0
        ? Math.round(price * (1 - numericDiscount / 100))
        : price;
      promo += discounted;
    });
    return {
      totalRegularValue: regular,
      totalPromotionalValue: promo,
      totalSavings: regular - promo,
    };
  }, [selectedProducts, numericDiscount]);

  return (
    <div className="flex flex-col h-full bg-card/70 backdrop-blur-2xl rounded-3xl border border-border/30 shadow-lg overflow-hidden">
      {/* Top Header: Campaign Control Center */}
      <div className="p-4 md:p-5 border-b border-border/20 bg-muted/20 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              <Zap className="size-4" />
            </div>
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-foreground">
                Campaign Parameters
              </h2>
              <p className="text-[10px] text-muted-foreground">
                Configure timing, discount percentage, and store visibility
              </p>
            </div>
          </div>

          {/* Active Switch Pill */}
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={cn(
              "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-1.5",
              isActive
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                : "bg-muted text-muted-foreground border-border/40"
            )}
          >
            <span className={cn("size-2 rounded-full", isActive ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground")} />
            {isActive ? "Campaign Active" : "Draft / Inactive"}
          </button>
        </div>

        {/* Campaign Name Input */}
        <div className="space-y-1">
          <Input
            type="text"
            placeholder="Sale Campaign Title (e.g. Midnight Mega Sale)..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-10 rounded-xl bg-background/80 border-border/40 text-xs font-bold uppercase tracking-wider focus:ring-2 focus:ring-rose-500/20"
          />
        </div>

        {/* Discount Selection: Number Input + Fast Preset Pills */}
        <div className="space-y-2 p-3 rounded-2xl bg-rose-500/5 border border-rose-500/20">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <Percent className="size-3" /> Flash Discount Rate
            </Label>
            <span className="text-xs font-black text-rose-600 dark:text-rose-400 tabular-nums">
              {numericDiscount}% OFF
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={100}
              placeholder="25"
              value={discount || ""}
              onChange={(e) => setDiscount(Math.min(100, Math.max(0, Number(e.target.value))))}
              className="h-9 w-24 rounded-xl bg-background border-rose-500/30 text-center font-black text-sm text-rose-600 dark:text-rose-400 tabular-nums"
            />

            {/* Fast Preset Chips */}
            <div className="flex-1 flex items-center gap-1 overflow-x-auto no-scrollbar">
              {DISCOUNT_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDiscount(preset)}
                  className={cn(
                    "px-2 py-1 rounded-lg text-[10px] font-black tabular-nums transition-all shrink-0 border",
                    numericDiscount === preset
                      ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                      : "bg-background/80 text-foreground/80 border-border/30 hover:border-rose-500/40"
                  )}
                >
                  {preset}%
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Timeframe Controls (Start Immediately + Start/End Dates) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Start Time
              </Label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={startImmediately}
                  onChange={(e) => setStartImmediately(e.target.checked)}
                  className="size-3 rounded border-border/60 text-rose-600 cursor-pointer"
                />
                <span className="text-[10px] font-bold text-foreground">Immediate</span>
              </label>
            </div>
            {!startImmediately && (
              <Input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 rounded-lg bg-background/80 border-border/40 text-[11px] font-medium"
              />
            )}
            {startImmediately && (
              <div className="h-8 px-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center text-[10px] font-bold text-rose-600 dark:text-rose-400">
                Starts immediately when launched
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              End Date & Time *
            </Label>
            <Input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-8 rounded-lg bg-background/80 border-border/40 text-[11px] font-medium"
            />
          </div>
        </div>
      </div>

      {/* Middle: Staged Campaign Products Manifest */}
      <div className="flex-1 flex flex-col min-h-[220px] overflow-hidden">
        {/* Manifest Header */}
        <div className="px-4 py-2.5 bg-muted/30 border-b border-border/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="size-3.5 text-muted-foreground" />
            <span className="text-[11px] font-black uppercase tracking-wider text-foreground">
              Selected Manifest ({selectedProducts.length})
            </span>
          </div>

          {selectedProducts.length > 0 && (
            <button
              type="button"
              onClick={onClearProducts}
              className="text-[10px] font-bold text-muted-foreground hover:text-rose-600 uppercase tracking-widest transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Scrollable Items List */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2">
          {selectedProducts.length === 0 ? (
            <div className="h-full min-h-[180px] flex flex-col items-center justify-center p-6 text-center text-muted-foreground/60">
              <div className="size-12 rounded-2xl bg-muted/40 border border-border/20 flex items-center justify-center mb-2">
                <Zap className="size-5 text-rose-500/40" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                No Products Staged Yet
              </p>
              <p className="text-[11px] text-muted-foreground max-w-xs mt-1">
                Click any product on the left catalog or scan a barcode to add it to this flash sale event.
              </p>
            </div>
          ) : (
            selectedProducts.map((p) => {
              const image = p.images?.[0];
              const price = Number(p.price) || 0;
              const discountedPrice = numericDiscount > 0
                ? Math.round(price * (1 - numericDiscount / 100))
                : price;

              return (
                <div
                  key={p._id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-background/80 border border-border/30 hover:border-border/60 transition-all shadow-xs group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={getImageUrl(image)}
                      alt={p.name}
                      className="size-11 rounded-xl object-cover border border-border/20 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate leading-tight">
                        {p.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-black text-rose-600 dark:text-rose-400 tabular-nums">
                          ৳{discountedPrice}
                        </span>
                        {numericDiscount > 0 && (
                          <span className="text-[10px] text-muted-foreground line-through tabular-nums">
                            ৳{price}
                          </span>
                        )}
                        {numericDiscount > 0 && (
                          <span className="text-[9px] font-black text-rose-600 bg-rose-500/10 px-1 rounded">
                            -{numericDiscount}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onRemoveProduct(p)}
                    className="size-7 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors shrink-0"
                    title="Remove product from sale"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Bottom Financial Metrics & Launch CTA */}
      <div className="p-4 md:p-5 border-t border-border/20 bg-muted/20 space-y-3">
        {selectedProducts.length > 0 && (
          <div className="p-3 rounded-2xl bg-background/80 border border-border/30 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Catalog Value:</span>
              <span className="font-bold tabular-nums">৳{totalRegularValue.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 font-bold">
              <span>Promotional Flash Value:</span>
              <span className="font-black text-sm tabular-nums">৳{totalPromotionalValue.toLocaleString()}</span>
            </div>
            {totalSavings > 0 && (
              <div className="flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-medium pt-1 border-t border-border/20">
                <span>Total Customer Savings:</span>
                <span className="font-black tabular-nums">৳{totalSavings.toLocaleString()}</span>
              </div>
            )}
          </div>
        )}

        <Button
          type="button"
          disabled={!name?.trim() || numericDiscount <= 0 || !endDate || selectedProducts.length === 0 || isSaving}
          onClick={onSubmit}
          className="w-full h-12 bg-gradient-to-r from-rose-600 to-amber-500 text-white hover:from-rose-500 hover:to-amber-400 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-rose-500/20 transition-all active:scale-[0.98] gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Saving Campaign...</span>
            </>
          ) : (
            <>
              <Zap className="size-4 fill-white/20" />
              <span>
                {isEdit ? "Update Flash Campaign" : "Launch Flash Sale"}{" "}
                ({selectedProducts.length} Items)
              </span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

