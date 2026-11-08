import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { swalToast, swalError } from "@/utils/swal";

export const useAdminBlogs = (params = {}, adminView = false, id = null, isId = false) => {
  const queryClient = useQueryClient();

  // 📰 Fetch all blogs (public or admin)
  const { data: blogs, isLoading: blogsLoading } = useQuery({
    queryKey: ["blogs", adminView, params],
    queryFn: async () => {
      const endpoint = adminView ? "/blogs?status=all" : "/blogs";
      return (await api.get(endpoint, { params })).data;
    },
  });

  // 📖 Fetch single blog (Admin by ID or Public by Slug)
  const { data: blog, isLoading: blogLoading } = useQuery({
    queryKey: ["blog", id, isId],
    queryFn: async () => {
      const endpoint = isId ? `/blogs/admin/${id}` : `/blogs/${id}`;
      const { data } = await api.get(endpoint);
      return data;
    },
    enabled: !!id,
  });

  // 🚀 Create blog (admin only)
  const createBlog = useMutation({
    mutationFn: async (formData) => {
      const { data } = await api.post("/blogs", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      swalToast("Article created successfully!", "success");
    },
    onError: (err) => {
      swalError("Creation failed", err.response?.data?.message);
    },
  });

  // 🔄 Update blog (admin only)
  const updateBlog = useMutation({
    mutationFn: async ({ id, formData }) => {
      // Use /admin/:id to match backend route
      const { data } = await api.put(`/blogs/admin/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      queryClient.invalidateQueries({ queryKey: ["blog", variables.id, true] });
      queryClient.invalidateQueries({ queryKey: ["blog", variables.id, false] });
      swalToast("Article updated successfully!", "success");
    },
    onError: (err) => {
      swalError("Update failed", err.response?.data?.message);
    },
  });

  // 🗑️ Delete blog (admin only)
  const deleteBlog = useMutation({
    mutationFn: async (id) => {
      // Use /admin/:id to match backend route
      await api.delete(`/blogs/admin/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      swalToast("Article deleted successfully.", "success");
    },
    onError: (err) => {
      swalError("Purge failed", err.response?.data?.message);
    },
  });

  return {
    blogs: blogs?.blogs || [],
    total: blogs?.total || 0,
    pages: blogs?.pages || 1,
    page: blogs?.page || 1,
    blog,
    blogsLoading,
    blogLoading,
    createBlog,
    updateBlog,
    deleteBlog,
    toggleStatus: async (id, currentStatus) => {
      const newStatus = currentStatus === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
      return updateBlog.mutateAsync({ id, formData: { status: newStatus } });
    },
    toggleFeatured: async (id, currentFeatured) => {
      return updateBlog.mutateAsync({ id, formData: { isFeatured: !currentFeatured } });
    }
  };
};
