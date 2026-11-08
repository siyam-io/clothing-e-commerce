"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  Save,
  Globe,
  Loader2,
  Clock,
  FileText,
  Sparkles,
  ArrowLeft,
} from "lucide-react";

/**
 * Pure slug generator without external dependencies.
 */
function toSlug(text = "") {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import AdminPageContainer from "@/app/admin/_components/AdminPageContainer";
import { AdminBackLink } from "@/app/admin/_components/AdminPageHeader";
import { swalToast } from "@/utils/swal";
import { getImageUrl } from "@/utils/imageUtils";

import BlogCoverUpload from "./BlogCoverUpload";
import BlogSidebarInspector from "./BlogSidebarInspector";
import RichTextEditor from "./RichTextEditor";
import BlogPreviewModal from "./BlogPreviewModal";

export default function BlogForm({
  blog = null,
  onSubmit,
  isSubmitting = false,
  mode = "create",
}) {
  const router = useRouter();
  const isEdit = mode === "edit";

  // Form State
  const [formData, setFormData] = useState({
    title: blog?.title || "",
    slug: blog?.slug || "",
    excerpt: blog?.excerpt || "",
    content: blog?.content || "",
    category: blog?.category || "LIFESTYLE",
    status: blog?.status || "PUBLISHED",
    isFeatured: blog?.isFeatured || false,
    tags: Array.isArray(blog?.tags)
      ? blog.tags
      : typeof blog?.tags === "string"
      ? blog.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [],
    seo: {
      metaTitle: blog?.seo?.metaTitle || "",
      metaDescription: blog?.seo?.metaDescription || "",
      keywords: Array.isArray(blog?.seo?.keywords)
        ? blog.seo.keywords.join(", ")
        : blog?.seo?.keywords || "",
    },
  });

  // Cover image states
  const [imagePreview, setImagePreview] = useState(
    isEdit && blog?.featuredImage ? getImageUrl(blog.featuredImage) : null
  );
  const [imageFile, setImageFile] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Compute live word count & reading time
  const { wordCount, readingTime } = useMemo(() => {
    const raw = (formData.content || "").replace(/<[^>]*>/g, " ");
    const words = raw.trim().split(/\s+/).filter(Boolean);
    const count = words.length;
    const time = `${Math.max(1, Math.ceil(count / 200))} min read`;
    return { wordCount: count, readingTime: time };
  }, [formData.content]);

  // Compute readiness checklist & score
  const checklist = useMemo(() => {
    const items = [
      { id: "image", label: "Cover image attached", pass: Boolean(imageFile || imagePreview) },
      { id: "title", label: "Headline written (10+ chars)", pass: (formData.title || "").trim().length >= 10 },
      { id: "excerpt", label: "Excerpt / subtitle provided", pass: (formData.excerpt || "").trim().length >= 15 },
      { id: "content", label: "Article body developed (50+ words)", pass: wordCount >= 50 },
      { id: "category", label: "Category assigned", pass: Boolean(formData.category) },
    ];
    const passCount = items.filter((i) => i.pass).length;
    const score = Math.round((passCount / items.length) * 100);
    return { items, score };
  }, [imageFile, imagePreview, formData.title, formData.excerpt, formData.category, wordCount]);

  // Handle title change & auto-generate slug
  const handleTitleChange = (val) => {
    setFormData((prev) => {
      const updated = { ...prev, title: val };
      if (!isEdit && (!prev.slug || prev.slug === toSlug(prev.title || ""))) {
        updated.slug = toSlug(val);
      }
      return updated;
    });
  };

  // Image handlers
  const handleImageSelect = (file) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleImageRemove = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handlePresetSelect = (url) => {
    setImageFile(null);
    setImagePreview(url);
  };

  // Submission handler
  const handleFormSubmit = useCallback(
    (e, saveAsDraft = false) => {
      if (e?.preventDefault) e.preventDefault();

      if (!formData.title?.trim()) {
        swalToast("Please provide an article headline.", "warning");
        return;
      }

      if (!formData.content?.trim()) {
        swalToast("Please write content for the article.", "warning");
        return;
      }

      if (!imageFile && !imagePreview && !blog?.featuredImage) {
        swalToast("Please upload a hero cover banner.", "warning");
        return;
      }

      const data = new FormData();
      data.append("title", formData.title.trim());
      data.append("content", formData.content);
      data.append("category", formData.category);
      data.append("status", saveAsDraft ? "DRAFT" : formData.status);
      data.append("isFeatured", String(formData.isFeatured));
      data.append(
        "slug",
        (formData.slug || toSlug(formData.title)).trim()
      );

      if (formData.excerpt?.trim()) {
        data.append("excerpt", formData.excerpt.trim());
      }

      if (formData.tags && formData.tags.length > 0) {
        data.append("tags", JSON.stringify(formData.tags));
      }

      const seoPayload = {
        metaTitle: formData.seo?.metaTitle?.trim() || formData.title.trim(),
        metaDescription:
          formData.seo?.metaDescription?.trim() || formData.excerpt?.trim() || "",
        keywords: formData.seo?.keywords
          ? formData.seo.keywords.split(",").map((k) => k.trim()).filter(Boolean)
          : [],
      };
      data.append("seo", JSON.stringify(seoPayload));

      if (imageFile) {
        data.append("image", imageFile);
      } else if (
        imagePreview &&
        !imagePreview.startsWith("blob:") &&
        !imagePreview.startsWith("data:")
      ) {
        data.append("featuredImage", imagePreview);
      }

      onSubmit(data, saveAsDraft);
    },
    [formData, imageFile, imagePreview, blog?.featuredImage, onSubmit]
  );

  // Keyboard shortcut Ctrl+S / Cmd+S for saving draft
  const submitRef = useRef(handleFormSubmit);
  useEffect(() => {
    submitRef.current = handleFormSubmit;
  }, [handleFormSubmit]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        submitRef.current(null, true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "p") {
        e.preventDefault();
        setIsPreviewOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <AdminPageContainer maxWidth="max-w-7xl">
      {/* ============================================================ */}
      {/* 1. TOP EDITORIAL WORKFLOW BAR (CLEAN & MINIMALIST)           */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border/60">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin/blog")}
            className="h-9 px-2.5 rounded-xl text-xs gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Back to Articles</span>
          </Button>

          <div className="h-4 w-px bg-border/60 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span
              className={`size-2 rounded-full ${
                formData.status === "PUBLISHED" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              }`}
            />
            <span className="text-xs font-semibold text-foreground">
              {formData.status === "PUBLISHED" ? "Public" : "Draft"}
            </span>

            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground tabular-nums flex items-center gap-1">
              <Clock className="size-3 text-muted-foreground/60" />
              {readingTime}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums hidden md:inline">
              ({wordCount.toLocaleString()} words)
            </span>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsPreviewOpen(true)}
            className="h-9 px-3.5 rounded-xl text-xs font-semibold gap-1.5 border-border/80 bg-background hover:bg-muted text-foreground cursor-pointer shadow-2xs"
            title="Preview article (Ctrl+P)"
          >
            <Eye className="size-3.5" />
            <span>Preview</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => handleFormSubmit(e, true)}
            disabled={isSubmitting}
            className="h-9 px-3.5 rounded-xl text-xs font-medium gap-1.5 border-border/80 bg-background hover:bg-muted text-foreground cursor-pointer shadow-2xs"
            title="Save as Draft (Ctrl+S)"
          >
            <Save className="size-3.5" />
            <span>Save Draft</span>
          </Button>

          <Button
            type="button"
            onClick={(e) => handleFormSubmit(e, false)}
            disabled={isSubmitting}
            className="h-9 px-4 rounded-xl text-xs font-bold gap-1.5 cursor-pointer shadow-xs"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Globe className="size-3.5" />
                <span>{isEdit ? "Update Article" : "Publish Article"}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. MAIN WORKSPACE: CANVAS (LEFT) + INSPECTOR (RIGHT)         */}
      {/* ============================================================ */}
      <form
        onSubmit={(e) => handleFormSubmit(e, false)}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6"
      >
        {/* Left: The Creative Canvas (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Cover Photo Banner Zone */}
          <BlogCoverUpload
            imagePreview={imagePreview}
            onImageSelect={handleImageSelect}
            onImageRemove={handleImageRemove}
            onPresetSelect={handlePresetSelect}
          />

          {/* Headline & Subtitle Box */}
          <div className="space-y-3 pt-2">
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Article Headline..."
              className="w-full bg-transparent text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground placeholder:text-muted-foreground/30 border-none outline-none focus:ring-0 px-0"
              required
            />

            <Textarea
              value={formData.excerpt}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, excerpt: e.target.value }))
              }
              placeholder="Write a concise subtitle or hook for social previews..."
              rows={2}
              className="w-full bg-transparent text-sm sm:text-base text-muted-foreground placeholder:text-muted-foreground/30 border-none outline-none focus:ring-0 resize-none px-0 leading-relaxed"
            />
          </div>

          <div className="h-px bg-border/40 my-2" />

          {/* Full Rich Text Editor Canvas */}
          <div className="space-y-2">
            <RichTextEditor
              value={formData.content}
              onChange={(val) => setFormData((prev) => ({ ...prev, content: val }))}
              placeholder="Tell your story... Format text, embed quotes, insert images..."
            />
          </div>
        </div>

        {/* Right: Focused Settings Inspector (4 cols) */}
        <div className="lg:col-span-4">
          <div className="sticky top-6">
            <BlogSidebarInspector
              formData={formData}
              setFormData={setFormData}
              checklist={checklist}
            />
          </div>
        </div>
      </form>

      {/* Device Preview Modal */}
      <BlogPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        blogData={formData}
        imagePreview={imagePreview}
        readingTime={readingTime}
        onPublish={() => {
          setIsPreviewOpen(false);
          handleFormSubmit(null, false);
        }}
        isSubmitting={isSubmitting}
      />
    </AdminPageContainer>
  );
}
