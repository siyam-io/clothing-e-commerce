"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";

export function AdminDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Item",
  description = "Are you sure you want to delete this item? This action cannot be undone.",
  itemName,
  isLoading = false,
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent className="sm:max-w-[425px] rounded-2xl border-border/80">
        <DialogHeader className="gap-2">
          <div className="flex size-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="size-5" />
          </div>
          <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {description}
            {itemName && (
              <span className="block mt-2 font-medium text-foreground bg-muted/60 p-2 rounded-lg text-xs break-all">
                {itemName}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-row justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-xl h-10 px-4 text-xs font-medium"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
            className="rounded-xl h-10 px-4 text-xs font-medium gap-1.5"
          >
            {isLoading && <Loader2 className="size-3.5 animate-spin" />}
            {isLoading ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AdminDeleteModal;
