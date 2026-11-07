import Image from "next/image";
import { motion } from "framer-motion";
import { ImageOff, Edit2, Trash2, Minus, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getImageUrl } from "@/utils/imageUtils";
import { Price } from "@/components/common/Price";

export default function CartItemCard({
  item,
  t,
  isDirectBuy,
  onEditSize,
  onRemove,
  onQuantityChange
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ 
        type: "spring", 
        damping: 25, 
        stiffness: 300,
        layout: { duration: 0.4 }
      }}
    >
      <Card className="group border-none glass-card overflow-hidden transition-all duration-500 rounded-2xl sm:rounded-[2rem]">
        <CardContent className="p-4 sm:p-6 flex gap-4 sm:gap-8">
          <div className="relative w-20 sm:w-28 aspect-[3/4] rounded-xl sm:rounded-2xl overflow-hidden shrink-0 shadow-lg sm:shadow-xl">
            {item.product.images && item.product.images.length > 0 ? (
              <Image
                src={getImageUrl(item.product.images[0], 300, 100)}
                alt={item.product.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-accent/10 text-muted-foreground/30">
                <ImageOff size={24} strokeWidth={1.5} />
              </div>
            )}
          </div>
          <div className="flex-1 flex flex-col justify-between py-1">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-1">
                <p className="text-[7px] sm:text-[8px] font-black text-accent-secondary uppercase tracking-[0.2em] sm:tracking-[0.3em]">
                  {item.product.category?.name || "Premium Drop"}
                </p>
                <h3 className="text-xs sm:text-lg md:text-xl font-black uppercase tracking-tighter italic text-gradient line-clamp-2">
                  {item.product.name}
                </h3>
                <Badge variant="outline" className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest border-border/20 rounded-full px-2 sm:px-2.5 h-5">
                  {t.size}: {item.size?.name || "Standard"}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5">
                {!isDirectBuy && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onEditSize(item);
                    }}
                    className="text-muted-foreground hover:text-accent-secondary transition-colors rounded-lg sm:rounded-xl h-8 w-8 sm:h-9 sm:w-9 hover:bg-accent-secondary/10 shrink-0"
                  >
                    <Edit2 size={14} className="sm:w-[15px] sm:h-[15px]" />
                  </Button>
                )}
                {!isDirectBuy && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(item.product._id, item.size._id)}
                    className="text-muted-foreground hover:text-destructive transition-colors rounded-lg sm:rounded-xl h-8 w-8 sm:h-9 sm:w-9 hover:bg-destructive/10 shrink-0"
                  >
                    <Trash2 size={16} className="sm:w-[17px] sm:h-[17px]" />
                  </Button>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4">
              <div className="flex items-center gap-2 sm:gap-3 glass p-0.5 sm:p-1 rounded-lg sm:rounded-xl border-none shadow-inner">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onQuantityChange(item.product._id, item.size._id, item.quantity, -1)}
                  className="h-7 w-7 sm:h-9 sm:w-9 rounded-md sm:rounded-xl hover:bg-accent-secondary hover:text-white transition-all disabled:opacity-30"
                >
                  <Minus size={12} className="sm:w-[13px] sm:h-[13px]" />
                </Button>
                <span className="font-black text-xs sm:text-sm w-4 sm:w-5 text-center tabular-nums">
                  {item.quantity}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onQuantityChange(item.product._id, item.size._id, item.quantity, 1)}
                  className="h-7 w-7 sm:h-9 sm:w-9 rounded-md sm:rounded-xl hover:bg-accent-secondary hover:text-white transition-all disabled:opacity-30"
                >
                  <Plus size={12} className="sm:w-[13px] sm:h-[13px]" />
                </Button>
              </div>
              <Price
                amount={(item.discountedPrice * item.quantity).toFixed(0)}
                className="text-lg sm:text-2xl font-black text-foreground"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
