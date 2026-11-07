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
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  isSubmitting = false
}) {
  const [userQuery, setUserQuery] = useState("");
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [showCustomerSection, setShowCustomerSection] = useState(false);
  const [showNoteField, setShowNoteField] = useState(false);

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

  // Calculations
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

  // Quick Cash Add helper
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

  // Preset discount helper
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

  return (
    <div className="flex flex-col h-full bg-card/60 backdrop-blur-2xl rounded-3xl border border-border/20 shadow-xl overflow-hidden">
      
      {/* 1. Header: "Detail Transaction" & "Reset Order" - Styled with System Theme */}
      <div className="p-4 sm:p-5 border-b border-border/15 flex items-center justify-between gap-3 bg-muted/20 shrink-0">
        <div>
          <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-foreground">
            Detail Transaction
          </h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              {items.reduce((s, i) => s + i.quantity, 0)} Items Selected
            </span>

            {/* Held Orders quick badge */}
            {heldOrdersCount > 0 && (
              <button
                type="button"
                onClick={onOpenHeldOrders}
                className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center gap-1 hover:bg-amber-500/25 transition-all animate-pulse"
                title="View parked orders"
              >
                <Clock size={10} />
                <span>{heldOrdersCount} Held</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Park / Hold Sale Button */}
          {items.length > 0 && onHoldOrder && (
            <button
              type="button"
              onClick={() => {
                playParkSound();
                onHoldOrder();
              }}
              className="text-xs font-bold text-amber-500 hover:text-amber-600 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all"
              title="Hold / Park Sale (F7)"
            >
              <PauseCircle size={13} />
              <span className="hidden sm:inline">Park</span>
            </button>
          )}

          {/* Reset Order Button */}
          <button
            type="button"
            disabled={items.length === 0}
            onClick={onClearCart}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all border",
              items.length > 0
                ? "bg-card border-border/20 text-muted-foreground hover:text-rose-500 hover:border-rose-500/30 hover:bg-rose-500/10"
                : "bg-muted/40 border-border/10 text-muted-foreground/40 cursor-not-allowed"
            )}
            title="Reset Cart (F8)"
          >
            <div className="w-4 h-4 rounded-full bg-rose-500/15 text-rose-500 flex items-center justify-center">
              <RotateCcw size={10} />
            </div>
            <span>Reset Order</span>
          </button>
        </div>
      </div>

      {/* Customer Mode Expandable Bar */}
      <div className="px-4 py-2 border-b border-border/10 bg-muted/10 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Customer:</span>
          <span className="font-bold text-foreground truncate max-w-[200px]">
            {customerMode === "walkin" ? (walkinPhone ? `Walk-in (${walkinPhone})` : "Walk-in Customer") : (customerData?.name || "Member")}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowCustomerSection(!showCustomerSection)}
          className="text-[10px] font-bold uppercase tracking-wider text-primary hover:underline flex items-center gap-0.5"
        >
          <span>{showCustomerSection ? "Hide Details" : "Edit Customer"}</span>
          <ChevronRight size={12} className={cn("transition-transform", showCustomerSection && "rotate-90")} />
        </button>
      </div>

      {/* Customer Info Form (Collapsed by default, opens cleanly) */}
      {showCustomerSection && (
        <div className="p-4 border-b border-border/15 bg-muted/20 space-y-2.5 animate-in fade-in duration-200">
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-muted/40 rounded-2xl border border-border/10">
            <button
              type="button"
              onClick={() => setCustomerMode("walkin")}
              className={cn(
                "py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5",
                customerMode === "walkin" ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Store size={12} />
              <span>Walk-in Customer</span>
            </button>
            <button
              type="button"
              onClick={() => setCustomerMode("member")}
              className={cn(
                "py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5",
                customerMode === "member" ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <UserCheck size={12} />
              <span>Registered Member</span>
            </button>
          </div>

          {customerMode === "walkin" && (
            <Input
              type="text"
              placeholder="Customer Mobile (Optional)"
              value={walkinPhone}
              onChange={(e) => setWalkinPhone(e.target.value)}
              className="h-8 rounded-xl bg-background/60 border-border/20 text-xs font-bold"
            />
          )}

          {customerMode === "member" && (
            <div className="relative">
              <Input
                type="text"
                placeholder="Search member by phone or name..."
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                className="h-8 rounded-xl bg-background/60 border-border/20 text-xs font-bold"
              />
              {userQuery && searchedUsers.length > 0 && !customerData?.selectedUser && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border/20 rounded-2xl shadow-xl z-30 max-h-40 overflow-y-auto">
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
                      className="w-full p-2.5 text-left hover:bg-muted text-xs flex justify-between items-center transition-colors"
                    >
                      <span className="font-bold text-foreground">{u.name} ({u.phone || u.email})</span>
                      <Check size={14} className="text-primary" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Optional Home Delivery / Courier Shipping Card */}
          <div className="p-3 rounded-2xl bg-card/60 border border-border/20 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck size={14} className={deliveryType === "delivery" ? "text-primary" : "text-muted-foreground"} />
                <div>
                  <p className="text-[10px] font-black uppercase text-foreground leading-none">
                    Delivery Option (হোম ডেলিভারি)
                  </p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">
                    {deliveryType === "delivery" ? "Delivery fee added to bill" : "Optional (Default: Counter / In-Store Pickup)"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  playBeep();
                  setDeliveryType(deliveryType === "delivery" ? "counter" : "delivery");
                }}
                className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border",
                  deliveryType === "delivery"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/40 text-muted-foreground border-border/20 hover:text-foreground"
                )}
              >
                {deliveryType === "delivery" ? "Enabled" : "+ Add Delivery"}
              </button>
            </div>

            {deliveryType === "delivery" && (
              <div className="space-y-2 pt-2 border-t border-border/10 animate-in fade-in duration-150">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="text"
                    placeholder="Receiver Name (Optional)"
                    value={customerData?.name || ""}
                    onChange={(e) => setCustomerData((prev) => ({ ...prev, name: e.target.value }))}
                    className="h-8 rounded-xl bg-background/60 border-border/20 text-xs"
                  />
                  <Input
                    type="text"
                    placeholder="Mobile Phone (Optional)"
                    value={customerData?.phone || ""}
                    onChange={(e) => setCustomerData((prev) => ({ ...prev, phone: e.target.value }))}
                    className="h-8 rounded-xl bg-background/60 border-border/20 text-xs"
                  />
                </div>
                <Input
                  type="text"
                  placeholder="Delivery Address (Optional)"
                  value={customerData?.address || ""}
                  onChange={(e) => setCustomerData((prev) => ({ ...prev, address: e.target.value }))}
                  className="h-8 rounded-xl bg-background/60 border-border/20 text-xs"
                />
                <div className="grid grid-cols-3 gap-1">
                  {["dhaka", "outside", "custom"].map((zone) => (
                    <button
                      key={zone}
                      type="button"
                      onClick={() => setShippingRegion(zone)}
                      className={cn(
                        "py-1 rounded-lg text-[9px] font-black uppercase border transition-all",
                        shippingRegion === zone
                          ? "bg-foreground text-background border-foreground"
                          : "bg-background/60 text-muted-foreground border-border/20"
                      )}
                    >
                      {zone === "dhaka" ? "Inside Dhaka (৳60)" : zone === "outside" ? "Outside (৳120)" : "Custom"}
                    </button>
                  ))}
                </div>
                {shippingRegion === "custom" && (
                  <Input
                    type="number"
                    placeholder="Custom Fee (৳)"
                    value={customShippingPrice}
                    onChange={(e) => setCustomShippingPrice(e.target.value)}
                    className="h-8 rounded-xl bg-background/60 border-border/20 text-xs mt-1"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Cart Items List - Clean Card Architecture with System Theme */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3.5 space-y-2.5">
        {items.length > 0 ? (
          items.map((item, idx) => {
            const itemImage = item.image;
            return (
              <div
                key={`${item.product}-${item.size}-${idx}`}
                className="p-3 rounded-2xl bg-card/40 border border-border/20 hover:border-border/40 flex items-center gap-3 relative group transition-all"
              >
                {/* Product Thumbnail on Left */}
                <div className="w-13 h-13 rounded-xl bg-muted/40 p-1 flex items-center justify-center overflow-hidden border border-border/10 shrink-0">
                  <img
                    src={getImageUrl(itemImage)}
                    alt={item.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>

                {/* Middle Info & Stepper */}
                <div className="flex-1 min-w-0 pr-12">
                  <h4 className="text-[11px] font-black uppercase text-foreground leading-tight truncate">
                    {item.name}
                  </h4>

                  {/* Size & Color / Variant */}
                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground mt-0.5">
                    <span className="px-1.5 py-0.2 rounded bg-muted/60 text-muted-foreground uppercase">
                      Size {item.sizeName || "Universal"}
                    </span>
                    <span>•</span>
                    <Price amount={item.price} className="text-primary font-black" />
                  </div>

                  {/* Stepper: - 01 + with System Primary (+) Circle Button */}
                  <div className="flex items-center gap-1.5 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        playBeep();
                        onUpdateQuantity(idx, -1);
                      }}
                      className="w-5 h-5 rounded-full bg-muted hover:bg-muted/80 text-foreground flex items-center justify-center transition-all active:scale-90"
                      title="Decrease"
                    >
                      <Minus size={11} />
                    </button>

                    <span className="text-xs font-black text-foreground w-6 text-center tabular-nums">
                      {String(item.quantity).padStart(2, "0")}
                    </span>

                    {/* Primary Button Stepper */}
                    <button
                      type="button"
                      onClick={() => {
                        playBeep();
                        onUpdateQuantity(idx, 1);
                      }}
                      className="w-5 h-5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center font-black transition-all shadow-sm active:scale-90"
                      title="Increase"
                    >
                      <Plus size={11} strokeWidth={3} />
                    </button>
                  </div>
                </div>

                {/* Red Circular Delete Button at Top-Right */}
                <button
                  type="button"
                  onClick={() => {
                    playBeep();
                    onRemoveItem(idx);
                  }}
                  className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center transition-all shadow-sm active:scale-90"
                  title="Remove item"
                >
                  <Trash2 size={11} />
                </button>

                {/* Line Total at Bottom-Right */}
                <div className="absolute bottom-2.5 right-2.5 text-right flex items-baseline gap-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Total</span>
                  <Price
                    amount={item.price * item.quantity}
                    className="text-xs font-black text-foreground"
                  />
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-14 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-border/20 rounded-3xl bg-muted/10">
            <Store className="text-muted-foreground/30 mb-2" size={36} strokeWidth={1.5} />
            <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              No Items in Cart
            </p>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5 uppercase tracking-wider">
              Select products from catalog or scan barcode
            </p>
          </div>
        )}
      </div>

      {/* 3. Promo Banner & Breakdown & Primary Button */}
      <div className="p-4 border-t border-border/15 space-y-3 bg-muted/30 shrink-0">
        
        {/* Promo / Discount Card with System Theme "Change Promo" Button */}
        <div className="p-3 rounded-2xl bg-card/60 border border-border/20 flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center text-[10px] font-black shrink-0">
              %
            </div>
            <span className="text-xs font-bold text-foreground truncate">
              {discountAmount > 0 
                ? (manualDiscountType === "percent" ? `Promo Applied (${manualDiscountValue}%)` : `Discount Applied (৳${manualDiscountValue})`)
                : (couponCode ? `Coupon: ${couponCode}` : "Promo / Discount")}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowPromoModal(true)}
            className="px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 text-xs font-black uppercase tracking-wider transition-all shrink-0 active:scale-95"
          >
            Change Promo
          </button>
        </div>

        {/* Totals Table with System Theme */}
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between items-center text-muted-foreground font-bold">
            <span>Sub-Total</span>
            <Price amount={subtotal} className="font-black text-foreground" />
          </div>

          {shippingPrice > 0 && (
            <div className="flex justify-between items-center text-muted-foreground font-bold">
              <span>Delivery Fee</span>
              <span className="inline-flex items-baseline gap-0.5 text-foreground font-black">
                <span>+</span>
                <Price amount={shippingPrice} />
              </span>
            </div>
          )}

          {discountAmount > 0 && (
            <div className="flex justify-between items-center text-muted-foreground font-bold">
              <span>Discount</span>
              <span className="inline-flex items-baseline gap-0.5 text-emerald-500 font-black">
                <span>-</span>
                <Price amount={discountAmount} className="text-emerald-500" />
              </span>
            </div>
          )}

          <div className="flex justify-between items-baseline pt-2 border-t border-border/10">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Total Payment
            </span>
            <Price
              amount={grandTotal}
              className="text-xl sm:text-2xl font-black text-foreground tracking-normal"
            />
          </div>
        </div>

        {/* Payment Method Selector Card with "Change Method >" */}
        <div className="p-3 rounded-2xl bg-card/60 border border-border/20 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {paymentMethod === "Cash" && <Banknote size={16} className="text-emerald-500" />}
              {paymentMethod === "bKash" && <Smartphone size={16} className="text-rose-500" />}
              {paymentMethod === "Nagad" && <Smartphone size={16} className="text-amber-500" />}
              {paymentMethod === "Card" && <CreditCard size={16} className="text-blue-500" />}
              {paymentMethod === "Split" && <Split size={16} className="text-primary" />}

              <span className="text-xs font-black uppercase tracking-wider text-foreground">
                {paymentMethod === "Card" ? "Credit / Debit Card" : paymentMethod}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowMethodModal(!showMethodModal)}
              className="text-[11px] font-bold text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors uppercase tracking-wider"
            >
              <span>Change Method</span>
              <ChevronRight size={13} />
            </button>
          </div>

          {/* Quick Cash Tendered & Change Return */}
          {paymentMethod === "Cash" && (
            <div className="mt-3 pt-3 border-t border-border/10 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Cash Received (নগদ গ্রহণ):
                </span>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">৳</span>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    className="h-8 w-28 pl-6 text-right rounded-xl bg-background/80 border-border/30 text-xs font-black"
                  />
                </div>
              </div>

              {/* Quick Cash Buttons */}
              <div className="flex items-center gap-1">
                {["exact", 50, 100, 500, 1000, "clear"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleQuickCash(opt)}
                    className={cn(
                      "flex-1 py-1 rounded-lg text-[9px] font-black uppercase transition-all",
                      opt === "clear"
                        ? "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
                        : "bg-background/80 text-foreground hover:bg-muted border border-border/20"
                    )}
                  >
                    {opt === "exact" ? "Exact" : opt === "clear" ? "C" : `+${opt}`}
                  </button>
                ))}
              </div>

              {/* Change Return / Due Banner */}
              {parsedCash >= grandTotal && (
                <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between text-emerald-500 text-xs font-bold animate-in fade-in duration-150">
                  <span className="text-[10px] font-black uppercase tracking-wider">Change Return (ফেরত দিন):</span>
                  <Price amount={changeDue} className="text-sm font-black text-emerald-500" />
                </div>
              )}
              {parsedCash > 0 && parsedCash < grandTotal && (
                <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between text-amber-500 text-xs font-bold animate-in fade-in duration-150">
                  <span className="text-[10px] font-black uppercase tracking-wider">Customer Due (বাকি আছে):</span>
                  <Price amount={dueRemaining} className="text-sm font-black text-amber-500" />
                </div>
              )}
            </div>
          )}

          {/* Digital Payment Fields (bKash / Nagad / Card) */}
          {(paymentMethod === "bKash" || paymentMethod === "Nagad" || paymentMethod === "Card") && (
            <div className="mt-2.5 pt-2.5 border-t border-border/10 space-y-1.5">
              <Input
                type="text"
                placeholder={paymentMethod === "Card" ? "POS Slip / Card Last 4 Digits..." : `${paymentMethod} TrxID / Ref...`}
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                className="h-8 rounded-xl bg-background/80 border-border/30 text-xs font-mono font-black uppercase"
              />
            </div>
          )}
        </div>

        {/* Primary Checkout Button: System Theme Style */}
        <Button
          type="button"
          disabled={items.length === 0 || isSubmitting}
          onClick={onSubmitOrder}
          className="w-full h-12 rounded-2xl bg-foreground text-background hover:bg-primary hover:text-primary-foreground font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 shadow-xl active:scale-[0.98] border-none flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
              Processing...
            </span>
          ) : (
            <>
              <span className="flex items-center gap-1.5">
                <span>Continue</span>
                <span>(</span>
                <Price amount={grandTotal} />
                <span>)</span>
              </span>
              <ArrowRight size={15} />
            </>
          )}
        </Button>
      </div>

      {/* Payment Method Switcher Modal */}
      {showMethodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-card border border-border/20 rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-border/15">
              <h3 className="text-xs font-black uppercase tracking-wider text-foreground">Select Payment Method</h3>
              <button
                type="button"
                onClick={() => setShowMethodModal(false)}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {[
                { id: "Cash", label: "Cash (নগদ)", icon: Banknote },
                { id: "bKash", label: "bKash (বিকাশ)", icon: Smartphone, color: "text-rose-500" },
                { id: "Nagad", label: "Nagad (নগদ ডিজিটাল)", icon: Smartphone, color: "text-amber-500" },
                { id: "Card", label: "Credit / Debit Card", icon: CreditCard, color: "text-blue-500" },
                { id: "Split", label: "Split Payment (Cash + Digital)", icon: Split, color: "text-primary" }
              ].map((m) => {
                const IconComp = m.icon;
                const isCurrent = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      playBeep();
                      setPaymentMethod(m.id);
                      setShowMethodModal(false);
                    }}
                    className={cn(
                      "p-3 rounded-2xl border text-left flex items-center justify-between transition-all",
                      isCurrent
                        ? "bg-foreground text-background border-foreground font-black"
                        : "bg-background/60 border-border/20 text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <IconComp size={18} className={isCurrent ? "text-background" : m.color} />
                      <span className="text-xs font-bold">{m.label}</span>
                    </div>
                    {isCurrent && <Check size={16} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Promo & Discount Modal */}
      {showPromoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-card border border-border/20 rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-border/15">
              <h3 className="text-xs font-black uppercase tracking-wider text-foreground">Apply Promo / Discount</h3>
              <button
                type="button"
                onClick={() => setShowPromoModal(false)}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              {/* Preset Percentage Chips */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Percentage Discount (%):
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[5, 10, 15, 20].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handlePresetDiscount(pct, "percent")}
                      className={cn(
                        "py-2 rounded-xl text-xs font-black uppercase border transition-all",
                        Number(manualDiscountValue) === pct && manualDiscountType === "percent"
                          ? "bg-foreground text-background border-foreground"
                          : "bg-background/60 border-border/20 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Preset Flat Chips */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Flat Discount (৳):
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[50, 100, 200, 500].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handlePresetDiscount(amt, "flat")}
                      className={cn(
                        "py-2 rounded-xl text-xs font-black uppercase border transition-all flex items-center justify-center",
                        Number(manualDiscountValue) === amt && manualDiscountType === "flat"
                          ? "bg-foreground text-background border-foreground"
                          : "bg-background/60 border-border/20 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Price amount={amt} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Coupon input */}
              <div className="pt-2 border-t border-border/10">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-1">
                  Promo / Coupon Code:
                </label>
                <Input
                  type="text"
                  placeholder="e.g. WELCOME10"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="h-9 rounded-xl uppercase font-black tracking-widest text-xs bg-background/60"
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
                  className="flex-1 rounded-xl text-xs font-black uppercase tracking-wider text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 border-border/20"
                >
                  Clear
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowPromoModal(false)}
                  className="flex-1 rounded-xl bg-foreground text-background hover:bg-primary hover:text-primary-foreground text-xs font-black uppercase tracking-wider"
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
