"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { getImageUrl } from "@/utils/imageUtils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import AdminPageContainer from "@/app/admin/_components/AdminPageContainer";
import AdminPageHeader, { AdminBackLink } from "@/app/admin/_components/AdminPageHeader";
import {
  AdminCard,
  AdminCardHeader,
  AdminCardTitle,
  AdminCardDescription,
  AdminCardContent,
} from "@/app/admin/_components/AdminCard";
import { Upload, ImageIcon, Loader2 } from "lucide-react";

export default function CategoryForm({
  initialData = null,
  isEdit = false,
  onSubmit,
  isSubmitting = false,
}) {
  const router = useRouter();
  const [localPreview, setLocalPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const imagePreview = localPreview || (initialData?.image ? getImageUrl(initialData.image) : null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      slug: "",
      description: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || "",
        slug: initialData.slug || "",
        description: initialData.description || "",
      });
    }
  }, [initialData, reset]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLocalPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = (data) => {
    onSubmit({
      ...data,
      file: selectedFile,
    });
  };

  return (
    <AdminPageContainer maxWidth="max-w-3xl">
      <AdminBackLink href="/admin/categories" label="Back to Categories" />
      <AdminPageHeader
        title={isEdit ? "Edit Category" : "New Category"}
        description={
          isEdit
            ? `Update properties for ${initialData?.name || "category"}`
            : "Create a new top-level product category"
        }
      />

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <AdminCard>
          <AdminCardHeader>
            <AdminCardTitle>Category Details</AdminCardTitle>
            <AdminCardDescription>
              Name, unique URL identifier, and customer-facing description
            </AdminCardDescription>
          </AdminCardHeader>

          <AdminCardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">
                  Category Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  {...register("name", {
                    required: "Category name is required",
                    onChange: (e) => {
                      if (!isEdit) {
                        const val = e.target.value;
                        const slug = val
                          .toLowerCase()
                          .trim()
                          .replace(/[^\w\s-]/g, "")
                          .replace(/[\s_-]+/g, "-")
                          .replace(/^-+|-+$/g, "");
                        setValue("slug", slug, { shouldValidate: true });
                      }
                    },
                  })}
                  placeholder="e.g. Outerwear"
                  className="h-10 rounded-xl bg-background/80 border-border/60 text-sm font-medium"
                />
                {errors.name && <p className="text-xs text-rose-500">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">
                  URL Slug <span className="text-rose-500">*</span>
                </Label>
                <Input
                  {...register("slug", {
                    required: "URL slug is required",
                    pattern: {
                      value: /^[a-z0-9-]+$/,
                      message: "Slug must contain only lowercase letters, numbers, and dashes",
                    },
                  })}
                  placeholder="e.g. outerwear"
                  className="h-10 rounded-xl bg-background/80 border-border/60 text-sm font-mono"
                />
                {errors.slug && <p className="text-xs text-rose-500">{errors.slug.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Description</Label>
              <Textarea
                {...register("description")}
                rows={3}
                placeholder="Optional description for category header and search engine listings..."
                className="bg-background/80 border-border/60 rounded-xl px-3.5 py-2.5 text-sm resize-none"
              />
            </div>

            <div className="space-y-2 pt-2">
              <Label className="text-xs font-medium text-foreground">Category Cover Image</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <label className="h-44 rounded-xl border-2 border-dashed border-border/80 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/40 transition-colors group p-4 text-center">
                  <Upload className="size-6 text-muted-foreground group-hover:text-foreground transition-colors mb-2" />
                  <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">
                    Click to upload image
                  </span>
                  <span className="text-[11px] text-muted-foreground/70 mt-1">
                    PNG, JPG, or WEBP up to 5MB
                  </span>
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
                "Update Category"
              ) : (
                "Create Category"
              )}
            </Button>
          </div>
        </AdminCard>
      </form>
    </AdminPageContainer>
  );
}

