"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import AdminPageContainer from "@/app/admin/_components/AdminPageContainer";
import AdminPageHeader, { AdminBackLink } from "@/app/admin/_components/AdminPageHeader";
import {
  AdminCard,
  AdminCardHeader,
  AdminCardTitle,
  AdminCardDescription,
  AdminCardContent,
} from "@/app/admin/_components/AdminCard";

export default function SizeForm({
  initialData = null,
  categories = [],
  isEdit = false,
  presetCategory = "",
  onSubmit,
  isSubmitting = false,
}) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      category: presetCategory || "",
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || "",
        description: initialData.description || "",
        category: initialData.category?._id || initialData.category || presetCategory || "",
      });
    } else if (presetCategory) {
      setValue("category", presetCategory);
    }
  }, [initialData, presetCategory, reset, setValue]);

  return (
    <AdminPageContainer maxWidth="max-w-2xl">
      <AdminBackLink href="/admin/categories" label="Back to Taxonomy" />
      <AdminPageHeader
        title={isEdit ? "Edit Size Matrix" : "Create Size Matrix"}
        description={
          isEdit
            ? `Modify size specifications for ${initialData?.name || "size"}`
            : "Define a product sizing measurement for catalog products"
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <AdminCard>
          <AdminCardHeader>
            <AdminCardTitle>Size Specifications</AdminCardTitle>
            <AdminCardDescription>
              Assign the size to a category and define its naming
            </AdminCardDescription>
          </AdminCardHeader>

          <AdminCardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                Parent Category <span className="text-rose-500">*</span>
              </Label>
              <Controller
                name="category"
                control={control}
                rules={{ required: "Category is required" }}
                render={({ field }) => (
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <SelectTrigger className="h-10 bg-background/80 border-border/60 rounded-xl text-xs font-medium">
                      <SelectValue placeholder="Select target category" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border rounded-xl">
                      {categories.map((cat) => (
                        <SelectItem key={cat._id} value={cat._id} className="text-xs font-medium">
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category && (
                <p className="text-xs text-rose-500">{errors.category.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                Size Name / Label <span className="text-rose-500">*</span>
              </Label>
              <Input
                {...register("name", { required: "Size name is required" })}
                placeholder="e.g. M, XL, 32, 42..."
                className="h-10 rounded-xl bg-background/80 border-border/60 text-sm font-semibold"
              />
              {errors.name && <p className="text-xs text-rose-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                Description / Measurements
              </Label>
              <Textarea
                {...register("description")}
                rows={3}
                placeholder="Optional dimensions (e.g. Chest: 38-40 inches, Length: 28 inches)..."
                className="bg-background/80 border-border/60 rounded-xl px-3.5 py-2.5 text-sm resize-none"
              />
            </div>
          </AdminCardContent>

          <div className="flex items-center justify-end gap-3 p-5 border-t border-border/40 bg-muted/20">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/categories")}
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
              ) : isEdit ? (
                "Update Size"
              ) : (
                "Create Size"
              )}
            </Button>
          </div>
        </AdminCard>
      </form>
    </AdminPageContainer>
  );
}

