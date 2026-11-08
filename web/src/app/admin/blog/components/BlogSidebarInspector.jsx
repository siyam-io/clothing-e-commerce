"use client";

import { useState } from "react";
import {
  Globe,
  Tag,
  Search,
  CheckCircle2,
  AlertCircle,
  Star,
  Copy,
  Check,
  Edit3,
  Layers,
  FileText,
  SlidersHorizontal,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CATEGORIES = [
  { id: "LIFESTYLE", label: "Lifestyle" },
  { id: "COLLECTION", label: "Collection & Lookbook" },
  { id: "FABRIC", label: "Fabric & Craftsmanship" },
  { id: "CULTURE", label: "Culture & Editorial" },
  { id: "NEWS", label: "News & Drops" },
  { id: "GENERAL", label: "General Guides" },
];

const SUGGESTED_TAGS = [
  "Streetwear",
  "Minimalism",
  "Denim",
  "Sustainable",
  "Tailoring",
  "Lookbook",
  "Styling",
  "Winter",
];

export default function BlogSidebarInspector({
  formData,
  setFormData,
  checklist,
}) {
  const [tagInput, setTagInput] = useState("");
  const [copiedSlug, setCopiedSlug] = useState(false);
  const [isEditingSlug, setIsEditingSlug] = useState(false);

  const handleAddTag = (raw) => {
    const trimmed = raw.trim().replace(/^#/, "");
    if (!trimmed) return;
    if (!formData.tags.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, trimmed],
      }));
    }
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagToRemove),
    }));
  };

  const copyPermalink = () => {
    const url = `${window.location.origin}/blog/${formData.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(true);
    setTimeout(() => setCopiedSlug(false), 2000);
  };

  return (
    <aside className="rounded-2xl border border-border/70 bg-card/80 backdrop-blur-md overflow-hidden shadow-2xs">
      <Tabs defaultValue="general" className="w-full">
        {/* Tab Headers */}
        <div className="px-4 pt-3 pb-0 border-b border-border/60 bg-muted/20">
          <TabsList className="w-full grid grid-cols-3 bg-muted/60 p-1 rounded-xl h-9">
            <TabsTrigger
              value="general"
              className="text-xs font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-2xs"
            >
              General
            </TabsTrigger>
            <TabsTrigger
              value="seo"
              className="text-xs font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-2xs"
            >
              SEO & SERP
            </TabsTrigger>
            <TabsTrigger
              value="readiness"
              className="text-xs font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-2xs"
            >
              Readiness ({checklist?.score || 0}%)
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ============================================================ */}
        {/* TAB 1: GENERAL PUBLISHING & TAXONOMY                          */}
        {/* ============================================================ */}
        <TabsContent value="general" className="p-5 space-y-5 m-0 focus-visible:outline-none">
          {/* Publication Status Toggle */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Publication State</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, status: "PUBLISHED" }))}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  formData.status === "PUBLISHED"
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold shadow-2xs"
                    : "border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  Public / Live
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Visible to readers</p>
              </button>

              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, status: "DRAFT" }))}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  formData.status === "DRAFT"
                    ? "border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold shadow-2xs"
                    : "border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <span className="size-2 rounded-full bg-amber-500" />
                  Draft / Private
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Admin view only</p>
              </button>
            </div>
          </div>

          {/* Category Dropdown */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(val) => setFormData((prev) => ({ ...prev, category: val }))}
            >
              <SelectTrigger className="w-full h-10 rounded-xl bg-background border-border/60 text-xs font-semibold">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border bg-card">
                {CATEGORIES.map((cat) => (
                  <SelectItem
                    key={cat.id}
                    value={cat.id}
                    className="text-xs font-medium cursor-pointer"
                  >
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Permalink / Slug Config */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground">URL Slug</Label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingSlug(!isEditingSlug)}
                  className="text-[11px] text-primary hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Edit3 className="size-3" />
                  {isEditingSlug ? "Done" : "Edit"}
                </button>
                <button
                  type="button"
                  onClick={copyPermalink}
                  className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-1"
                >
                  {copiedSlug ? (
                    <Check className="size-3 text-emerald-500" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                  {copiedSlug ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            {isEditingSlug ? (
              <Input
                value={formData.slug}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, slug: e.target.value }))
                }
                placeholder="custom-article-slug"
                className="h-9 rounded-xl bg-background border-border/60 font-mono text-xs"
              />
            ) : (
              <div className="px-3 py-2 rounded-xl bg-muted/30 border border-border/50 text-[11px] font-mono text-muted-foreground truncate">
                /blog/<span className="text-foreground font-semibold">{formData.slug || "auto-generated-slug"}</span>
              </div>
            )}
          </div>

          {/* Tag Management */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Tag className="size-3.5 text-primary" />
                Tags ({formData.tags.length})
              </Label>
              <span className="text-[11px] text-muted-foreground">Press Enter to add</span>
            </div>

            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-muted/20 border border-border/50">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-background border border-border/70 text-[11px] font-semibold text-foreground shadow-2xs"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-muted-foreground hover:text-rose-500 transition-colors ml-0.5 cursor-pointer"
                      aria-label={`Remove tag ${tag}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    handleAddTag(tagInput);
                  }
                }}
                placeholder="Add tag..."
                className="h-9 rounded-xl bg-background border-border/60 text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAddTag(tagInput)}
                className="h-9 px-3 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Add
              </Button>
            </div>

            {/* Suggestions */}
            <div className="flex flex-wrap items-center gap-1 pt-0.5">
              <span className="text-[10px] text-muted-foreground mr-1">Popular:</span>
              {SUGGESTED_TAGS.slice(0, 5).map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => handleAddTag(sug)}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  +{sug}
                </button>
              ))}
            </div>
          </div>

          {/* Featured on Homepage Toggle */}
          <div className="pt-2 border-t border-border/50">
            <label className="flex items-start gap-3 p-3 rounded-xl border border-border/60 bg-muted/15 cursor-pointer hover:bg-muted/30 transition-colors">
              <Checkbox
                checked={formData.isFeatured}
                onCheckedChange={(val) =>
                  setFormData((prev) => ({ ...prev, isFeatured: Boolean(val) }))
                }
                className="mt-0.5 rounded-md"
              />
              <div>
                <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Star className="size-3.5 text-amber-500 fill-amber-500" />
                  Featured Headline Story
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Pins this story to the storefront hero section and editorial highlights.
                </p>
              </div>
            </label>
          </div>
        </TabsContent>

        {/* ============================================================ */}
        {/* TAB 2: SEO & GOOGLE SERP PREVIEW                              */}
        {/* ============================================================ */}
        <TabsContent value="seo" className="p-5 space-y-4 m-0 focus-visible:outline-none">
          {/* Simulated Google SERP Card */}
          <div className="p-3.5 rounded-xl border border-border/60 bg-muted/15 space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
              <span className="size-3.5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[8px]">
                S
              </span>
              <span className="truncate">
                yourstore.com &gt; blog &gt; {formData.slug || "article-slug"}
              </span>
            </div>
            <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 line-clamp-1">
              {formData.seo?.metaTitle || formData.title || "Your Engaging Article Title"}
            </h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
              {formData.seo?.metaDescription ||
                formData.excerpt ||
                "A compelling overview of this story highlighting the key styling tips and fabric details..."}
            </p>
          </div>

          {/* Meta Title */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-foreground">SEO Meta Title</Label>
              <span className="text-[10px] font-mono tabular-nums text-muted-foreground">
                {(formData.seo?.metaTitle || "").length} / 60
              </span>
            </div>
            <Input
              value={formData.seo?.metaTitle || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  seo: { ...prev.seo, metaTitle: e.target.value },
                }))
              }
              placeholder="Google-optimized headline"
              className="h-9 rounded-xl bg-background border-border/60 text-xs"
            />
          </div>

          {/* Meta Description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-foreground">SEO Description</Label>
              <span className="text-[10px] font-mono tabular-nums text-muted-foreground">
                {(formData.seo?.metaDescription || "").length} / 160
              </span>
            </div>
            <Textarea
              rows={3}
              value={formData.seo?.metaDescription || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  seo: { ...prev.seo, metaDescription: e.target.value },
                }))
              }
              placeholder="Search snippet summary..."
              className="rounded-xl bg-background border-border/60 text-xs resize-none"
            />
          </div>

          {/* Target Keywords */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Keywords (comma-separated)</Label>
            <Input
              value={formData.seo?.keywords || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  seo: { ...prev.seo, keywords: e.target.value },
                }))
              }
              placeholder="e.g. streetwear, fashion, denim"
              className="h-9 rounded-xl bg-background border-border/60 text-xs"
            />
          </div>
        </TabsContent>

        {/* ============================================================ */}
        {/* TAB 3: READINESS CHECKLIST                                    */}
        {/* ============================================================ */}
        <TabsContent value="readiness" className="p-5 space-y-4 m-0 focus-visible:outline-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">Readiness Score</span>
            <span className="text-xs font-bold font-mono text-primary tabular-nums">
              {checklist?.score || 0}%
            </span>
          </div>

          <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${checklist?.score || 0}%` }}
            />
          </div>

          <ul className="space-y-2.5 text-xs pt-1">
            {(checklist?.items || []).map((item) => (
              <li key={item.id} className="flex items-center gap-2.5">
                {item.pass ? (
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                ) : (
                  <AlertCircle className="size-4 text-muted-foreground/50 shrink-0" />
                )}
                <span className={item.pass ? "text-foreground font-medium" : "text-muted-foreground"}>
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </TabsContent>
      </Tabs>
    </aside>
  );
}

