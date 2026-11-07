"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import RichTextEditor from "./RichTextEditor";
import { ImageIcon, Loader2, Save, Upload, X } from "lucide-react";
import { swalError } from "@/utils/swal";
import { getImageUrl } from "@/utils/imageUtils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import AdminPageContainer from "@/app/admin/_components/AdminPageContainer";
import AdminPageHeader, { AdminBackLink } from "@/app/admin/_components/AdminPageHeader";
import { AdminCard, AdminCardHeader, AdminCardTitle, AdminCardContent } from "@/app/admin/_components/AdminCard";

export default function BlogForm({ blog = null, onSubmit, isSubmitting, mode = "create" }) {
  const router = useRouter();
  const isEdit = mode === "edit";

  const [imagePreview, setImagePreview] = useState(
    isEdit && blog ? getImageUrl(blog.featuredImage) : null
  );
  const [imageFile, setImageFile] = useState(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: blog?.title || "",
    content: blog?.content || "",
    category: blog?.category || "LIFESTYLE",
    status: blog?.status || "PUBLISHED",
    isFeatured: blog?.isFeatured || false,
    seo: {
      metaTitle: blog?.seo?.metaTitle || "",
      metaDescription: blog?.seo?.metaDescription || "",
      keywords: blog?.seo?.keywords?.join(", ") || "",
    },
  });

  const handleImageChange = (e) => {
    const file = e?.target?.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!isEdit && !imageFile && !imagePreview) {
      return swalError("Featured Image Missing", "Please select a cover image for this article.");
    }
    if (!formData.title.trim()) {
      return swalError("Title Required", "Please provide an article title.");
    }
    if (!formData.content.trim()) {
      return swalError("Content Required", "Please write article content before saving.");
    }

    const seoData = {
      metaTitle: formData.seo.metaTitle,
      metaDescription: formData.seo.metaDescription,
      keywords: formData.seo.keywords ? formData.seo.keywords.split(",").map(k => k.trim()).filter(Boolean) : []
    };

    const data = new FormData();
    data.append("title", formData.title);
    data.append("content", formData.content);
    data.append("category", formData.category);
    data.append("status", formData.status);
    data.append("isFeatured", formData.isFeatured);
    data.append("seo", JSON.stringify(seoData));
    if (imageFile) data.append("image", imageFile);

    onSubmit(data);
  };

  return (
    <AdminPageContainer maxWidth="max-w-6xl">
      <AdminBackLink href="/admin/blog" label="Back to Articles" />

      <AdminPageHeader
        title={isEdit ? `Edit Article: ${blog?.title || ""}` : "Create New Article"}
        description={isEdit ? "Update blog content, cover photo, category, and SEO metadata" : "Write and publish engaging stories, guides, or announcements"}
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.push("/admin/blog")}
              disabled={isSubmitting}
              className="h-10 px-4 rounded-xl text-xs font-medium"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="h-10 px-5 rounded-xl text-xs font-medium gap-2 shadow-xs cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  {isEdit ? "Update Article" : "Publish Article"}
                </>
              )}
            </Button>
          </div>
        }
      />

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Editor (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <AdminCard>
            <AdminCardContent className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">
                  Article Title <span className="text-rose-500">*</span>
                </Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter a descriptive headline..."
                  className="h-11 rounded-xl bg-background/80 border-border/60 text-base font-semibold"
                />
              </div>

              <div className="space-y-1.5 pt-2">
                <Label className="text-xs font-medium text-foreground">
                  Body Content <span className="text-rose-500">*</span>
                </Label>
                <div className="rounded-xl border border-border/60 overflow-hidden bg-background">
                  <RichTextEditor
                    value={formData.content}
                    onChange={(val) => setFormData({ ...formData, content: val })}
                  />
                </div>
              </div>
            </AdminCardContent>
          </AdminCard>
        </div>

        {/* Sidebar Controls (4 cols) */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Featured Image */}
          <AdminCard>
            <AdminCardHeader>
              <AdminCardTitle>Cover Image</AdminCardTitle>
            </AdminCardHeader>
            <AdminCardContent className="space-y-3">
              <div className="aspect-[16/10] rounded-xl overflow-hidden bg-muted/40 border border-border/60 flex items-center justify-center relative">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="size-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center p-4 text-center text-muted-foreground/60 gap-1.5">
                    <ImageIcon className="size-8 stroke-[1.5]" />
                    <span className="text-xs">No cover image</span>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 h-9 rounded-xl text-xs font-medium"
                >
                  <Upload className="size-3.5 mr-1.5" />
                  {imagePreview ? "Replace" : "Upload"}
                </Button>
                {imagePreview && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                    className="h-9 px-3 rounded-xl text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-500/10"
                  >
                    <X className="size-3.5" />
                  </Button>
                )}
              </div>
            </AdminCardContent>
          </AdminCard>

          {/* Publishing Settings */}
          <AdminCard>
            <AdminCardHeader>
              <AdminCardTitle>Settings & Status</AdminCardTitle>
            </AdminCardHeader>
            <AdminCardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(val) => setFormData({ ...formData, category: val })}
                >
                  <SelectTrigger className="h-10 bg-background/80 border-border/60 rounded-xl text-xs font-medium">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border rounded-xl">
                    {['LIFESTYLE', 'COLLECTION', 'FABRIC', 'CULTURE', 'NEWS', 'GENERAL'].map((c) => (
                      <SelectItem key={c} value={c} className="text-xs">
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Publishing Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger className="h-10 bg-background/80 border-border/60 rounded-xl text-xs font-medium">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border rounded-xl">
                    <SelectItem value="PUBLISHED" className="text-xs text-emerald-600 dark:text-emerald-400">
                      Published (Public)
                    </SelectItem>
                    <SelectItem value="DRAFT" className="text-xs text-amber-600 dark:text-amber-400">
                      Draft (Hidden)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors">
                  <Checkbox
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onCheckedChange={(val) => setFormData({ ...formData, isFeatured: Boolean(val) })}
                    className="rounded-md"
                  />
                  <div>
                    <p className="text-xs font-medium text-foreground">Feature on Homepage</p>
                    <p className="text-[11px] text-muted-foreground">Highlight in featured stories slider</p>
                  </div>
                </label>
              </div>
            </AdminCardContent>
          </AdminCard>

          {/* Search Engine Optimization */}
          <AdminCard>
            <AdminCardHeader>
              <AdminCardTitle>SEO Attributes</AdminCardTitle>
            </AdminCardHeader>
            <AdminCardContent className="space-y-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Meta Title</Label>
                <Input
                  placeholder="Title for search engine snippets"
                  value={formData.seo.metaTitle}
                  onChange={(e) => setFormData({ ...formData, seo: { ...formData.seo, metaTitle: e.target.value } })}
                  className="h-10 rounded-xl bg-background/80 border-border/60 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Meta Description</Label>
                <Textarea
                  placeholder="Brief summary for Google search result cards..."
                  rows={3}
                  value={formData.seo.metaDescription}
                  onChange={(e) => setFormData({ ...formData, seo: { ...formData.seo, metaDescription: e.target.value } })}
                  className="bg-background/80 border-border/60 rounded-xl px-3 py-2 text-xs resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Keywords (comma-separated)</Label>
                <Input
                  placeholder="e.g. style guide, organic cotton, streetwear"
                  value={formData.seo.keywords}
                  onChange={(e) => setFormData({ ...formData, seo: { ...formData.seo, keywords: e.target.value } })}
                  className="h-10 rounded-xl bg-background/80 border-border/60 text-xs"
                />
              </div>
            </AdminCardContent>
          </AdminCard>
        </aside>
      </form>
    </AdminPageContainer>
  );
}
