import { getImageUrl } from "@/utils/imageUtils";
import { Price } from "@/components/common/Price";

export default function OrderAssetList({ order }) {
  return (
    <div className="space-y-6">
      <h4 className="text-[11px] font-black uppercase tracking-[0.4em] flex items-center gap-4 text-accent-secondary">
         <span className="h-px w-8 bg-accent-secondary" /> Itemized Assets
      </h4>
      <div className="grid grid-cols-1 gap-4">
         {order.orderItems.map((item, idx) => (
            <div key={idx} className="group flex items-center gap-5 sm:gap-8 p-4 sm:p-6 rounded-[1.5rem] bg-accent/5 border border-border/10 hover:border-accent-secondary/30 transition-all duration-500">
               <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-2xl overflow-hidden bg-background border border-border/10 shrink-0 shadow-xl group-hover:scale-105 transition-transform duration-500">
                  <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
               </div>
               <div className="flex-1 min-w-0 space-y-2">
                  <p className="text-sm sm:text-base font-black uppercase tracking-tight line-clamp-1 group-hover:text-accent-secondary transition-colors">{item.name}</p>
                  <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                     <span className="px-3 py-1 bg-background rounded-full border border-border/50">Size: {item.size?.name || item.size || 'N/A'}</span>
                     <span className="px-3 py-1 bg-background rounded-full border border-border/50">Qty: {item.quantity}</span>
                  </div>
               </div>
               <div className="text-right shrink-0">
                  <Price
                    amount={(item.price || 0).toFixed(0)}
                    className="text-sm sm:text-lg font-black text-primary tracking-normal"
                  />
               </div>
            </div>
         ))}
      </div>
    </div>
  );
}
