"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminBlogs } from "@/app/admin/blog/lib/useAdminBlogs";
import { swalError, swalToast } from "@/utils/swal";
import BlogForm from "../components/BlogForm";

export default function BlogCreatePage() {
  const router = useRouter();
  const { createBlog } = useAdminBlogs();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      await createBlog.mutateAsync(formData);
      swalToast("Article published successfully", "success");
      router.push("/admin/blog");
    } catch (err) {
      const message = err.response?.data?.message || "Failed to publish article. Please check your inputs.";
      swalError("Publication Failed", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BlogForm
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      mode="create"
    />
  );
}
