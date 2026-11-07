"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Zap } from "lucide-react";

export default function FlashSaleDetailsForm({ register, watchStartImmediately, errors, watch, setValue }) {
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-foreground">Sale Campaign Name *</Label>
        <Input 
          {...register("name", { required: true })}
          placeholder="e.g. Weekend Flash Sale"
          className="h-10 rounded-xl bg-background/80 border-border/60 text-sm font-medium"
        />
        {errors?.name && (
          <p className="text-xs text-rose-500">Sale name is required</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-foreground">Campaign Description</Label>
        <Textarea 
          rows={3}
          {...register("description")}
          placeholder="Short highlight message displayed on the flash sale banner..."
          className="bg-background/80 border-border/60 rounded-xl px-3.5 py-2.5 text-xs resize-none"
        />
      </div>

      <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-1.5">
        <Label className="text-xs font-medium text-rose-600 dark:text-rose-400">Discount Percentage (%) *</Label>
        <div className="flex items-center gap-2">
          <Input 
            type="number"
            min={1}
            max={100}
            placeholder="25"
            {...register("discount", { required: true, min: 1, max: 100, valueAsNumber: true })}
            className="h-10 rounded-xl bg-background border-rose-500/30 text-lg font-bold text-rose-600 dark:text-rose-400 tabular-nums w-32"
          />
          <span className="text-xs text-muted-foreground">% off regular product price</span>
        </div>
        {errors?.discount && (
          <p className="text-xs text-rose-500">Discount must be between 1% and 100%</p>
        )}
      </div>

      <div className="pt-2 space-y-3">
        <label className="flex items-center gap-3 p-3.5 rounded-xl border border-border/60 bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors">
          <input
            type="checkbox"
            {...register("startImmediately")}
            className="size-4 rounded border-border/60 text-primary cursor-pointer"
          />
          <div>
            <p className="text-xs font-medium text-foreground">Start Immediately</p>
            <p className="text-[11px] text-muted-foreground">Activate the sale countdown right after saving</p>
          </div>
        </label>

        {!watchStartImmediately && (
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">Start Date & Time</Label>
            <Input 
              type="datetime-local"
              {...register("startDate")}
              className="h-10 rounded-xl bg-background/80 border-border/60 text-xs font-medium"
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-foreground">End Date & Time *</Label>
          <Input 
            type="datetime-local"
            {...register("endDate", { required: true })}
            className="h-10 rounded-xl bg-background/80 border-border/60 text-xs font-medium"
          />
          {errors?.endDate && (
            <p className="text-xs text-rose-500">End date is required</p>
          )}
        </div>

        <label className="flex items-center gap-3 p-3.5 rounded-xl border border-border/60 bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors">
          <input
            type="checkbox"
            {...register("isActive")}
            className="size-4 rounded border-border/60 text-primary cursor-pointer"
          />
          <div>
            <p className="text-xs font-medium text-foreground">Public Campaign Active</p>
            <p className="text-[11px] text-muted-foreground">Show this flash sale countdown and pricing on storefront</p>
          </div>
        </label>
      </div>
    </div>
  );
}
