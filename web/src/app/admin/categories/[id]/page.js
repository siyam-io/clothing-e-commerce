"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useAdminCategories, useAdminCategory } from "@/app/admin/categories/lib/useAdminCategories";
import { swalToast, swalError } from "@/utils/swal";
import CategoryForm from "@/app/admin/categories/components/CategoryForm";
import Loader from "@/components/common/Loader";

export default function CategoryFormPage() {
  const { id } = useParams();
  const router = useRouter();
  const isEdit = id !== "new";

  const { createCategory, updateCategory } = useAdminCategories();
  const { category, isLoading: isCategoryLoading } = useAdminCategory(id);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async ({ name, slug, description, file }) => {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("slug", slug.trim());
    if (description) formData.append("description", description);
    if (file) formData.append("image", file);

    try {
      if (isEdit) {
        await updateCategory({ id, data: formData });
        swalToast("Category updated successfully", "success");
      } else {
        await createCategory(formData);
        swalToast("Category created successfully", "success");
      }
      setTimeout(() => router.push("/admin/categories"), 1200);
    } catch (err) {
      swalError("Save Failed", err.response?.data?.message || "Could not save category.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEdit && isCategoryLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader />
      </div>
    );
  }

  return (
    <CategoryForm
      initialData={category}
      isEdit={isEdit}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  );
}
