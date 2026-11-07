"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";

/**
 * Standard Price & Currency Component
 * Formats money / taka amounts with an industry-standard font stack:
 * Hind Siliguri (for crisp Bengali ৳ glyph) + Inter/system-ui (for sharp tabular numbers).
 */
export const Price = memo(function Price({
  amount = 0,
  currency = "৳",
  className = "",
  symbolClassName = "",
  decimals = 0,
  lineThrough = false,
  showFree = false,
  freeText = "Free",
}) {
  const num = Number(amount);
  if (isNaN(num)) return null;

  if (showFree && num === 0) {
    return (
      <span className={cn("font-price font-semibold text-emerald-600", className)}>
        {freeText}
      </span>
    );
  }

  const formatted = num.toLocaleString("en-BD", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span
      className={cn(
        "font-price inline-flex items-baseline tabular-nums tracking-normal not-italic",
        lineThrough && "line-through text-muted-foreground opacity-60 font-normal",
        className
      )}
    >
      <span className={cn("taka-symbol font-semibold select-none", symbolClassName)}>
        {currency}
      </span>
      <span>{formatted}</span>
    </span>
  );
});

export const formatPrice = (amount, decimals = 0) => {
  const num = Number(amount || 0);
  return `৳${num.toLocaleString("en-BD", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
};

export default Price;

