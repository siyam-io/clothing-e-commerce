"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useSizes } from "@/app/admin/sizes/lib/useSizes";
import { useAdminCategories } from "@/app/admin/categories/lib/useAdminCategories";
import { swalToast, swalError } from "@/utils/swal";
import SizeForm from "@/app/admin/sizes/components/SizeForm";
import Loader from "@/components/common/Loader";

export default function SizeFormPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetCategory = searchParams.get("category");

  const isEdit = id !== "new";
  const { sizes, isLoading: isSizesLoading, createSize, updateSize } = useSizes();
  const { categories, isLoading: categoriesLoading } = useAdminCategories();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialSize = isEdit ? sizes?.find((s) => s._id === id) : null;

  const handleSubmit = async (data) => {
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

  if ((isEdit && isSizesLoading) || categoriesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader />
      </div>
    );
  }

  return (
    <SizeForm
      initialData={initialSize}
      categories={categories || []}
      isEdit={isEdit}
      presetCategory={presetCategory || ""}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  );
}
