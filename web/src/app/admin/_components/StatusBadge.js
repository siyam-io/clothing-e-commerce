"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_MAP = {
  // Positive / Successful
  delivered: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  paid: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  completed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  visible: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  "in stock": "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  published: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",

  // In-Progress / Informational
  shipped: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  processing: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  synced: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  confirmed: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",

  // Pending / Cautionary
  pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  unpaid: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  "low stock": "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  draft: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",

  // Danger / Negative
  cancelled: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
  failed: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
  inactive: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
  hidden: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
  "out of stock": "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
  refunded: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
};

export default function StatusBadge({ value, label, className }) {
  if (!value && !label) return null;

  const display = label || value;
  const normalizedValue = String(value || label).toLowerCase().trim();
  const colorClass = STATUS_MAP[normalizedValue] || "bg-muted text-muted-foreground border-border/60";

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-medium px-2.5 py-0.5 rounded-full border shadow-2xs capitalize inline-flex items-center gap-1.5",
        colorClass,
        className
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-80" />
      {display}
    </Badge>
  );
}
