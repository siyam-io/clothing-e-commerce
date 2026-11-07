"use client";

import { cn } from "@/lib/utils";

export function AdminPageContainer({
  children,
  className,
  maxWidth = "max-w-[1600px]",
  noPadding = false,
  ...props
}) {
  return (
    <div
      className={cn(
        "w-full mx-auto space-y-6 transition-all duration-200",
        maxWidth,
        !noPadding && "p-4 sm:p-6 md:p-8",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default AdminPageContainer;
