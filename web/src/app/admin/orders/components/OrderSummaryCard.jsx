"use client";

import { CreditCard, BadgePercent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/common/Price";

export default function OrderSummaryCard({
  mode = "create", // "create" or "edit"
  subtotal = 0,
  
  // Shipping (Only used in create)
  shippingRegion,
  setShippingRegion,
  customShippingPrice,
  setCustomShippingPrice,
  shippingPrice = 0,
  
  // Coupons (Only used in create)
  couponCode,
  setCouponCode,
  
  // Payment
  paymentMethod,
  setPaymentMethod,
  
  // Form hooks (Used in edit)
  register,
  
  // Actions
  onSubmit,
  isSubmitting = false,
  isDisabled = false,
  total = 0,
}) {
  const isHookForm = typeof register === "function";

  return (
    <div className="admin-table-form p-8 space-y-8 bg-foreground text-background rounded-[2.5rem] border border-border/10 shadow-2xl relative overflow-hidden transition-all duration-300">
      {/* Visual Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center gap-4 mb-2">
        <div className="w-8 h-8 rounded-xl bg-background/10 flex items-center justify-center border border-background/20">
          <CreditCard size={16} className="text-background" />
        </div>
        <h3 className="text-xs font-black uppercase tracking-[0.2em]">Order Receipt</h3>
      </div>

      <div className="space-y-4">
        {/* Subtotal */}
        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest opacity-60">
          <span>Subtotal</span>
          <Price amount={subtotal} className="font-black text-xs text-background" />
        </div>

        {/* Shipping Price (Only for Create mode) */}
        {mode === "create" && (
          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest opacity-60">
            <span>Delivery Charge</span>
            <span className="inline-flex items-baseline gap-0.5 text-xs font-black">
              <span>+</span>
              <Price amount={shippingPrice} className="text-background" />
            </span>
          </div>
        )}

        {/* Coupon Code (Only for Create mode) */}
        {mode === "create" && (
          <div className="relative group mt-2">
            <BadgePercent size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-background/40" />
            <input
              placeholder="Coupon Code"
              value={couponCode}
              onChange={(e) => setCouponCode && setCouponCode(e.target.value)}
              className="w-full bg-background/5 border border-background/10 rounded-xl h-12 pl-12 pr-4 text-[10px] font-black uppercase tracking-widest outline-none focus:border-background/30 focus:ring-1 focus:ring-background/20 placeholder:text-background/30 transition-all text-white"
            />
          </div>
        )}

        <div className="h-px bg-background/10 my-6" />

        {/* Grand Total */}
        <div className="flex justify-between items-end">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-80">Grand Total</span>
          <Price
            amount={total}
            className="text-3xl font-black leading-none text-background tracking-normal"
          />
        </div>
      </div>

      {/* Payment details & Submit button */}
      <div className="space-y-4 pt-4 border-t border-background/10">
        <div>
          <label className="text-[9px] font-black uppercase tracking-widest text-background/50 mb-2 block ml-1">
            Settlement Method
          </label>
          {isHookForm ? (
            <select
              {...register("paymentMethod")}
              className="w-full bg-background/5 border border-background/10 rounded-xl h-14 px-4 text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer text-white"
            >
              <option value="COD" className="text-foreground bg-background uppercase">Cash on Delivery</option>
              <option value="SSLCommerz" className="text-foreground bg-background uppercase">SSLCommerz (Online)</option>
              <option value="bKash" className="text-foreground bg-background uppercase">bKash (MFS)</option>
            </select>
          ) : (
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod && setPaymentMethod(e.target.value)}
              className="w-full bg-background/5 border border-background/10 rounded-xl h-14 px-4 text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer text-white"
            >
              <option value="COD" className="text-foreground bg-background uppercase">Cash on Delivery</option>
              <option value="Paid" className="text-foreground bg-background uppercase">Prepaid / Manual Sync</option>
            </select>
          )}
        </div>

        {/* Action Button */}
        {mode === "create" ? (
          <Button
            type="submit"
            disabled={isDisabled || isSubmitting}
            className="w-full h-16 bg-background text-foreground hover:bg-rose-600 hover:text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] transition-all duration-300 shadow-2xl active:scale-95 border-none mt-2"
          >
            {isSubmitting ? "Creating..." : "Create Order"}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={onSubmit}
            disabled={isDisabled || isSubmitting}
            className="w-full h-16 bg-background text-foreground hover:bg-indigo-600 hover:text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] transition-all duration-300 shadow-2xl active:scale-95 border-none mt-2"
          >
            {isSubmitting ? "Updating..." : "Save Changes"}
          </Button>
        )}
      </div>
    </div>
  );
}
