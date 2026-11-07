import { CreditCard, Wallet, Truck, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Loader from "@/components/common/Loader";
import SummaryRow from "@/app/cart/components/SummaryRow";
import PaymentMethodItem from "@/app/cart/components/PaymentMethodItem";
import { Price } from "@/components/common/Price";

export default function CartFinancialSummary({
  t,
  subtotal,
  appliedCoupon,
  shippingCharge,
  finalTotal,
  couponCode,
  setCouponCode,
  handleApplyCoupon,
  paymentMethod,
  setPaymentMethod,
  paymentOptions,
  handlePlaceOrder,
  isProcessing
}) {
  return (
    <div className="lg:col-span-5 p-4 sm:p-12 lg:p-16 xl:p-20 bg-accent/5">
      <div className="sticky top-24 sm:top-32 space-y-8 sm:space-y-10">
        <div className="space-y-1">
          <h2 className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.4em] sm:tracking-[0.5em] text-accent-secondary">
            03. {t.summary || "Summary"}
          </h2>
          <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest">{t.finalAudit || "Final Audit"}</p>
        </div>

        <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden glass-card">
          <CardContent className="p-8 sm:p-12 space-y-6">
            <div className="space-y-4 sm:space-y-5">
              <SummaryRow label={t.subtotal || "Subtotal"} value={<Price amount={subtotal} />} />
              
              {appliedCoupon && (
                <SummaryRow 
                  label={`${t.voucher || "Voucher"} (${appliedCoupon.coupon?.code})`} 
                  value={
                    <span className="inline-flex items-baseline gap-0.5">
                      <span>-</span>
                      <Price amount={appliedCoupon.discountAmount} />
                    </span>
                  } 
                  highlight
                />
              )}

              <SummaryRow label={t.transitFee || "Transit Fee"} value={<Price amount={shippingCharge} showFree />} />
            </div>

            <Separator className="bg-border/20" />

            <div className="flex flex-col gap-1">
              <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.4em] text-accent-secondary">
                {t.totalInvestment || "Total Investment"}
              </span>
              <div className="flex items-baseline gap-2">
                <Price
                  amount={finalTotal.toFixed(0)}
                  className="text-3xl sm:text-5xl md:text-6xl font-black text-gradient leading-none tracking-normal"
                />
                <span className="text-[8px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest">BDT</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Voucher Area */}
        <div className="flex gap-2 p-1.5 glass rounded-2xl sm:rounded-[1.8rem] shadow-xl border-none">
          <Input
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            className="flex-1 bg-transparent border-none px-4 sm:px-6 text-[10px] sm:text-[11px] font-black uppercase tracking-widest focus-visible:ring-0 placeholder:text-muted-foreground/30 h-12 sm:h-14"
            placeholder="PROMO CODE"
          />
          <Button
            onClick={handleApplyCoupon}
            className="bg-primary text-primary-foreground h-12 sm:h-14 px-6 sm:px-8 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest hover:bg-accent-secondary transition-all"
          >
            {t.syncCode || "Apply"}
          </Button>
        </div>

        {/* Payment Method Selector */}
        <div className="space-y-2 sm:space-y-3">
            <Label className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] ml-2 text-muted-foreground">Select Payment Method</Label>
            <RadioGroup 
              value={paymentMethod} 
              onValueChange={setPaymentMethod}
              className="grid gap-2"
            >
              {paymentOptions.ssl && (
                <PaymentMethodItem 
                  id="ssl" 
                  title="Online Payment" 
                  icon={<CreditCard size={16} />} 
                  active={paymentMethod === "ssl"} 
                />
              )}
              {paymentOptions.bkash && (
                <PaymentMethodItem 
                  id="bkash" 
                  title="bKash Payment" 
                  icon={<Wallet size={16} />} 
                  active={paymentMethod === "bkash"} 
                />
              )}
              {paymentOptions.cod && (
                <PaymentMethodItem 
                  id="cod" 
                  title="Cash on Delivery (COD)" 
                  icon={<Truck size={16} />} 
                  active={paymentMethod === "cod"} 
                />
              )}
            </RadioGroup>
        </div>

        {/* Authorize Button */}
        <Button
          onClick={handlePlaceOrder}
          disabled={isProcessing}
          className="w-full h-16 sm:h-20 rounded-[1.5rem] sm:rounded-[2.5rem] bg-foreground text-background font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-[10px] sm:text-xs shadow-2xl hover:bg-accent-secondary hover:text-white hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 group"
        >
          {isProcessing ? (
            <Loader size="small" />
          ) : (
            <>
              <ShieldCheck size={18} className="mr-2 sm:mr-3 sm:w-5 sm:h-5 group-hover:animate-pulse" /> {t.authorizeOrder || "Place Order"}
            </>
          )}
        </Button>

      </div>
    </div>
  );
}
