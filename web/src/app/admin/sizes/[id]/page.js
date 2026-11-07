"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { useEffect, useState } from "react";
import { useSizes } from "@/app/admin/sizes/lib/useSizes";
import { useAdminCategories } from "@/app/admin/categories/lib/useAdminCategories";
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
import { swalToast, swalError } from "@/utils/swal";
import AdminPageContainer from "@/app/admin/_components/AdminPageContainer";
import AdminPageHeader, { AdminBackLink } from "@/app/admin/_components/AdminPageHeader";
import { AdminCard, AdminCardHeader, AdminCardTitle, AdminCardDescription, AdminCardContent } from "@/app/admin/_components/AdminCard";
import Loader from "@/components/common/Loader";

export default function SizeForm() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetCategory = searchParams.get("category");

  const isEdit = id !== "new";

  const { sizes, createSize, updateSize } = useSizes();
  const { categories, isLoading: categoriesLoading } = useAdminCategories();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      category: presetCategory || "",
      name: "",
      description: ""
    }
  });

  const [loading, setLoading] = useState(true);
  const selectedCategory = watch("category");

  useEffect(() => {
    if (isEdit && sizes?.length > 0) {
      const size = sizes.find((s) => s._id === id);
      if (size) {
        reset({
          name: size.name,
          description: size.description || "",
          category: size.category?._id || size.category,
        });
        setLoading(false);
      }
    } else if (!isEdit) {
      if (!categoriesLoading) {
        setLoading(false);
      }
    }
  }, [isEdit, id, sizes, categoriesLoading, reset]);

  useEffect(() => {
    if (!isEdit && presetCategory && !selectedCategory) {
      setValue("category", presetCategory);
    }
  }, [isEdit, presetCategory, selectedCategory, setValue]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (isEdit) {
        await updateSize({ id, ...data });
        swalToast("Size updated successfully", "success");
      } else {
        await createSize(data);
        swalToast("Size created successfully", "success");
      }
      setTimeout(() => router.push("/admin/categories"), 1200);
    } catch (err) {
      swalError("Save Failed", err.response?.data?.message || "Could not save size.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page-container flex items-center justify-center min-h-[40vh]">
        <Loader />
      </div>
    );
  }

  return (
    <AdminPageContainer maxWidth="max-w-2xl">
      <AdminBackLink href="/admin/categories" label="Back to Categories" />
      <AdminPageHeader
        title={isEdit ? "Edit Size" : "New Size"}
        description={isEdit ? "Update size label and category binding" : "Add a new size variation to a category"}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <AdminCard>
          <AdminCardHeader>
            <AdminCardTitle>Size Configuration</AdminCardTitle>
            <AdminCardDescription>Define size label (e.g. S, M, L, XL, 32, 34) and category assignment</AdminCardDescription>
          </AdminCardHeader>

          <AdminCardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                Category <span className="text-rose-500">*</span>
              </Label>
              <Controller
                name="category"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <SelectTrigger className="h-10 bg-background/80 border-border/60 rounded-xl text-xs font-medium">
                      <SelectValue placeholder="Select target category" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border rounded-xl">
                      {categories?.map((cat) => (
                        <SelectItem key={cat._id} value={cat._id} className="text-xs">
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                Size Label <span className="text-rose-500">*</span>
              </Label>
              <Input
                {...register("name", { required: true })}
                placeholder="e.g. M, L, XL, 32/34"
                className="h-10 rounded-xl bg-background/80 border-border/60 text-sm font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Fit / Measurements Note</Label>
              <Textarea
                {...register("description")}
                rows={3}
                placeholder="e.g. Chest: 40-42 inches, Length: 28 inches"
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
              ) : (
                isEdit ? "Update Size" : "Create Size"
              )}
            </Button>
          </div>
        </AdminCard>
      </form>
    </AdminPageContainer>
  );
}
