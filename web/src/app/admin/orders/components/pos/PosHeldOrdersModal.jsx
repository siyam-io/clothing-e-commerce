"use client";

import { X, Clock, ShoppingBag, ArrowRight, Trash2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/common/Price";

export default function PosHeldOrdersModal({
  isOpen,
  onClose,
  heldOrders = [],
  onResumeOrder,
  onDeleteHeldOrder,
  onClearAllHeld,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-card border border-border/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-border/15 flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Clock size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black uppercase tracking-tight text-foreground">
                  Parked / Held Orders
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  {heldOrders.length} Held
                </span>
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
                Resume temporarily suspended carts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {heldOrders.length > 0 && (
              <button
                type="button"
                onClick={onClearAllHeld}
                className="text-[10px] font-bold text-rose-500 hover:text-rose-600 px-2 py-1 rounded-lg hover:bg-rose-500/10 transition-colors"
              >
                Clear All
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {heldOrders.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <ShoppingBag className="mx-auto text-muted-foreground/30" size={40} />
              <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                No Held Orders
              </p>
              <p className="text-[10px] text-muted-foreground/60 max-w-xs mx-auto">
                Use the Hold / Park button (F7) in the register to temporarily save a cart while serving another customer.
              </p>
            </div>
          ) : (
            heldOrders.map((held, idx) => {
              const totalItems = (held.items || []).reduce((s, i) => s + i.quantity, 0);
              const subtotal = (held.items || []).reduce((s, i) => s + i.price * i.quantity, 0);
              const timeString = new Date(held.timestamp || Date.now()).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={held.id || idx}
                  className="p-4 rounded-2xl bg-card border border-border/20 hover:border-border/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-muted text-foreground">
                        #{idx + 1}
                      </span>
                      <span className="text-xs font-black text-foreground truncate">
                        {held.label || `Held Order (${totalItems} items)`}
                      </span>
                      <span className="text-[9px] text-muted-foreground font-mono flex items-center gap-1">
                        <Clock size={10} />
                        {timeString}
                      </span>
                    </div>

                    {/* Customer info */}
                    <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                      <span>Customer: <strong className="text-foreground">{held.customerData?.name || held.walkinPhone || "Walk-in"}</strong></span>
                      <span>•</span>
                      <span>{totalItems} items</span>
                      <span>•</span>
                      <Price amount={subtotal} className="font-black text-primary" />
                    </div>

                    {/* Items preview */}
                    <div className="text-[9px] text-muted-foreground/80 truncate max-w-sm">
                      {(held.items || []).map((i) => `${i.name} (x${i.quantity})`).join(", ")}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => onResumeOrder(held)}
                      className="h-9 px-3 rounded-xl bg-foreground text-background hover:bg-emerald-600 hover:text-white font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all"
                    >
                      <RotateCcw size={12} />
                      <span>Resume</span>
                      <ArrowRight size={12} />
                    </Button>
                    <button
                      type="button"
                      onClick={() => onDeleteHeldOrder(held.id)}
                      className="w-9 h-9 rounded-xl hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 flex items-center justify-center transition-colors"
                      title="Discard held order"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/15 bg-muted/10 flex justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="text-xs font-black uppercase tracking-wider"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

