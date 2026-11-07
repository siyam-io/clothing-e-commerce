import { Price } from "@/components/common/Price";

export default function OrderFinancialBreakdown({ order }) {
  return (
    <div className="p-8 sm:p-12 rounded-[2.5rem] bg-foreground text-background space-y-4 shadow-2xl relative overflow-hidden group">
       <div className="absolute top-0 right-0 w-32 h-32 bg-accent-secondary/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-accent-secondary/20 transition-colors duration-1000" />
       
       <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest opacity-60">
          <span>Artifact Subtotal</span>
          <Price amount={(order.itemsPrice || 0).toFixed(0)} className="text-background" />
       </div>

       {order.discountAmount > 0 && (
         <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-emerald-400">
            <span>Voucher Discount</span>
            <span className="inline-flex items-baseline gap-0.5">
              <span>-</span>
              <Price amount={(order.discountAmount || 0).toFixed(0)} className="text-emerald-400" />
            </span>
         </div>
       )}

       <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest opacity-60">
          <span>Logistics Assessment (Shipping)</span>
          <Price amount={(order.shippingPrice || 0).toFixed(0)} className="text-background" />
       </div>

       {order.taxPrice > 0 && (
         <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest opacity-60">
            <span>Government Taxation</span>
            <Price amount={(order.taxPrice || 0).toFixed(0)} className="text-background" />
         </div>
       )}

       <div className="h-px bg-background/20 my-4" />
       <div className="flex justify-between items-end">
          <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-secondary">Settlement Total</p>
              <p className="text-xs font-bold opacity-60 italic uppercase tracking-tighter">Verified Transaction</p>
          </div>
          <Price
            amount={(order.totalPrice || 0).toFixed(0)}
            className="text-3xl sm:text-5xl font-black text-accent-secondary tracking-normal"
          />
       </div>
    </div>
  );
}
