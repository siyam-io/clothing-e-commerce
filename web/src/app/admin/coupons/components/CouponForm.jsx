"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AdminPageContainer from "@/app/admin/_components/AdminPageContainer";
import AdminPageHeader, { AdminBackLink } from "@/app/admin/_components/AdminPageHeader";
import {
  AdminCard,
  AdminCardHeader,
  AdminCardTitle,
  AdminCardDescription,
  AdminCardContent,
} from "@/app/admin/_components/AdminCard";
import { Loader2 } from "lucide-react";

export default function CouponForm({
  initialData = null,
  onSubmit,
  isSubmitting = false,
  title = "Coupon",
  description = "Configure discount rules and usage limits",
  submitLabel = "Save Coupon",
}) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      code: "",
      discountType: "fixed",
      discountValue: "",
      minPurchase: 0,
      usageLimit: 100,
      endDate: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        code: initialData.code || "",
        discountType: initialData.discountType || "fixed",
        discountValue: initialData.discountValue ?? "",
        minPurchase: initialData.minPurchase ?? 0,
        usageLimit: initialData.usageLimit ?? 100,
        endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().split("T")[0] : "",
        isActive: initialData.isActive !== false,
      });
    }
  }, [initialData, reset]);

  return (
    <AdminPageContainer maxWidth="max-w-3xl">
      <AdminBackLink href="/admin/coupons" label="Back to Coupons" />
      <AdminPageHeader title={title} description={description} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <AdminCard>
          <AdminCardHeader>
            <AdminCardTitle>Coupon Rules</AdminCardTitle>
            <AdminCardDescription>
              Define promo code name, discount calculation, and limits
            </AdminCardDescription>
          </AdminCardHeader>

          <AdminCardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">
                  Coupon Code <span className="text-rose-500">*</span>
                </Label>
                <Input
                  {...register("code", { required: "Coupon code is required" })}
                  placeholder="e.g. SUMMER25"
                  className="h-10 rounded-xl bg-background/80 border-border/60 text-sm font-mono font-semibold uppercase"
                />
                {errors.code && <p className="text-xs text-rose-500">{errors.code.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">
                  Discount Type <span className="text-rose-500">*</span>
                </Label>
                <Controller
                  name="discountType"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select value={field.value || "fixed"} onValueChange={field.onChange}>
                      <SelectTrigger className="h-10 bg-background/80 border-border/60 rounded-xl text-xs font-medium">
                        <SelectValue placeholder="Select discount type" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border rounded-xl">
                        <SelectItem value="fixed" className="text-xs">
                          Fixed Amount (৳ Discount)
                        </SelectItem>
                        <SelectItem value="percentage" className="text-xs">
                          Percentage (% Off)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">
                  Discount Value <span className="text-rose-500">*</span>
                </Label>
                <Input
                  type="number"
                  step="any"
                  placeholder="0"
                  {...register("discountValue", {
                    required: "Discount value is required",
                    min: { value: 1, message: "Value must be > 0" },
                    valueAsNumber: true,
                  })}
                  className="h-10 rounded-xl bg-background/80 border-border/60 text-sm font-semibold tabular-nums"
                />
                {errors.discountValue && (
                  <p className="text-xs text-rose-500">{errors.discountValue.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Minimum Spend (৳)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  {...register("minPurchase", { valueAsNumber: true })}
                  className="h-10 rounded-xl bg-background/80 border-border/60 text-sm tabular-nums"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Usage Limit</Label>
                <Input
                  type="number"
                  placeholder="100"
                  {...register("usageLimit", { valueAsNumber: true })}
                  className="h-10 rounded-xl bg-background/80 border-border/60 text-sm tabular-nums"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Expiry Date</Label>
              <Input
                type="date"
                {...register("endDate")}
                className="h-10 rounded-xl bg-background/80 border-border/60 text-xs font-medium"
              />
            </div>

            <div className="pt-2">
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <label className="flex items-center gap-3 p-3.5 rounded-xl border border-border/60 bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors">
                    <Checkbox
                      id="isActive"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="rounded-md"
                    />
                    <div>
                      <p className="text-xs font-medium text-foreground">Enable Coupon</p>
                      <p className="text-[11px] text-muted-foreground">
                        Customers can apply this coupon code at checkout
                      </p>
                    </div>
                  </label>
                )}
              />
            </div>
          </AdminCardContent>

          <div className="flex items-center justify-end gap-3 p-5 border-t border-border/40 bg-muted/20">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/coupons")}
              disabled={isSubmitting}
              className="h-10 px-5 rounded-xl text-xs font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 px-6 rounded-xl text-xs font-medium gap-2 shadow-xs cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                submitLabel
              )}
            </Button>
          </div>
        </AdminCard>
      </form>
    </AdminPageContainer>
  );
}

