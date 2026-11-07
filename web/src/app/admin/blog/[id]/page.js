"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAdminBlogs } from "@/app/admin/blog/lib/useAdminBlogs";
import Loader from "@/components/common/Loader";
import BlogForm from "../components/BlogForm";
import { swalError, swalToast } from "@/utils/swal";

export default function BlogEditPage() {
  const { id } = useParams();
  const router = useRouter();
  const { blog, blogLoading, updateBlog } = useAdminBlogs({}, true, id, true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      await updateBlog.mutateAsync({ id: blog._id, formData });
      swalToast("Article updated successfully", "success");
      router.push("/admin/blog");
    } catch (err) {
      const message = err.response?.data?.message || "Update failed. Check your inputs.";
      swalError("Update Failed", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (blogLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="h-[60vh] flex items-center justify-center text-center text-muted-foreground font-medium text-sm">
        Blog post not found.
      </div>
    );
  }

  return (
    <BlogForm
      key={blog._id}
      blog={blog}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      mode="edit"
    />
  );
}
