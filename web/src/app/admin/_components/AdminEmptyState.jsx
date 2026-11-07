"use client";

import Link from "next/link";
import { FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AdminEmptyState({
  icon: Icon = FolderOpen,
  title = "No data found",
  description = "There are no records to display at this time.",
  actionLabel,
  onAction,
  actionHref,
  className,
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-border/80 bg-muted/10 my-4",
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground mb-4 shadow-2xs">
        <Icon className="h-7 w-7 stroke-[1.75]" />
      </div>
      <h4 className="text-base font-semibold text-foreground tracking-tight">{title}</h4>
      <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-5">
        {description}
      </p>
      {actionLabel && (actionHref || onAction) && (
        actionHref ? (
          <Button asChild size="sm" className="rounded-xl font-medium">
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        ) : (
          <Button size="sm" onClick={onAction} className="rounded-xl font-medium">
            {actionLabel}
          </Button>
        )
      )}
    </div>
  );
}

