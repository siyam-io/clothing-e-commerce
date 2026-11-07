"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function AdminCard({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md shadow-2xs transition-all duration-200 overflow-hidden",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function AdminCardHeader({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-5 border-b border-border/40",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function AdminCardTitle({ className, children, ...props }) {
  return (
    <h3
      className={cn(
        "text-base sm:text-lg font-semibold tracking-tight text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function AdminCardDescription({ className, children, ...props }) {
  return (
    <p
      className={cn("text-xs sm:text-sm text-muted-foreground mt-0.5", className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function AdminCardContent({ className, children, ...props }) {
  return (
    <div className={cn("p-6", className)} {...props}>
      {children}
    </div>
  );
}

export function AdminCardFooter({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 px-6 py-4 border-t border-border/40 bg-muted/20",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

