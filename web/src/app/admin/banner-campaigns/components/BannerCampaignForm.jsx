/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  ImageIcon,
  Upload,
  Layers,
  Sparkles,
  Loader2,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  Check,
  CheckCircle2,
  Link as LinkIcon,
  HelpCircle,
  Smartphone,
  Monitor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  AdminCard,
  AdminCardHeader,
  AdminCardTitle,
  AdminCardContent,
} from "@/app/admin/_components/AdminCard";
import { getImageUrl } from "@/utils/imageUtils";
import { cn } from "@/lib/utils";

export default function BannerCampaignForm({
  formData,
  setFormData,
  slideFiles,
  setSlideFiles,
  isEdit,
  isSaving,
  onSubmit,
}) {
  const router = useRouter();
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const fileInputRef = useRef(null);

  const slides = formData.slides || [];
  const currentSlide = slides[activeSlideIndex] || slides[0] || {};
  const currentSlideId = currentSlide._id || currentSlide.tempId;

  // Resolve preview url for current slide
  const currentSlidePreview = currentSlide.image
    ? currentSlide.image.startsWith("blob:")
      ? currentSlide.image
      : getImageUrl(currentSlide.image)
    : null;

  const updateSlide = (slideId, field, value) => {
    const newSlides = slides.map((slide) => {
      if ((slide._id || slide.tempId) === slideId) {
        return { ...slide, [field]: value };
      }
      return slide;
    });
    setFormData((prev) => ({ ...prev, slides: newSlides }));
  };

  const addSlide = () => {
    const newSlide = {
      tempId: "new-" + Date.now(),
      title: "",
      subtitle: "",
      link: "",
      image: "",
      order: slides.length,
    };
    setFormData((prev) => ({ ...prev, slides: [...prev.slides, newSlide] }));
    setActiveSlideIndex(slides.length);
  };

  const removeSlide = (slideId) => {
    if (slides.length <= 1) return;
    const filtered = slides.filter((s) => (s._id || s.tempId) !== slideId);
    setFormData((prev) => ({ ...prev, slides: filtered }));
    setActiveSlideIndex((prev) => Math.max(0, Math.min(prev, filtered.length - 1)));
  };

  const handleSlideImage = (slideId, file) => {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    const oldPreview = slides.find((s) => (s._id || s.tempId) === slideId)?.image;
    if (oldPreview && oldPreview.startsWith("blob:")) {
      URL.revokeObjectURL(oldPreview);
    }
    updateSlide(slideId, "image", previewUrl);
    setSlideFiles((prev) => ({ ...prev, [slideId]: file }));
  };

  const moveSlide = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= slides.length) return;
    const reordered = [...slides];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    setFormData((prev) => ({ ...prev, slides: reordered }));
    setActiveSlideIndex(targetIndex);
  };

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
      {/* ============================================================ */}
      {/* LEFT: LIVE HERO SIMULATOR & SLIDE EDITOR (8 COLS)            */}
      {/* ============================================================ */}
      <div className="lg:col-span-8 space-y-6">
        {/* Live Storefront Hero Simulator */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center size-6 rounded-lg bg-primary/10 text-primary">
                <Eye className="size-3.5" />
              </span>
              <Label className="text-xs font-bold text-foreground">
                Live Storefront Simulator
              </Label>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted/60 text-muted-foreground border border-border/40">
                <Monitor className="size-3" />
                <span>21:9 Aspect Ratio</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono tabular-nums text-muted-foreground px-2 py-0.5 rounded-md bg-muted/50 border border-border/30">
                Slide {activeSlideIndex + 1} of {slides.length}
              </span>
            </div>
          </div>

          {/* Simulated Floating Banner Viewport */}
          <div className="relative aspect-[21/9] sm:aspect-[24/9] w-full rounded-2xl overflow-hidden border border-border/60 bg-neutral-950 shadow-lg group">
            {currentSlidePreview ? (
              <img
                src={currentSlidePreview}
                alt="Banner preview"
                className="size-full object-cover outline outline-1 outline-black/10 dark:outline-white/10 -outline-offset-1 transition-transform duration-700 group-hover:scale-[1.01]"
              />
            ) : (
              <div className="size-full flex flex-col items-center justify-center p-6 text-center text-muted-foreground bg-gradient-to-b from-muted/30 to-muted/10">
                <div className="size-12 rounded-2xl bg-muted/50 border border-border/40 flex items-center justify-center mb-2.5 shadow-inner">
                  <ImageIcon className="size-6 text-muted-foreground/60" />
                </div>
                <p className="text-xs font-bold text-foreground" style={{ textWrap: "balance" }}>
                  No Banner Image Uploaded Yet
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 max-w-sm" style={{ textWrap: "pretty" }}>
                  Upload a high-resolution hero photo below to see how it looks on the homepage
                </p>
              </div>
            )}

            {/* Simulated Live Gradient & Typography Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10 flex flex-col justify-end p-5 sm:p-8 pointer-events-none">
              <div className="max-w-xl space-y-2 pointer-events-auto">
                <h3
                  className="text-lg sm:text-2xl font-black text-white tracking-tight drop-shadow-md line-clamp-1"
                  style={{ textWrap: "balance" }}
                >
                  {currentSlide.title || "Headline Title Over Banner..."}
                </h3>
                <p
                  className="text-xs sm:text-sm text-white/85 line-clamp-2 leading-relaxed drop-shadow-sm font-medium"
                  style={{ textWrap: "pretty" }}
                >
                  {currentSlide.subtitle || "Your promotional announcement, season discount, or capsule preview..."}
                </p>

                {currentSlide.link && (
                  <div className="pt-2">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:bg-primary/95 transition-[transform,background-color] active:scale-[0.98]">
                      <span>Explore Collection</span>
                      <ArrowRight className="size-3.5" />
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Simulated Slide Indicator Dots */}
            {slides.length > 1 && (
              <div className="absolute bottom-3 right-4 flex items-center gap-1.5 pointer-events-none">
                {slides.map((_, dotIdx) => (
                  <span
                    key={dotIdx}
                    className={cn(
                      "h-1.5 rounded-full transition-[width,background-color] duration-300",
                      dotIdx === activeSlideIndex
                        ? "w-5 bg-white shadow-sm"
                        : "w-1.5 bg-white/40"
                    )}
                  />
                ))}
              </div>
            )}

            {/* Quick Carousel Prev/Next Buttons with 40px touch target */}
            {slides.length > 1 && (
              <div className="absolute top-1/2 -translate-y-1/2 left-3 right-3 flex items-center justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  type="button"
                  onClick={() => setActiveSlideIndex((prev) => Math.max(0, prev - 1))}
                  disabled={activeSlideIndex === 0}
                  className="size-10 rounded-full shadow-lg pointer-events-auto bg-background/85 backdrop-blur-md border border-border/40 text-foreground hover:bg-background flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none transition-[transform,background-color] active:scale-95"
                  title="Previous slide"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSlideIndex((prev) => Math.min(slides.length - 1, prev + 1))}
                  disabled={activeSlideIndex === slides.length - 1}
                  className="size-10 rounded-full shadow-lg pointer-events-auto bg-background/85 backdrop-blur-md border border-border/40 text-foreground hover:bg-background flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none transition-[transform,background-color] active:scale-95"
                  title="Next slide"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Slide Selector Carousel Strip */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">
              Campaign Slides ({slides.length})
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addSlide}
              className="h-8 px-3 rounded-xl text-xs font-semibold gap-1.5 border-border/70 bg-card hover:bg-muted text-foreground cursor-pointer shadow-2xs transition-[background-color,border-color,transform] active:scale-[0.98]"
            >
              <Plus className="size-3.5" />
              <span>Add Slide</span>
            </Button>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin">
            {slides.map((slide, idx) => {
              const slideId = slide._id || slide.tempId;
              const isSelected = activeSlideIndex === idx;
              const thumb = slide.image
                ? slide.image.startsWith("blob:")
                  ? slide.image
                  : getImageUrl(slide.image)
                : null;

              return (
                <div
                  key={slideId}
                  onClick={() => setActiveSlideIndex(idx)}
                  className={cn(
                    "flex-shrink-0 w-48 rounded-2xl border p-2.5 transition-[border-color,background-color,box-shadow,transform] cursor-pointer relative group",
                    isSelected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/25 shadow-sm"
                      : "border-border/60 bg-card/60 hover:bg-card hover:border-border/80"
                  )}
                >
                  {/* Thumbnail */}
                  <div className="aspect-[21/9] rounded-xl overflow-hidden bg-muted/40 border border-border/40 relative mb-2">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt="thumbnail"
                        className="size-full object-cover outline outline-1 outline-black/5 -outline-offset-1"
                      />
                    ) : (
                      <div className="size-full flex items-center justify-center text-muted-foreground/50">
                        <ImageIcon className="size-4" />
                      </div>
                    )}
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold font-mono tabular-nums bg-black/75 text-white backdrop-blur-xs">
                      #{idx + 1}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-foreground truncate" title={slide.title || `Slide #${idx + 1}`}>
                    {slide.title || `Slide #${idx + 1}`}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate" title={slide.link || "No target link"}>
                    {slide.link || "No target link"}
                  </p>

                  {/* Ordering and remove controls with 32px touch target */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/30 mt-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveSlide(idx, -1);
                        }}
                        className="size-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-25 flex items-center justify-center transition-colors cursor-pointer"
                        title="Move slide left"
                      >
                        <ChevronLeft className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === slides.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveSlide(idx, 1);
                        }}
                        className="size-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-25 flex items-center justify-center transition-colors cursor-pointer"
                        title="Move slide right"
                      >
                        <ChevronRight className="size-3.5" />
                      </button>
                    </div>

                    {slides.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSlide(slideId);
                        }}
                        className="size-7 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 flex items-center justify-center transition-colors cursor-pointer"
                        title="Delete slide"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Slide Editing Card */}
        {currentSlide && (
          <AdminCard className="rounded-2xl border-border/70 shadow-sm backdrop-blur-xl bg-card/85">
            <AdminCardHeader className="border-b border-border/40 pb-3.5">
              <div className="flex items-center justify-between">
                <AdminCardTitle className="text-sm font-bold flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />
                  <span>Configure Slide #{activeSlideIndex + 1}</span>
                </AdminCardTitle>
                <span className="text-[11px] text-muted-foreground font-mono">
                  Recommended: 1920×800 (JPG, PNG, WebP)
                </span>
              </div>
            </AdminCardHeader>

            <AdminCardContent className="p-6 space-y-5">
              {/* Image Upload Zone */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground flex items-center gap-1">
                  <span>Banner Image Asset</span>
                  <span className="text-rose-500">*</span>
                </Label>

                <div className="flex items-center gap-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 rounded-2xl border-2 border-dashed border-border/80 hover:border-primary/60 bg-muted/20 hover:bg-muted/40 p-5 transition-[border-color,background-color] flex items-center gap-4 cursor-pointer group"
                  >
                    <div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-[background-color,color]">
                      <Upload className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-foreground">
                        {currentSlidePreview ? "Replace banner image asset" : "Upload high-res banner image"}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        Click to browse file from your computer (Recommended: 1920×800)
                      </p>
                    </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleSlideImage(currentSlideId, file);
                    }}
                  />
                </div>
              </div>

              {/* Text Overlays */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">
                    Headline Title
                  </Label>
                  <Input
                    value={currentSlide.title || ""}
                    onChange={(e) => updateSlide(currentSlideId, "title", e.target.value)}
                    placeholder="e.g. Autumn / Winter Capsule 2026"
                    className="h-10 rounded-xl bg-background border-border/70 text-xs font-medium focus-visible:ring-1"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">
                    Subtitle / Caption
                  </Label>
                  <Input
                    value={currentSlide.subtitle || ""}
                    onChange={(e) => updateSlide(currentSlideId, "subtitle", e.target.value)}
                    placeholder="e.g. Architectural tailoring meets organic cotton"
                    className="h-10 rounded-xl bg-background border-border/70 text-xs focus-visible:ring-1"
                  />
                </div>
              </div>

              {/* Target Link */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <LinkIcon className="size-3.5 text-muted-foreground" />
                    <span>Destination URL / Storefront Route</span>
                  </Label>
                  <span className="text-[11px] text-muted-foreground">
                    Action on slide click
                  </span>
                </div>
                <Input
                  value={currentSlide.link || ""}
                  onChange={(e) => updateSlide(currentSlideId, "link", e.target.value)}
                  placeholder="e.g. /products?category=outerwear or /sale"
                  className="h-10 rounded-xl bg-background border-border/70 font-mono text-xs focus-visible:ring-1"
                />
              </div>
            </AdminCardContent>
          </AdminCard>
        )}
      </div>

      {/* ============================================================ */}
      {/* RIGHT: CAMPAIGN CONFIGURATION & ACTIVATION (4 COLS)          */}
      {/* ============================================================ */}
      <aside className="lg:col-span-4 space-y-6">
        {/* Campaign Settings Card */}
        <AdminCard className="rounded-2xl border-border/70 shadow-sm backdrop-blur-xl bg-card/85">
          <AdminCardHeader className="border-b border-border/40 pb-3.5">
            <AdminCardTitle className="text-sm font-bold flex items-center gap-2">
              <Layers className="size-4 text-primary" />
              <span>Campaign Settings</span>
            </AdminCardTitle>
          </AdminCardHeader>

          <AdminCardContent className="p-5 space-y-4">
            {/* Storefront Activation Switch with Radix Switch */}
            <div className="p-4 rounded-2xl border border-border/60 bg-muted/20 space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-foreground">
                    Storefront Activation
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    Display as hero carousel on the homepage
                  </p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(val) =>
                    setFormData((prev) => ({ ...prev, isActive: val }))
                  }
                />
              </div>

              <div className="pt-1">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-colors",
                    formData.isActive
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                      : "bg-muted text-muted-foreground border-border/60"
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      formData.isActive ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
                    )}
                  />
                  {formData.isActive ? "Live on Storefront" : "Inactive Draft"}
                </span>
              </div>
            </div>

            {/* Campaign Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1">
                <span>Campaign Name</span>
                <span className="text-rose-500">*</span>
              </Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Summer 2026 Hero Drop"
                required
                className="h-10 rounded-xl bg-background border-border/70 text-xs font-semibold focus-visible:ring-1"
              />
            </div>

            {/* Internal Notes / Description */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Internal Description / Notes
              </Label>
              <Textarea
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Internal notes regarding target dates, marketing launch, or promotional vouchers..."
                className="rounded-xl bg-background border-border/70 text-xs resize-none focus-visible:ring-1 leading-relaxed"
              />
            </div>
          </AdminCardContent>
        </AdminCard>

        {/* Action Buttons Card */}
        <div className="rounded-2xl border border-border/70 bg-card/85 backdrop-blur-xl p-4 space-y-2.5 shadow-sm">
          <Button
            type="submit"
            disabled={isSaving}
            className="w-full h-11 rounded-xl text-xs font-bold gap-2 cursor-pointer shadow-md transition-[background-color,transform,box-shadow] active:scale-[0.98]"
          >
            {isSaving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Saving Campaign...</span>
              </>
            ) : (
              <>
                <Check className="size-4" />
                <span>{isEdit ? "Update Campaign" : "Publish Campaign"}</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            onClick={() => router.push("/admin/banner-campaigns")}
            className="w-full h-9 rounded-xl text-xs font-medium border-border/70 bg-background hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          >
            Cancel & Return
          </Button>
        </div>
      </aside>
    </form>
  );
}
