import { motion } from "framer-motion";
import { getImageUrl } from "@/utils/imageUtils";
import { Badge } from "@/components/ui/badge";
import { Calendar, Tag, CreditCard, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Price } from "@/components/common/Price";

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function ProfileOrderCard({ order, onOpenDetails }) {
  return (
    <motion.div
      variants={itemVariants}
      className="group relative bg-background border border-border/50 rounded-[2.5rem] overflow-hidden hover:border-accent-secondary/30 transition-all duration-700 hover:shadow-2xl hover:shadow-accent-secondary/5"
    >
      <div className="p-6 md:p-10 flex flex-col lg:flex-row gap-10">
         {/* Order Identity */}
         <div className="lg:w-1/4 space-y-6">
            <div className="space-y-1">
               <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">Order Sequence</p>
               <p className="font-mono text-sm font-bold text-primary">#{order._id.slice(-8).toUpperCase()}</p>
            </div>
            
            <div className="flex items-center gap-3">
               <Calendar size={14} className="text-accent-secondary" />
               <span className="text-xs font-bold">{new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
            </div>

            <Badge className={cn(
              "px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border-none shadow-lg",
              order.orderStatus === "Delivered" ? "bg-emerald-500 text-white" : 
              order.orderStatus === "Cancelled" ? "bg-rose-500 text-white" : "bg-amber-500 text-white"
            )}>
              {order.orderStatus}
            </Badge>
         </div>

         {/* Order Content */}
         <div className="flex-1 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
               {order.orderItems.map((product, idx) => (
                 <div key={idx} className="flex gap-5 group/item">
                    <div className="w-20 h-24 rounded-2xl overflow-hidden bg-accent/20 border border-border/10 shrink-0 shadow-lg group-hover/item:scale-105 transition-transform duration-500">
                       <img 
                         src={getImageUrl(product.image)} 
                         alt={product.name} 
                         className="w-full h-full object-cover"
                       />
                    </div>
                    <div className="flex flex-col justify-center gap-1">
                       <h4 className="text-sm font-black uppercase tracking-tight line-clamp-1 group-hover/item:text-accent-secondary transition-colors">{product.name}</h4>
                       <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          <span>Size: {product.size?.name || product.size || 'N/A'}</span>
                          <span className="w-1 h-1 rounded-full bg-border" />
                          <span>Qty: {product.quantity}</span>
                       </div>
                       <Price
                          amount={(product.price || 0).toFixed(0)}
                          className="text-xs font-black text-primary"
                       />
                    </div>
                 </div>
               ))}
            </div>

            <div className="h-px w-full bg-border/10" />

            <div className="flex flex-wrap items-center justify-between gap-6">
               <div className="flex items-center gap-8">
                  <div className="space-y-1">
                     <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                       <CreditCard size={10} /> Settlement
                     </p>
                     <p className="text-xs font-bold uppercase">{order.paymentMethod} <span className="text-[10px] text-muted-foreground/60">({order.paymentResult?.status || 'Unpaid'})</span></p>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                       <Tag size={10} /> Total Value
                     </p>
                     <Price
                       amount={(order.totalPrice || 0).toFixed(0)}
                       className="text-lg font-black text-accent-secondary tracking-normal"
                     />
                  </div>
               </div>

               <button 
                onClick={() => onOpenDetails(order._id)}
                className="shrink-0 flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.2em] px-8 py-4 rounded-full border border-border hover:bg-foreground hover:text-background transition-all group/btn shadow-xl shadow-foreground/5"
               >
                Details Report
                <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
               </button>
            </div>
         </div>
      </div>
    </motion.div>
  );
}
