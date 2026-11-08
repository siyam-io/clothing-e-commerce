/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Trash2,
  Plus,
  Minus,
  User,
  UserCheck,
  Truck,
  Store,
  CreditCard,
  Banknote,
  Smartphone,
  Percent,
  Tag,
  Search,
  Check,
  RotateCcw,
  PauseCircle,
  FileText,
  Clock,
  ArrowRight,
  Split,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ChevronRight,
  X,
  Save,
  FileEdit,
  MapPin,
  Phone,
  Settings2,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getImageUrl } from "@/utils/imageUtils";
import { cn } from "@/lib/utils";
import { playBeep, playErrorSound, playParkSound } from "@/app/admin/orders/lib/posAudio";
import { Price } from "@/components/common/Price";

export default function PosCartRegister({
  items = [],
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,

  // Customer
  customerMode = "walkin",
  setCustomerMode,
  walkinPhone = "",
  setWalkinPhone,
  customerData,
  setCustomerData,
  searchUsers,

  // Logistics
  deliveryType = "counter",
  setDeliveryType,
  shippingRegion = "dhaka",
  setShippingRegion,
  customShippingPrice = 60,
  setCustomShippingPrice,

  // Financials
  couponCode = "",
  setCouponCode,
  manualDiscountType = "flat",
  setManualDiscountType,
  manualDiscountValue = 0,
  setManualDiscountValue,

  // Payment
  paymentMethod = "Cash",
  setPaymentMethod,
  cashReceived = "",
  setCashReceived,
  transactionId = "",
  setTransactionId,
  senderPhone = "",
  setSenderPhone,

  // Split Payment
  splitCash = "",
  setSplitCash,
  splitDigital = "",
  setSplitDigital,
  splitMethod = "bKash",
  setSplitMethod,

  // Notes
  orderNote = "",
  setOrderNote,

  // Park / Held Orders
  onHoldOrder,
  heldOrdersCount = 0,
  onOpenHeldOrders,

  // Submission
  onSubmitOrder,
  isSubmitting = false,

  // Edit Mode Parameters
  isEditing = false,
  editingOrderId = null,
  onCancelEdit = null,
}) {
  const [userQuery, setUserQuery] = useState("");
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);

  // Live member search
  useEffect(() => {
    if (!userQuery || customerMode !== "member") {
      setSearchedUsers([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingUsers(true);
      try {
        const results = await searchUsers(userQuery);
        setSearchedUsers(results || []);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [userQuery, customerMode, searchUsers]);

  // Financial Calculations
  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [items]);

  const discountAmount = useMemo(() => {
    const val = Number(manualDiscountValue) || 0;
    if (manualDiscountType === "percent") {
      return Math.min(subtotal, Math.round((subtotal * val) / 100));
    }
    return Math.min(subtotal, val);
  }, [subtotal, manualDiscountType, manualDiscountValue]);

  const shippingPrice = useMemo(() => {
    if (deliveryType === "counter") return 0;
    if (shippingRegion === "dhaka") return 60;
    if (shippingRegion === "outside") return 120;
    return Number(customShippingPrice) || 0;
  }, [deliveryType, shippingRegion, customShippingPrice]);

  const grandTotal = Math.max(0, subtotal - discountAmount + shippingPrice);

  const parsedCash = Number(cashReceived) || 0;
  const changeDue = parsedCash >= grandTotal ? parsedCash - grandTotal : 0;
  const dueRemaining = parsedCash < grandTotal && parsedCash > 0 ? grandTotal - parsedCash : 0;

  // Next round numbers for denominations
  const nextHundred = Math.ceil(grandTotal / 100) * 100;
  const nextFiveHundred = Math.ceil(grandTotal / 500) * 500;
  const nextThousand = Math.ceil(grandTotal / 1000) * 1000;

  const handleQuickCash = (amount) => {
    playBeep();
    if (amount === "exact") {
      setCashReceived(String(grandTotal));
    } else if (amount === "clear") {
      setCashReceived("");
    } else if (amount === "next100") {
      setCashReceived(String(nextHundred > grandTotal ? nextHundred : grandTotal + 100));
    } else if (amount === "next500") {
      setCashReceived(String(nextFiveHundred > grandTotal ? nextFiveHundred : grandTotal + 500));
    } else if (amount === "next1000") {
      setCashReceived(String(nextThousand > grandTotal ? nextThousand : grandTotal + 1000));
    } else {
      setCashReceived(String(Math.max(0, parsedCash + amount)));
    }
  };

  const handlePresetDiscount = (val, type = "percent") => {
    playBeep();
    setManualDiscountType(type);
    setManualDiscountValue(val);
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (items.length > 0 && !isSubmitting) {
          onSubmitOrder();
        }
      }
      if (e.key === "F7") {
        e.preventDefault();
        if (items.length > 0 && onHoldOrder) {
          playParkSound();
          onHoldOrder();
        }
      }
      if (e.key === "F8") {
        e.preventDefault();
        if (items.length > 0) {
          onClearCart();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [items, isSubmitting, onSubmitOrder, onHoldOrder, onClearCart]);

  // Clean customer display label
  const customerSummaryLabel = useMemo(() => {
    if (customerMode === "member" && customerData?.name) {
      return `${customerData.name} ${customerData.phone ? `(${customerData.phone})` : ""}`;
    }
    if (walkinPhone) {
      return `Walk-in (${walkinPhone})`;
    }
    return "Walk-in Customer";
  }, [customerMode, customerData, walkinPhone]);

  return (
    <div className="flex flex-col h-full bg-card/80 backdrop-blur-2xl rounded-3xl border border-border/30 shadow-xl overflow-hidden">

      {/* 1. Header: Sleek, compact title & register controls */}
      <div className="px-4 py-3 border-b border-border/20 bg-muted/20 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "size-8 rounded-xl flex items-center justify-center shrink-0 border",
            isEditing
              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
              : "bg-primary/10 text-primary border-primary/20"
          )}>
            {isEditing ? <FileEdit className="size-4" /> : <Store className="size-4" />}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-bold tracking-tight text-foreground uppercase">
                {isEditing ? `Edit #${editingOrderId?.slice(-8).toUpperCase()}` : "Sale Register"}
              </h2>
              <Badge
                variant="outline"
                className={cn(
                  "text-[9px] font-black uppercase tracking-wider px-1.5 py-0 rounded-md border",
                  isEditing
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                )}
              >
                {isEditing ? "Editing" : "Active"}
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {items.reduce((s, i) => s + i.quantity, 0)} {items.reduce((s, i) => s + i.quantity, 0) === 1 ? "unit" : "units"} in cart
            </p>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5">
          {heldOrdersCount > 0 && (
            <button
              type="button"
              onClick={onOpenHeldOrders}
              className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1 hover:bg-amber-500/25 transition-all"
              title="View parked orders"
            >
              <Clock size={11} />
              <span>{heldOrdersCount} Held</span>
            </button>
          )}

          {items.length > 0 && onHoldOrder && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                playParkSound();
                onHoldOrder();
              }}
              className="h-8 px-2.5 rounded-xl text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 border-amber-500/30 gap-1.5"
              title="Hold / Park Sale (F7)"
            >
              <PauseCircle size={13} />
              <span className="hidden sm:inline">Park</span>
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={items.length === 0}
            onClick={onClearCart}
            className="h-8 px-2.5 rounded-xl text-[11px] font-semibold text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 gap-1.5 disabled:opacity-40"
            title="Reset Cart (F8)"
          >
            <RotateCcw size={12} />
            <span className="hidden sm:inline">Reset</span>
          </Button>
        </div>
      </div>

      {/* 2. Customer & Fulfillment Slim Bar */}
      <div className="px-4 py-2 border-b border-border/20 bg-muted/10 flex items-center justify-between gap-3 text-xs shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="size-6 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
            <User size={13} />
          </div>
          <div className="min-w-0 flex items-center gap-2">
            <span className="font-semibold text-foreground truncate max-w-[180px] sm:max-w-[220px]">
              {customerSummaryLabel}
            </span>
            <span className="text-muted-foreground/40">•</span>
            <span className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border",
              deliveryType === "delivery"
                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                : "bg-muted text-muted-foreground border-border/30"
            )}>
              {deliveryType === "delivery" ? (
                <>
                  <Truck size={10} />
                  <span>Delivery ({shippingRegion === "dhaka" ? "৳60" : shippingRegion === "outside" ? "৳120" : `৳${customShippingPrice}`})</span>
                </>
              ) : (
                <>
                  <Store size={10} />
                  <span>In-Store</span>
                </>
              )}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowCustomerModal(true)}
          className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1 shrink-0 px-2 py-1 rounded-lg hover:bg-primary/5 transition-colors"
        >
          <Settings2 size={12} />
          <span>Edit</span>
        </button>
      </div>

      {/* 3. Cart Items List: Clean, high-density, beautifully formatted */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2">
        {items.length > 0 ? (
          items.map((item, idx) => {
            const itemImage = item.image;
            const lineTotal = item.price * item.quantity;
            // Clean human readable size label
            const displaySize = item.sizeName && !/^[0-9a-fA-F]{24}$/.test(item.sizeName)
              ? item.sizeName
              : "Standard";

            return (
              <div
                key={`${item.product}-${item.size}-${idx}`}
                className="p-2.5 rounded-2xl bg-card border border-border/40 hover:border-border/80 flex items-center gap-3 transition-[border-color,background-color] shadow-2xs group"
              >
                {/* Product Thumbnail */}
                <div className="size-12 rounded-xl bg-muted/40 p-0.5 overflow-hidden border border-border/30 shrink-0">
                  <img
                    src={getImageUrl(itemImage)}
                    alt={item.name}
                    className="size-full object-cover rounded-lg outline outline-1 outline-black/10 dark:outline-white/10 -outline-offset-1"
                  />
                </div>

                {/* Middle Info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <h4 className="text-xs font-semibold text-foreground truncate leading-tight">
                    {item.name}
                  </h4>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-muted/80 text-muted-foreground border border-border/30">
                      {displaySize}
                    </span>
                    <Price amount={item.price} className="text-xs font-bold font-mono text-foreground/85 tabular-nums" />
                  </div>
                </div>

                {/* Stepper: [ - ] [ 02 ] [ + ] with comfortable hit areas */}
                <div className="flex items-center gap-1 bg-muted/50 border border-border/40 rounded-xl p-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      playBeep();
                      onUpdateQuantity(idx, -1);
                    }}
                    className="size-7 rounded-lg bg-background hover:bg-muted text-foreground flex items-center justify-center transition-[background-color,transform] active:scale-90"
                    title="Decrease quantity"
                  >
                    <Minus size={12} />
                  </button>

                  <span className="text-xs font-mono font-bold text-foreground w-6 text-center tabular-nums">
                    {item.quantity}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      playBeep();
                      onUpdateQuantity(idx, 1);
                    }}
                    className="size-7 rounded-lg bg-foreground text-background hover:bg-foreground/90 flex items-center justify-center transition-[background-color,transform] active:scale-90 shadow-2xs"
                    title="Increase quantity"
                  >
                    <Plus size={12} strokeWidth={2.5} />
                  </button>
                </div>

                {/* Line Total */}
                <div className="w-16 text-right shrink-0">
                  <Price
                    amount={lineTotal}
                    className="text-xs font-bold font-mono text-foreground tabular-nums"
                  />
                </div>

                {/* Delete button with 32px hit area */}
                <button
                  type="button"
                  onClick={() => {
                    playBeep();
                    onRemoveItem(idx);
                  }}
                  className="size-8 rounded-xl text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 flex items-center justify-center transition-colors shrink-0"
                  title="Remove item"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })
        ) : (
          <div className="h-full min-h-[180px] flex flex-col items-center justify-center text-center p-6 border border-dashed border-border/40 rounded-2xl bg-muted/10">
            <div className="size-10 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground mb-2">
              <Store size={20} className="opacity-40" />
            </div>
            <p className="text-xs font-bold text-foreground">
              No Items in Cart
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Click products on the left or scan barcode to add
            </p>
          </div>
        )}
      </div>

      {/* 4. Bottom Summary & Checkout Deck */}
      <div className="p-3.5 border-t border-border/20 bg-muted/20 space-y-3 shrink-0">

        {/* Quick Discount & Notes Bar */}
        <div className="flex items-center gap-2">
          {/* Discount Chip Trigger */}
          <button
            type="button"
            onClick={() => setShowPromoModal(true)}
            className={cn(
              "flex-1 h-8 px-2.5 rounded-xl border text-[11px] font-semibold flex items-center justify-between transition-all",
              discountAmount > 0
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                : "bg-background/80 text-muted-foreground border-border/30 hover:border-border/60 hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-1.5 truncate">
              <Percent size={12} className={discountAmount > 0 ? "text-emerald-500" : "text-muted-foreground"} />
              <span className="truncate">
                {discountAmount > 0
                  ? (manualDiscountType === "percent" ? `${manualDiscountValue}% Discount` : `৳${manualDiscountValue} Off`)
                  : (couponCode ? `Coupon: ${couponCode}` : "Add Discount")}
              </span>
            </div>
            {discountAmount > 0 ? (
              <span className="font-bold tabular-nums">-৳{discountAmount}</span>
            ) : (
              <span className="text-[10px] text-muted-foreground/60">+</span>
            )}
          </button>

          {/* Notes Trigger */}
          <button
            type="button"
            onClick={() => setShowNoteModal(true)}
            className={cn(
              "h-8 px-2.5 rounded-xl border text-[11px] font-semibold flex items-center gap-1.5 transition-all shrink-0",
              orderNote
                ? "bg-primary/10 text-primary border-primary/30"
                : "bg-background/80 text-muted-foreground border-border/30 hover:border-border/60 hover:text-foreground"
            )}
            title="Order Note"
          >
            <FileText size={12} />
            <span>{orderNote ? "Note Added" : "Note"}</span>
          </button>
        </div>

        {/* Financial Breakdown Table */}
        <div className="p-2.5 rounded-2xl bg-card border border-border/30 space-y-1.5 text-xs">
          <div className="flex justify-between items-center text-muted-foreground">
            <span>Subtotal</span>
            <Price amount={subtotal} className="font-semibold text-foreground tabular-nums" />
          </div>

          {shippingPrice > 0 && (
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Delivery Fee ({shippingRegion === "dhaka" ? "Inside Dhaka" : shippingRegion === "outside" ? "Outside" : "Custom"})</span>
              <span className="font-semibold text-foreground tabular-nums">+৳{shippingPrice}</span>
            </div>
          )}

          {discountAmount > 0 && (
            <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-medium">
              <span>Discount</span>
              <span className="font-bold tabular-nums">-৳{discountAmount}</span>
            </div>
          )}

          <div className="flex justify-between items-baseline pt-1.5 border-t border-border/20">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Payable
            </span>
            <Price
              amount={grandTotal}
              className="text-xl font-black text-foreground tracking-tight tabular-nums"
            />
          </div>
        </div>

        {/* Payment Methods Segmented Control */}
        <div className="space-y-2">
          <div className="grid grid-cols-5 gap-1 p-1 bg-muted/60 rounded-xl border border-border/20">
            {[
              { id: "Cash", label: "Cash" },
              { id: "bKash", label: "bKash" },
              { id: "Nagad", label: "Nagad" },
              { id: "Card", label: "Card" },
              { id: "Split", label: "Split" },
            ].map((m) => {
              const isSelected = paymentMethod === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    playBeep();
                    setPaymentMethod(m.id);
                  }}
                  className={cn(
                    "py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-[color,background-color,transform] active:scale-95",
                    isSelected
                      ? "bg-foreground text-background shadow-xs font-black"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* Cash Payment Quick Tender */}
          {paymentMethod === "Cash" && (
            <div className="space-y-1.5 animate-in fade-in duration-150">
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">৳</span>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Cash Received"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    className="h-8 pl-6 text-xs font-mono font-bold tabular-nums bg-background/80 border-border/40 rounded-xl"
                  />
                </div>

                <div className="flex items-center gap-1">
                  {["exact", 500, 1000, "clear"].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleQuickCash(opt)}
                      className={cn(
                        "h-8 px-2 rounded-xl text-[10px] font-mono font-bold uppercase border transition-[background-color,border-color,color,transform] active:scale-95",
                        opt === "clear"
                          ? "bg-rose-500/10 text-rose-600 border-rose-500/25 hover:bg-rose-500/20"
                          : "bg-background/80 text-foreground border-border/40 hover:bg-muted"
                      )}
                    >
                      {opt === "exact" ? "Exact" : opt === "clear" ? "C" : `+${opt}`}
                    </button>
                  ))}
                </div>
              </div>

              {parsedCash >= grandTotal && (
                <div className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                  <span>Change Return:</span>
                  <Price amount={changeDue} className="text-sm font-black font-mono tabular-nums" />
                </div>
              )}
              {parsedCash > 0 && parsedCash < grandTotal && (
                <div className="px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between text-amber-600 dark:text-amber-400 text-xs font-bold">
                  <span>Due Remaining:</span>
                  <Price amount={dueRemaining} className="text-sm font-black font-mono tabular-nums" />
                </div>
              )}
            </div>
          )}

          {/* Digital Payment TrxID */}
          {(paymentMethod === "bKash" || paymentMethod === "Nagad" || paymentMethod === "Card") && (
            <div className="animate-in fade-in duration-150">
              <Input
                type="text"
                placeholder={paymentMethod === "Card" ? "Slip / Card Last 4 Digits..." : `${paymentMethod} TrxID / Reference...`}
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                className="h-8 rounded-xl bg-background/80 border-border/40 text-xs font-mono font-bold uppercase tracking-wider"
              />
            </div>
          )}

          {/* Split Payment Inputs */}
          {paymentMethod === "Split" && (
            <div className="space-y-1.5 animate-in fade-in duration-150 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Cash Amount (৳)"
                  value={splitCash}
                  onChange={(e) => setSplitCash(e.target.value)}
                  className="h-8 rounded-xl bg-background/80 border-border/40 text-xs font-mono font-bold tabular-nums"
                />
                <Input
                  type="number"
                  placeholder="Digital Amount (৳)"
                  value={splitDigital}
                  onChange={(e) => setSplitDigital(e.target.value)}
                  className="h-8 rounded-xl bg-background/80 border-border/40 text-xs font-mono font-bold tabular-nums"
                />
              </div>
            </div>
          )}
        </div>

        {/* Primary Action Button */}
        <Button
          type="button"
          disabled={items.length === 0 || isSubmitting}
          onClick={onSubmitOrder}
          className={cn(
            "w-full h-11 rounded-2xl font-bold text-xs uppercase tracking-wider transition-[background-color,color,transform,box-shadow] duration-200 shadow-lg active:scale-[0.98] border-none flex items-center justify-center gap-2",
            isEditing
              ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20"
              : "bg-foreground text-background hover:bg-primary hover:text-primary-foreground shadow-md"
          )}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="size-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>{isEditing ? "Updating Order..." : "Processing Sale..."}</span>
            </span>
          ) : (
            <>
              <span>{isEditing ? "Update Order" : "Complete Sale"}</span>
              <span className="opacity-80">·</span>
              <Price amount={grandTotal} className="font-black font-mono tabular-nums" />
              {isEditing ? <Save size={14} className="ml-1" /> : <ArrowRight size={14} className="ml-1" />}
            </>
          )}
        </Button>
      </div>

      {/* ================= MODALS & DRAWERS ================= */}

      {/* Customer & Fulfillment Settings Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-card border border-border/40 rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-border/20">
              <div className="flex items-center gap-2">
                <Settings2 className="size-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Customer & Fulfillment
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomerModal(false)}
                className="size-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Customer Type Tabs */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Customer Type
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/20">
                  <button
                    type="button"
                    onClick={() => setCustomerMode("walkin")}
                    className={cn(
                      "py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                      customerMode === "walkin" ? "bg-foreground text-background shadow-xs" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Store size={13} />
                    <span>Walk-in Customer</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomerMode("member")}
                    className={cn(
                      "py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                      customerMode === "member" ? "bg-foreground text-background shadow-xs" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <UserCheck size={13} />
                    <span>Registered Member</span>
                  </button>
                </div>
              </div>

              {/* Walkin Phone Input */}
              {customerMode === "walkin" && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Customer Mobile (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="e.g. 01712345678"
                      value={walkinPhone}
                      onChange={(e) => setWalkinPhone(e.target.value)}
                      className="h-9 pl-9 rounded-xl bg-background border-border/30 text-xs font-medium"
                    />
                  </div>
                </div>
              )}

              {/* Member Search */}
              {customerMode === "member" && (
                <div className="space-y-1.5 relative">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Find Member
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search member by phone or name..."
                      value={userQuery}
                      onChange={(e) => setUserQuery(e.target.value)}
                      className="h-9 pl-9 rounded-xl bg-background border-border/30 text-xs font-medium"
                    />
                  </div>
                  {userQuery && searchedUsers.length > 0 && !customerData?.selectedUser && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border/30 rounded-2xl shadow-xl z-30 max-h-40 overflow-y-auto p-1 space-y-0.5">
                      {searchedUsers.map((u) => (
                        <button
                          key={u._id}
                          type="button"
                          onClick={() => {
                            setCustomerData((prev) => ({
                              ...prev,
                              selectedUser: u,
                              name: u.name,
                              email: u.email,
                              phone: u.phone || "",
                              address: u.address || "",
                            }));
                            setUserQuery(u.name);
                          }}
                          className="w-full p-2 text-left hover:bg-muted rounded-xl text-xs flex justify-between items-center transition-colors"
                        >
                          <span className="font-semibold text-foreground">{u.name} ({u.phone || u.email})</span>
                          <Check size={14} className="text-primary" />
                        </button>
                      ))}
                    </div>
                  )}
                  {customerData?.selectedUser && (
                    <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-foreground">{customerData.name}</p>
                        <p className="text-[10px] text-muted-foreground">{customerData.phone || customerData.email}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => {
                          setCustomerData({ selectedUser: null, name: "", phone: "", address: "" });
                          setUserQuery("");
                        }}
                        className="text-muted-foreground hover:text-rose-500"
                      >
                        <X size={13} />
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Fulfillment Method */}
              <div className="space-y-1.5 pt-2 border-t border-border/20">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Fulfillment Method
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/20">
                  <button
                    type="button"
                    onClick={() => setDeliveryType("counter")}
                    className={cn(
                      "py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                      deliveryType === "counter" ? "bg-foreground text-background shadow-xs" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Store size={13} />
                    <span>In-Store Pickup</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryType("delivery")}
                    className={cn(
                      "py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                      deliveryType === "delivery" ? "bg-foreground text-background shadow-xs" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Truck size={13} />
                    <span>Home Delivery</span>
                  </button>
                </div>
              </div>

              {/* Delivery Address & Zone Controls */}
              {deliveryType === "delivery" && (
                <div className="space-y-2.5 p-3 rounded-2xl bg-muted/30 border border-border/20 animate-in fade-in duration-150">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="text"
                      placeholder="Receiver Name"
                      value={customerData?.name || ""}
                      onChange={(e) => setCustomerData((prev) => ({ ...prev, name: e.target.value }))}
                      className="h-8 rounded-xl bg-background border-border/30 text-xs"
                    />
                    <Input
                      type="text"
                      placeholder="Receiver Phone"
                      value={customerData?.phone || ""}
                      onChange={(e) => setCustomerData((prev) => ({ ...prev, phone: e.target.value }))}
                      className="h-8 rounded-xl bg-background border-border/30 text-xs"
                    />
                  </div>

                  <div className="relative">
                    <MapPin className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Full Delivery Address..."
                      value={customerData?.address || ""}
                      onChange={(e) => setCustomerData((prev) => ({ ...prev, address: e.target.value }))}
                      className="h-9 pl-8 rounded-xl bg-background border-border/30 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Delivery Zone Rate
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { id: "dhaka", label: "Dhaka (৳60)" },
                        { id: "outside", label: "Outside (৳120)" },
                        { id: "custom", label: "Custom Fee" },
                      ].map((z) => (
                        <button
                          key={z.id}
                          type="button"
                          onClick={() => setShippingRegion(z.id)}
                          className={cn(
                            "py-1 rounded-lg text-[10px] font-bold border transition-all",
                            shippingRegion === z.id
                              ? "bg-foreground text-background border-foreground font-black"
                              : "bg-background text-muted-foreground border-border/30 hover:text-foreground"
                          )}
                        >
                          {z.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {shippingRegion === "custom" && (
                    <Input
                      type="number"
                      placeholder="Custom Shipping Fee (৳)"
                      value={customShippingPrice}
                      onChange={(e) => setCustomShippingPrice(e.target.value)}
                      className="h-8 rounded-xl bg-background border-border/30 text-xs"
                    />
                  )}
                </div>
              )}
            </div>

            <div className="pt-2">
              <Button
                type="button"
                onClick={() => setShowCustomerModal(false)}
                className="w-full h-9 rounded-xl bg-foreground text-background font-bold text-xs uppercase tracking-wider"
              >
                Apply & Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Promo & Discount Modal */}
      {showPromoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-card border border-border/40 rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-border/20">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Discount / Promo</h3>
              <button
                type="button"
                onClick={() => setShowPromoModal(false)}
                className="size-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Preset Percentages */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Percentage Discount:
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[5, 10, 15, 20].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handlePresetDiscount(pct, "percent")}
                      className={cn(
                        "py-2 rounded-xl text-xs font-bold border transition-all",
                        Number(manualDiscountValue) === pct && manualDiscountType === "percent"
                          ? "bg-foreground text-background border-foreground font-black"
                          : "bg-background border-border/30 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Preset Flat Discounts */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Flat Discount (৳):
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[50, 100, 200, 500].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handlePresetDiscount(amt, "flat")}
                      className={cn(
                        "py-2 rounded-xl text-xs font-bold border transition-all",
                        Number(manualDiscountValue) === amt && manualDiscountType === "flat"
                          ? "bg-foreground text-background border-foreground font-black"
                          : "bg-background border-border/30 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      ৳{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Coupon Code Input */}
              <div className="pt-2 border-t border-border/20">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Coupon Code:
                </label>
                <Input
                  type="text"
                  placeholder="e.g. SUMMER25"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="h-9 rounded-xl uppercase font-bold tracking-wider text-xs bg-background"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setManualDiscountValue(0);
                    setCouponCode("");
                    setShowPromoModal(false);
                  }}
                  className="flex-1 rounded-xl text-xs font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 border-border/30"
                >
                  Clear
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowPromoModal(false)}
                  className="flex-1 rounded-xl bg-foreground text-background hover:bg-primary hover:text-primary-foreground text-xs font-bold"
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-card border border-border/40 rounded-3xl p-5 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-border/20">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Order Note</h3>
              <button
                type="button"
                onClick={() => setShowNoteModal(false)}
                className="size-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center"
              >
                <X size={15} />
              </button>
            </div>

            <textarea
              rows={3}
              placeholder="Add optional instructions, customer special requests, or internal packing notes..."
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
              className="w-full p-3 rounded-2xl bg-background border border-border/30 text-xs text-foreground resize-none focus:outline-hidden focus:ring-1 focus:ring-primary"
            />

            <Button
              type="button"
              onClick={() => setShowNoteModal(false)}
              className="w-full h-9 rounded-xl bg-foreground text-background font-bold text-xs uppercase tracking-wider"
            >
              Save Note
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
