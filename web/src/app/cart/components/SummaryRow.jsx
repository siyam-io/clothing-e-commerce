import { Ticket } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SummaryRow({ label, value, highlight }) {
  return (
    <div className={cn(
      "flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em]",
      highlight ? "text-emerald-500" : "text-muted-foreground"
    )}>
      <span className="flex items-center gap-2">
        {highlight && <Ticket size={12} />} {label}
      </span>
      <span className={cn("font-price tabular-nums normal-case tracking-normal", !highlight && "text-foreground")}>{value}</span>
    </div>
  );
}
