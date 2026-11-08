"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { useSubcategories } from "@/app/admin/subcategories/lib/useSubcategories";
import { useAdminCategories } from "@/app/admin/categories/lib/useAdminCategories";
import { swalToast, swalError } from "@/utils/swal";
import SubcategoryForm from "@/app/admin/subcategories/components/SubcategoryForm";
import Loader from "@/components/common/Loader";

function SubcategoryFormContent() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetCategory = searchParams.get("category");

  const isEdit = id !== "new";
  const { subcategories, isLoading: subLoading, createSubcategory, updateSubcategory } = useSubcategories();
  const { categories, isLoading: categoriesLoading } = useAdminCategories();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialSubcategory = isEdit ? subcategories?.find((s) => s._id === id) : null;

  const handleSubmit = async ({ name, slug, category, description, file }) => {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("slug", slug.trim());
    formData.append("category", category);
    if (description) formData.append("description", description);
    if (file) formData.append("image", file);

    try {
      if (isEdit) {
        await updateSubcategory({ id, data: formData });
        swalToast("Subcategory updated successfully", "success");
      } else {
        await createSubcategory(formData);
        swalToast("Subcategory created successfully", "success");
      }
      setTimeout(() => router.push("/admin/categories"), 1200);
    } catch (err) {
      swalError("Save Failed", err.response?.data?.message || "Could not save subcategory.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if ((isEdit && subLoading) || categoriesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader />
      </div>
    );
  }

  return (
    <SubcategoryForm
      initialData={initialSubcategory}
      categories={categories || []}
      isEdit={isEdit}
      presetCategory={presetCategory || ""}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  );
}

export default function SubcategoryFormPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader />
        </div>
      }
    >
      <SubcategoryFormContent />
    </Suspense>
  );
}
