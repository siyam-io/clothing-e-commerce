"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Monitor,
  Smartphone,
  Calendar,
  Clock,
  User,
  Sparkles,
  ExternalLink,
  Tag,
  CheckCircle2,
} from "lucide-react";
import DOMPurify from "isomorphic-dompurify";
import { getImageUrl } from "@/utils/imageUtils";

const DOMPURIFY_CONFIG = {
  ALLOWED_TAGS: [
    "h1", "h2", "h3", "h4", "h5", "h6", "p", "b", "i", "strong", "em", "strike",
    "code", "pre", "blockquote", "ul", "ol", "li", "a", "img", "span", "div",
    "table", "thead", "tbody", "tr", "th", "td", "br", "hr"
  ],
  ALLOWED_ATTR: ["href", "src", "alt", "title", "class", "target", "rel", "width", "height"],
};

export default function BlogPreviewModal({
  isOpen,
  onClose,
  blogData = {},
  imagePreview = null,
  readingTime = "1 min read",
  onPublish = null,
  isSubmitting = false,
}) {
  const [device, setDevice] = useState("desktop"); // 'desktop' | 'mobile'

  const sanitizedContent = useMemo(() => {
    if (!blogData.content) return "<p className='text-muted-foreground italic'>No content written yet...</p>";
    return DOMPurify.sanitize(blogData.content, DOMPURIFY_CONFIG);
  }, [blogData.content]);

  const displayImage = imagePreview || (blogData.featuredImage ? getImageUrl(blogData.featuredImage) : null);
  const tagList = Array.isArray(blogData.tags)
    ? blogData.tags
    : typeof blogData.tags === "string"
    ? blogData.tags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl h-[92vh] p-0 flex flex-col gap-0 overflow-hidden bg-background border-border/60 rounded-3xl shadow-2xl">
        {/* Modal Top Control Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-muted/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold tracking-tight text-foreground">
                Live Storefront Article Preview
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                Accurate rendering of how readers see this article on your storefront
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Viewport Device Switcher */}
            <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/50">
              <button
                type="button"
                onClick={() => setDevice("desktop")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  device === "desktop"
                    ? "bg-background text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Monitor className="size-3.5" />
                Desktop
              </button>
              <button
                type="button"
                onClick={() => setDevice("mobile")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  device === "mobile"
                    ? "bg-background text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Smartphone className="size-3.5" />
                Mobile
              </button>
            </div>

            {onPublish && (
              <Button
                type="button"
                size="sm"
                onClick={onPublish}
                disabled={isSubmitting}
                className="h-9 px-4 rounded-xl text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
              >
                <CheckCircle2 className="size-3.5" />
                Publish Live
              </Button>
            )}
          </div>
        </div>

        {/* Scrollable Preview Viewport */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-zinc-950/20 flex justify-center">
          <div
            className={`transition-all duration-300 w-full ${
              device === "mobile"
                ? "max-w-[410px] bg-background border-4 border-zinc-800 rounded-[2.5rem] shadow-2xl p-6 my-auto min-h-[720px]"
                : "max-w-3xl bg-background rounded-2xl border border-border/60 p-8 sm:p-12 shadow-sm"
            }`}
          >
            {/* Header info */}
            <header className="space-y-4 text-center">
              <Badge
                variant="outline"
                className="rounded-full px-4 py-1 border-primary/30 text-primary font-bold text-[10px] uppercase tracking-widest bg-primary/5"
              >
                {blogData.category || "LIFESTYLE"}
              </Badge>

              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-tight text-foreground">
                {blogData.title || "Untitled Article Headline"}
              </h1>

              {blogData.excerpt && (
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto italic">
                  &ldquo;{blogData.excerpt}&rdquo;
                </p>
              )}

              <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground pt-1">
                <span className="flex items-center gap-1.5">
                  <User className="size-3 text-primary" />
                  Editorial Team
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-3" />
                  {new Date().toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Clock className="size-3" />
                  {readingTime}
                </span>
              </div>
            </header>

            {/* Featured Image */}
            <div className="mt-8 mb-10">
              {displayImage ? (
                <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-border/50 shadow-md">
                  <img
                    src={displayImage}
                    alt={blogData.title || "Cover preview"}
                    className="size-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-[16/9] rounded-2xl bg-muted/40 border-2 border-dashed border-border/60 flex flex-col items-center justify-center text-muted-foreground text-xs gap-2">
                  <span>No cover image selected</span>
                </div>
              )}
            </div>

            {/* Rendered HTML Prose Content */}
            <div
              className="prose prose-zinc dark:prose-invert max-w-none text-foreground break-words leading-relaxed
                prose-headings:font-bold prose-headings:tracking-tight
                prose-p:text-muted-foreground prose-p:leading-relaxed
                prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-blockquote:rounded-r-xl prose-blockquote:p-4 prose-blockquote:italic
                prose-img:rounded-xl prose-img:shadow-md prose-img:mx-auto
                prose-a:text-primary prose-a:underline hover:prose-a:opacity-80"
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />

            {/* Tags section */}
            {tagList.length > 0 && (
              <div className="mt-12 pt-6 border-t border-border/60 flex flex-wrap items-center gap-2">
                <Tag className="size-3.5 text-muted-foreground mr-1" />
                {tagList.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-[11px] font-semibold px-3 py-1 rounded-full bg-muted/60 text-foreground"
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
