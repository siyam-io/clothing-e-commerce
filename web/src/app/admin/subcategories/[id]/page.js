"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { useEffect, useState } from "react";
import { useSubcategories } from "@/app/admin/subcategories/lib/useSubcategories";
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
import { Upload, ImageIcon, Loader2 } from "lucide-react";
import { swalToast, swalError } from "@/utils/swal";
import { getImageUrl } from "@/utils/imageUtils";
import AdminPageContainer from "@/app/admin/_components/AdminPageContainer";
import AdminPageHeader, { AdminBackLink } from "@/app/admin/_components/AdminPageHeader";
import { AdminCard, AdminCardHeader, AdminCardTitle, AdminCardDescription, AdminCardContent } from "@/app/admin/_components/AdminCard";
import Loader from "@/components/common/Loader";

export default function SubcategoryForm() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetCategory = searchParams.get("category");

  const isEdit = id !== "new";

  const { subcategories, createSubcategory, updateSubcategory } = useSubcategories();
  const { categories, isLoading: categoriesLoading } = useAdminCategories();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

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
      slug: "",
      description: ""
    }
  });

  const [loading, setLoading] = useState(true);
  const watchedName = watch("name");

  // Auto-generate slug
  useEffect(() => {
    if (!isEdit && watchedName) {
      const slug = watchedName
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setValue("slug", slug);
    }
  }, [isEdit, watchedName, setValue]);

  useEffect(() => {
    if (isEdit && subcategories?.length > 0) {
      const sub = subcategories.find((s) => s._id === id);
      if (sub) {
        reset({
          name: sub.name,
          slug: sub.slug,
          category: sub.category?._id || sub.category,
          description: sub.description || ""
        });
        if (sub.image) setImagePreview(getImageUrl(sub.image));
        setLoading(false);
      }
    } else if (!isEdit) {
      if (!categoriesLoading) {
        setLoading(false);
      }
    }
  }, [isEdit, id, subcategories, categoriesLoading, reset]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("name", data.name.trim());
    formData.append("slug", data.slug.trim());
    formData.append("category", data.category);
    if (data.description) formData.append("description", data.description);

    if (selectedFile) {
      formData.append("image", selectedFile);
    }

    try {
      if (isEdit) {
        await updateSubcategory.mutateAsync({ id, data: formData });
        swalToast("Subcategory updated successfully", "success");
      } else {
        await createSubcategory.mutateAsync(formData);
        swalToast("Subcategory created successfully", "success");
      }
      setTimeout(() => router.push("/admin/subcategories"), 1200);
    } catch (err) {
      swalError("Save Failed", err.response?.data?.message || "Could not save subcategory.");
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
    <AdminPageContainer maxWidth="max-w-3xl">
      <AdminBackLink href="/admin/subcategories" label="Back to Subcategories" />
      <AdminPageHeader
        title={isEdit ? "Edit Subcategory" : "New Subcategory"}
        description={isEdit ? "Update subcategory name, parent association, and image" : "Create a new subcategory under an existing parent category"}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <AdminCard>
          <AdminCardHeader>
            <AdminCardTitle>Subcategory Information</AdminCardTitle>
            <AdminCardDescription>Assign parent category, define name, and assign URL slug</AdminCardDescription>
          </AdminCardHeader>

          <AdminCardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                Parent Category <span className="text-rose-500">*</span>
              </Label>
              <Controller
                name="category"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <SelectTrigger className="h-10 bg-background/80 border-border/60 rounded-xl text-xs font-medium">
                      <SelectValue placeholder="Select parent category" />
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">
                  Subcategory Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  {...register("name", { required: true })}
                  placeholder="e.g. Graphic Tees"
                  className="h-10 rounded-xl bg-background/80 border-border/60 text-sm font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">
                  URL Slug <span className="text-rose-500">*</span>
                </Label>
                <Input
                  {...register("slug", { required: true, pattern: /^[a-z0-9-]+$/ })}
                  placeholder="e.g. graphic-tees"
                  className="h-10 rounded-xl bg-background/80 border-border/60 text-sm font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Description</Label>
              <Textarea
                {...register("description")}
                rows={3}
                placeholder="Optional description for store browsing and SEO..."
                className="bg-background/80 border-border/60 rounded-xl px-3.5 py-2.5 text-sm resize-none"
              />
            </div>

            <div className="space-y-2 pt-2">
              <Label className="text-xs font-medium text-foreground">Subcategory Image</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <label className="h-44 rounded-xl border-2 border-dashed border-border/80 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/40 transition-colors group p-4 text-center">
                  <Upload className="size-6 text-muted-foreground group-hover:text-foreground transition-colors mb-2" />
                  <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">Click to upload image</span>
                  <span className="text-[11px] text-muted-foreground/70 mt-1">PNG, JPG, or WEBP up to 5MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>

                <div className="h-44 rounded-xl bg-muted/40 border border-border/60 overflow-hidden flex items-center justify-center relative">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="size-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-muted-foreground/60">
                      <ImageIcon className="size-8 stroke-[1.5]" />
                      <span className="text-xs">No image selected</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </AdminCardContent>

          <div className="flex items-center justify-end gap-3 p-5 border-t border-border/40 bg-muted/20">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/subcategories")}
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
                isEdit ? "Update Subcategory" : "Create Subcategory"
              )}
            </Button>
          </div>
        </AdminCard>
      </form>
    </AdminPageContainer>
  );
}
