"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getImageUrl } from "@/utils/imageUtils";
import { 
  Plus, 
  Trash2, 
  ImageIcon, 
  Upload,
  Layers,
  Sparkles,
  Loader2
} from "lucide-react";
import { AdminCard, AdminCardHeader, AdminCardTitle, AdminCardContent } from "@/app/admin/_components/AdminCard";

export default function BannerCampaignForm({ 
  formData, 
  setFormData, 
  slideFiles, 
  setSlideFiles, 
  isEdit, 
  isSaving, 
  onSubmit 
}) {
  const router = useRouter();

  const updateSlide = (slideId, field, value) => {
    const newSlides = formData.slides.map((slide) => {
      if ((slide._id || slide.tempId) === slideId)
        return { ...slide, [field]: value };
      return slide;
    });
    setFormData({ ...formData, slides: newSlides });
  };

  const addSlide = () => {
    const newSlide = {
      tempId: 'new-' + Date.now(),
      title: "",
      subtitle: "",
      link: "",
      image: "",
      order: formData.slides.length
    };
    setFormData(prev => ({ ...prev, slides: [...prev.slides, newSlide] }));
  };

  const removeSlide = (slideId) => {
    setFormData(prev => ({
      ...prev,
      slides: prev.slides.filter(s => (s._id || s.tempId) !== slideId)
    }));
  };

  const handleSlideImage = (slideId, file) => {
    const previewUrl = URL.createObjectURL(file);
    const oldPreview = formData.slides.find(
      (s) => (s._id || s.tempId) === slideId,
    )?.image;
    if (oldPreview && oldPreview.startsWith("blob:"))
      URL.revokeObjectURL(oldPreview);

    updateSlide(slideId, "image", previewUrl);
    setSlideFiles({ ...slideFiles, [slideId]: file });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Campaign Details Card */}
      <AdminCard>
        <AdminCardHeader>
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Layers className="size-4" />
            </div>
            <AdminCardTitle>Campaign General Information</AdminCardTitle>
          </div>
        </AdminCardHeader>

        <AdminCardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">
              Campaign Name <span className="text-rose-500">*</span>
            </Label>
            <Input 
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Summer Collection 2026"
              required
              className="h-10 rounded-xl bg-background/80 border-border/60 text-sm font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">Campaign Description</Label>
            <Textarea 
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Internal campaign description or notes..."
              className="bg-background/80 border-border/60 rounded-xl px-3.5 py-2.5 text-xs resize-none"
            />
          </div>

          <div className="pt-1">
            <label className="flex items-center gap-3 p-3.5 rounded-xl border border-border/60 bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="size-4 rounded border-border/60 text-primary cursor-pointer"
              />
              <div>
                <p className="text-xs font-medium text-foreground">Activate on Storefront</p>
                <p className="text-[11px] text-muted-foreground">Make this banner campaign visible on the homepage</p>
              </div>
            </label>
          </div>
        </AdminCardContent>
      </AdminCard>

      {/* Banner Slides Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-foreground">Banner Slides ({formData.slides.length})</h4>
            <p className="text-xs text-muted-foreground">Upload images and links for rotating carousel slides</p>
          </div>
          <Button 
            type="button" 
            variant="outline"
            size="sm"
            onClick={addSlide}
            className="h-9 px-3.5 rounded-xl text-xs font-medium gap-1.5"
          >
            <Plus className="size-3.5" /> Add Slide
          </Button>
        </div>

        {formData.slides.map((slide, idx) => {
          const slideId = slide._id || slide.tempId;
          const preview = slide.image
            ? slide.image.startsWith("blob:")
              ? slide.image
              : getImageUrl(slide.image)
            : null;

          return (
            <AdminCard key={slideId} className="relative">
              <AdminCardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border/40">
                  <span className="text-xs font-semibold text-foreground">Slide #{idx + 1}</span>
                  {formData.slides.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSlide(slideId)}
                      className="h-7 px-2 rounded-lg text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 gap-1"
                    >
                      <Trash2 className="size-3.5" /> Remove
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                  {/* Image Dropzone */}
                  <div className="md:col-span-5 space-y-2">
                    <Label className="text-xs font-medium text-foreground">
                      Slide Image <span className="text-rose-500">*</span>
                    </Label>
                    <label className="h-44 rounded-xl border-2 border-dashed border-border/80 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/40 transition-colors group overflow-hidden relative">
                      {preview ? (
                        <img src={preview} alt="Slide preview" className="size-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center justify-center p-4 text-center">
                          <Upload className="size-6 text-muted-foreground group-hover:text-foreground transition-colors mb-2" />
                          <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">Upload 1920×800 Banner</span>
                          <span className="text-[11px] text-muted-foreground/70 mt-1">PNG, JPG, or WEBP</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) handleSlideImage(slideId, file);
                        }}
                      />
                    </label>
                  </div>

                  {/* Text Overlays & Destination Link */}
                  <div className="md:col-span-7 space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-foreground">Headline Title</Label>
                      <Input
                        value={slide.title || ""}
                        onChange={(e) => updateSlide(slideId, "title", e.target.value)}
                        placeholder="e.g. New Seasonal Drop"
                        className="h-10 rounded-xl bg-background/80 border-border/60 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-foreground">Subtitle / Caption</Label>
                      <Input
                        value={slide.subtitle || ""}
                        onChange={(e) => updateSlide(slideId, "subtitle", e.target.value)}
                        placeholder="e.g. Up to 40% off selected outerwear"
                        className="h-10 rounded-xl bg-background/80 border-border/60 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-foreground">Target URL / Category Link</Label>
                      <Input
                        value={slide.link || ""}
                        onChange={(e) => updateSlide(slideId, "link", e.target.value)}
                        placeholder="e.g. /products?category=outerwear"
                        className="h-10 rounded-xl bg-background/80 border-border/60 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              </AdminCardContent>
            </AdminCard>
          );
        })}
      </div>

      <div className="flex items-center justify-end gap-3 p-4 rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/banner-campaigns")}
          disabled={isSaving}
          className="h-10 px-5 rounded-xl text-xs font-medium"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSaving}
          className="h-10 px-6 rounded-xl text-xs font-medium gap-2 shadow-xs cursor-pointer"
        >
          {isSaving ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving...
            </>
          ) : (
            isEdit ? "Update Campaign" : "Publish Campaign"
          )}
        </Button>
      </div>
    </form>
  );
}
