/* eslint-disable @next/next/no-img-element */
"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, X, ImageIcon, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const CURATED_COVERS = [
  {
    title: "Minimalist Denim",
    url: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1600&q=80",
  },
  {
    title: "Organic Sustainable",
    url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1600&q=80",
  },
  {
    title: "Autumn Outerwear",
    url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1600&q=80",
  },
  {
    title: "Atelier Tailoring",
    url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=80",
  },
];

export default function BlogCoverUpload({
  imagePreview,
  onImageSelect,
  onImageRemove,
  onPresetSelect,
}) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      onImageSelect(file);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageSelect(file);
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload hero cover banner"
      />

      {imagePreview ? (
        <div className="relative aspect-[21/9] sm:aspect-[24/9] w-full rounded-2xl overflow-hidden border border-border/70 bg-muted/20 group shadow-2xs">
          <img
            src={imagePreview}
            alt="Article Cover Preview"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
          />

          {/* Floating Action Controls */}
          <div className="absolute top-3 right-3 flex items-center gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 px-3 rounded-xl text-xs font-semibold gap-1.5 bg-background/90 hover:bg-background text-foreground shadow-md backdrop-blur-xs cursor-pointer"
            >
              <RefreshCw className="size-3.5" />
              Change Cover
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onImageRemove}
              className="h-8 px-2.5 rounded-xl text-xs font-semibold shadow-md cursor-pointer"
              aria-label="Remove cover image"
            >
              <X className="size-3.5" />
            </Button>
          </div>

          <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[11px] font-medium text-white/90">
            Featured Cover Active
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative aspect-[24/9] sm:aspect-[28/9] min-h-[160px] rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-6 text-center cursor-pointer group ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border/60 bg-muted/15 hover:bg-muted/30 hover:border-border"
          }`}
        >
          <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
            <Upload className="size-4" />
          </div>

          <p className="text-xs sm:text-sm font-semibold text-foreground">
            Drop your hero cover banner here, or{" "}
            <span className="text-primary underline underline-offset-2">browse files</span>
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Recommended 16:9 or 21:9 ratio (JPG, PNG, WebP up to 8MB)
          </p>

          {/* Clean Preset Samples Row */}
          <div
            className="mt-3 pt-3 border-t border-border/40 flex flex-wrap items-center justify-center gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-[11px] text-muted-foreground mr-1 flex items-center gap-1">
              <Sparkles className="size-3 text-primary" /> Curated:
            </span>
            {CURATED_COVERS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onPresetSelect(preset.url)}
                className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-background hover:bg-muted text-foreground border border-border/60 transition-colors shadow-2xs"
              >
                {preset.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
