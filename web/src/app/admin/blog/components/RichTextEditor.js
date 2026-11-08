"use client";

import React, { useEffect, useRef, useState, useId } from "react";
import "quill/dist/quill.snow.css";
import {
  Code,
  Eye,
  Maximize2,
  Minimize2,
  Image as ImageIcon,
  Sparkles,
  Link as LinkIcon,
  HelpCircle,
  Clock,
  FileText,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import api from "@/lib/api";
import { swalToast, swalError } from "@/utils/swal";

// Curated blog starter templates for fashion / clothing e-commerce
export const ARTICLE_TEMPLATES = [
  {
    title: "👗 Fashion Styling & Wardrobe Guide",
    description: "Structured guide with styling tips, outfit pairings, and dos/don'ts",
    html: `
      <h2>The Philosophy Behind Effortless Styling</h2>
      <p>True style isn't about following every passing trend; it's about curating silhouettes, textures, and palettes that reflect intentionality. In this guide, we break down how to elevate everyday staples into high-impact looks.</p>
      
      <blockquote>"Elegance is refusal. Choose garments that speak with quiet confidence rather than loud ornamentation."</blockquote>

      <h2>3 Core Rules for Everyday Versatility</h2>
      <ul>
        <li><strong>Balance Proportions:</strong> Pair oversized outerwear with structured trousers or tailored denim for architectural harmony.</li>
        <li><strong>Play with Textures:</strong> Combine matte heavyweight cotton with subtle ribbed knitwear or raw denim.</li>
        <li><strong>Anchor with Neutral Footwear:</strong> Ground your ensemble with minimalist sneakers or crafted leather boots.</li>
      </ul>

      <h2>Curated Outfit Pairings</h2>
      <p>Transition from daytime work sessions to evening gatherings effortlessly. Layer an unlined linen blazer over a clean relaxed tee, paired with our relaxed-tapered chinos.</p>

      <h2>Garment Care & Longevity</h2>
      <p>Preserve the rich texture and dye of your garments by washing in cold water inside-out, and hanging to air dry away from direct sunlight.</p>
    `,
  },
  {
    title: "🧵 Sustainable Fabric & Craftsmanship Focus",
    description: "Story spotlighting organic materials, weaving techniques, and eco-impact",
    html: `
      <h2>From Seed to Silhouette: The Story Behind Our Fabrics</h2>
      <p>Every garment begins with the fiber. We believe luxury and environmental stewardship must coexist. This season, our focus turns to regenerative organic cotton and artisanal weave techniques.</p>

      <blockquote>"When you know where your fabric was harvested and woven, wearing it becomes a conscious act."</blockquote>

      <h2>Why Organic Long-Staple Cotton Matters</h2>
      <p>Standard cotton relies heavily on chemical pesticides and extensive water irrigation. By sourcing certified organic fibers, we cut water consumption by up to 60% while delivering a softer, hypoallergenic hand-feel that softens with every wash.</p>

      <h2>Artisanal Construction Details</h2>
      <ul>
        <li><strong>Reinforced Flat-Felled Seams:</strong> Ensures durability that withstands decades of active wear.</li>
        <li><strong>Corozo Nut Buttons:</strong> 100% natural, biodegradable closures derived from fallen palm seeds.</li>
        <li><strong>Low-Impact Reactive Dyes:</strong> Non-toxic pigmentation that preserves water tables and prevents fading.</li>
      </ul>

      <h2>How to Care for Conscious Clothing</h2>
      <p>Extend the lifecycle of your wardrobe with gentle washing cycles, eco-friendly detergents, and periodic steaming rather than harsh iron heat.</p>
    `,
  },
  {
    title: "✨ New Season Collection Reveal",
    description: "Announcement framework for seasonal drop, colorways, and lookbook notes",
    html: `
      <h2>Introducing the New Season Capsule</h2>
      <p>We are proud to present our latest seasonal release—a cohesive collection inspired by contemporary architectural forms, earthen color palettes, and versatile transitional tailoring.</p>

      <blockquote>"Designed for the modern commuter, thinker, and creator who values form, function, and comfort in equal measure."</blockquote>

      <h2>The Palette: Earthen Hues & Clean Accents</h2>
      <p>This capsule revolves around four foundational tones: Raw Ecru, Deep Indigo, Muted Slate, and Burnt Terracotta. Each shade was formulated to harmonize seamlessly with items already in your wardrobe.</p>

      <h2>Hero Pieces in this Drop</h2>
      <ul>
        <li><strong>The Relaxed Heavyweight Overshirt:</strong> Cut from 380gsm brushed twill with deep utility chest pockets.</li>
        <li><strong>The Architectural Wide-Leg Trouser:</strong> Tailored with front pleats, hidden elastic waistband, and horn buttons.</li>
        <li><strong>The Everyday Supima Tee:</strong> Silky smooth 240gsm jersey built with a dense rib collar that never sags.</li>
      </ul>

      <h2>Availability & Limited Quantities</h2>
      <p>Available now in limited batch runs online and across our flagship stores. Free domestic shipping and complimentary exchanges on all collection orders.</p>
    `,
  },
  {
    title: "🏷️ Artisan Heritage & Behind the Seams",
    description: "Brand narrative celebrating designers, pattern-makers, and textile origins",
    html: `
      <h2>Behind the Seams: The Hands That Craft Our Pieces</h2>
      <p>Behind every stitch, seam, and hem is a craftsman dedicated to the art of precision tailoring. Take an intimate look inside our partner atelier where heritage techniques meet modern silhouettes.</p>

      <blockquote>"Machine efficiency can replicate speed, but only a seasoned artisan understands how fabric breathes and falls against the body."</blockquote>

      <h2>The Pattern-Making Process</h2>
      <p>Before a garment ever touches a sewing machine, dozens of paper patterns are drafted, draped, and fitted on diverse body forms. We obsess over fractions of a centimeter in armhole curvature and shoulder drop to ensure maximum range of motion.</p>

      <h2>Timeless Quality Over Fast Trends</h2>
      <p>In a world of disposable fashion, we stand firmly for slow, deliberate production. Each piece in our collection is produced in small numbered editions, ensuring strict quality inspection before reaching your doorstep.</p>
    `,
  },
];

export default function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Write your story here, add headers, format text, or select a template above...",
}) {
  const editorHostRef = useRef(null);
  const quillRef = useRef(null);
  const fileInputRef = useRef(null);
  const editorId = useId();

  const [isMounted, setIsMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSourceMode, setIsSourceMode] = useState(false);
  const [sourceCode, setSourceCode] = useState(value || "");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Compute live word count & reading time
  const stats = React.useMemo(() => {
    const text = (isSourceMode ? sourceCode : value || "").replace(/<[^>]*>/g, " ");
    const words = text.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const charCount = text.replace(/\s/g, "").length;
    const readingTime = `${Math.max(1, Math.ceil(wordCount / 200))} min read`;
    return { wordCount, charCount, readingTime };
  }, [value, sourceCode, isSourceMode]);

  // Initialize Quill instance client-side cleanly without duplicate toolbars
  useEffect(() => {
    setIsMounted(true);
    let isCancelled = false;

    const initQuill = async () => {
      const { default: Quill } = await import("quill");
      if (isCancelled || !editorHostRef.current) return;
      if (quillRef.current) return;

      // Wipe out any existing toolbars or child containers to guarantee a single toolbar
      editorHostRef.current.innerHTML = "";

      // Create editor target container inside host element
      const editorDiv = document.createElement("div");
      editorDiv.className = "quill-editor-target flex-1 min-h-[420px]";
      editorHostRef.current.appendChild(editorDiv);

      // Custom Toolbar
      const toolbarOptions = [
        [{ header: [2, 3, 4, false] }],
        ["bold", "italic", "underline", "strike"],
        ["blockquote", "code-block"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ align: [] }],
        ["link", "image"],
        ["clean"],
      ];

      const quill = new Quill(editorDiv, {
        theme: "snow",
        placeholder: placeholder,
        modules: {
          toolbar: toolbarOptions,
        },
      });

      // Override image handler to use direct server upload or prompt
      const toolbar = quill.getModule("toolbar");
      toolbar.addHandler("image", () => {
        if (fileInputRef.current) {
          fileInputRef.current.click();
        }
      });

      // Set initial value
      if (value) {
        quill.clipboard.dangerouslyPasteHTML(value);
      }

      // Sync changes to parent
      quill.on("text-change", () => {
        const html = quill.root.innerHTML === "<p><br></p>" ? "" : quill.root.innerHTML;
        onChange?.(html);
        setSourceCode(html);
      });

      // Ensure no orphan or duplicate toolbars remain in the DOM
      if (editorHostRef.current) {
        const toolbars = editorHostRef.current.querySelectorAll(".ql-toolbar");
        if (toolbars.length > 1) {
          for (let i = 1; i < toolbars.length; i++) {
            toolbars[i].remove();
          }
        }
      }

      quillRef.current = quill;
    };

    const host = editorHostRef.current;
    initQuill();

    return () => {
      isCancelled = true;
      if (quillRef.current) {
        quillRef.current = null;
      }
      if (host) {
        host.innerHTML = "";
      }
    };
  }, []); // Run once on mount

  // Sync incoming value prop if changed externally (e.g. from template or reset)
  useEffect(() => {
    if (quillRef.current && value !== undefined) {
      const currentHtml = quillRef.current.root.innerHTML;
      if (value !== currentHtml && (value !== "" || currentHtml !== "<p><br></p>")) {
        const sel = quillRef.current.getSelection();
        quillRef.current.clipboard.dangerouslyPasteHTML(value);
        if (sel) {
          quillRef.current.setSelection(sel);
        }
      }
    }
    setSourceCode(value || "");
  }, [value]);

  // Handle image upload from file picker
  const handleImageFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    swalToast("Uploading image to CDN...", "info");

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await api.post("/upload/blog-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const imageUrl = res.data?.url;
      if (imageUrl && quillRef.current) {
        const range = quillRef.current.getSelection(true) || { index: 0 };
        quillRef.current.insertEmbed(range.index, "image", imageUrl);
        quillRef.current.setSelection(range.index + 1);
        swalToast("Image inserted successfully", "success");
      }
    } catch (err) {
      // Fallback: convert to base64 or show error
      console.warn("Direct image upload failed, falling back to base64 preview:", err);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result && quillRef.current) {
          const range = quillRef.current.getSelection(true) || { index: 0 };
          quillRef.current.insertEmbed(range.index, "image", reader.result);
          quillRef.current.setSelection(range.index + 1);
          swalToast("Image embedded locally", "info");
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Insert a starter template
  const handleApplyTemplate = (templateHtml) => {
    if (value && value.trim().length > 30) {
      const confirmReplace = window.confirm(
        "Applying a template will replace current content. Do you want to proceed?"
      );
      if (!confirmReplace) return;
    }

    if (quillRef.current) {
      quillRef.current.clipboard.dangerouslyPasteHTML(templateHtml);
    }
    onChange?.(templateHtml);
    setSourceCode(templateHtml);
    swalToast("Starter template loaded!", "success");
  };

  // Toggle between visual WYSIWYG and HTML source code
  const toggleSourceMode = () => {
    if (isSourceMode) {
      // Switching back to visual mode: update quill with edited source code
      if (quillRef.current) {
        quillRef.current.clipboard.dangerouslyPasteHTML(sourceCode);
      }
      onChange?.(sourceCode);
      setIsSourceMode(false);
    } else {
      // Switching to HTML source code mode
      if (quillRef.current) {
        const html = quillRef.current.root.innerHTML;
        setSourceCode(html);
      }
      setIsSourceMode(true);
    }
  };

  return (
    <div
      className={`rich-editor-wrapper transition-all duration-200 ${
        isFullscreen
          ? "fixed inset-0 z-50 bg-background flex flex-col p-6 sm:p-10 overflow-hidden shadow-2xl"
          : "relative flex flex-col rounded-2xl border border-border/60 bg-card overflow-hidden shadow-2xs"
      }`}
    >
      {/* Hidden file input for image upload button */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageFileSelect}
        className="hidden"
      />

      {/* Editor Sub-Header Utility Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-muted/30 shrink-0 text-xs text-muted-foreground flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {/* Templates Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-xl text-xs font-semibold gap-1.5 border-border/60 bg-background/80 hover:bg-muted text-foreground cursor-pointer shadow-2xs"
              >
                <Sparkles className="size-3.5 text-primary" />
                <span>Templates</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-80 rounded-2xl p-2 bg-card border-border shadow-xl">
              <DropdownMenuLabel className="text-xs font-bold text-foreground px-2 py-1.5">
                Quick Content Starters
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ARTICLE_TEMPLATES.map((tmpl, idx) => (
                <DropdownMenuItem
                  key={idx}
                  onClick={() => handleApplyTemplate(tmpl.html)}
                  className="p-2.5 rounded-xl cursor-pointer hover:bg-muted/80 flex flex-col items-start gap-1 focus:bg-muted/80"
                >
                  <span className="text-xs font-bold text-foreground">{tmpl.title}</span>
                  <span className="text-[11px] text-muted-foreground leading-snug">
                    {tmpl.description}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Source HTML Mode Toggle */}
          <Button
            type="button"
            variant={isSourceMode ? "secondary" : "ghost"}
            size="sm"
            onClick={toggleSourceMode}
            className="h-8 rounded-xl text-xs font-medium gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
            title="Toggle Raw HTML Mode"
          >
            <Code className="size-3.5" />
            <span>{isSourceMode ? "Visual Editor" : "HTML Source"}</span>
          </Button>
        </div>

        {/* Right stats and Fullscreen toggle */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3 text-[11px] font-medium text-muted-foreground tabular-nums">
            <span className="flex items-center gap-1">
              <FileText className="size-3 text-muted-foreground/70" />
              {stats.wordCount.toLocaleString()} words
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="size-3 text-muted-foreground/70" />
              {stats.readingTime}
            </span>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="h-8 px-2.5 rounded-xl text-xs font-medium gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen (Esc)" : "Distraction-Free Zen Fullscreen"}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="size-3.5" />
                <span className="hidden sm:inline">Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize2 className="size-3.5" />
                <span className="hidden sm:inline">Zen Mode</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className={`relative flex-1 flex flex-col ${isFullscreen ? "overflow-y-auto" : ""}`}>
        {isSourceMode && (
          <textarea
            value={sourceCode}
            onChange={(e) => {
              setSourceCode(e.target.value);
              onChange?.(e.target.value);
            }}
            placeholder="Type or paste raw HTML here..."
            className="w-full min-h-[460px] p-6 font-mono text-xs leading-relaxed bg-background/50 border-none outline-none focus:ring-0 resize-y text-foreground"
          />
        )}
        <div
          ref={editorHostRef}
          className={`quill-editor-host flex-1 flex flex-col bg-background ${isSourceMode ? "hidden" : ""}`}
        />
      </div>

      {/* Modern Quill Theme Styling */}
      <style jsx global>{`
        /* Quill Snow Container Overrides */
        .rich-editor-wrapper .ql-toolbar.ql-snow {
          border: none !important;
          border-bottom: 1px solid var(--border) !important;
          background: color-mix(in srgb, var(--card) 90%, var(--muted) 10%) !important;
          padding: 8px 14px !important;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 2px;
        }

        /* Prevent duplicate toolbar display */
        .rich-editor-wrapper .ql-toolbar ~ .ql-toolbar,
        .quill-editor-host .ql-toolbar ~ .ql-toolbar {
          display: none !important;
        }

        .rich-editor-wrapper .ql-container.ql-snow {
          border: none !important;
          font-family: inherit !important;
          font-size: 15px !important;
          line-height: 1.8 !important;
        }

        .rich-editor-wrapper .ql-editor {
          min-height: 420px !important;
          padding: 24px 28px !important;
          color: var(--foreground) !important;
        }

        .rich-editor-wrapper .ql-editor.ql-blank::before {
          color: var(--muted-foreground) !important;
          opacity: 0.55 !important;
          font-style: normal !important;
          font-weight: 400 !important;
          left: 28px !important;
        }

        /* SVG Icons in Toolbar */
        .rich-editor-wrapper .ql-snow .ql-stroke {
          stroke: var(--foreground) !important;
          opacity: 0.75 !important;
        }

        .rich-editor-wrapper .ql-snow .ql-fill {
          fill: var(--foreground) !important;
          opacity: 0.75 !important;
        }

        .rich-editor-wrapper .ql-snow .ql-picker {
          color: var(--foreground) !important;
          font-size: 12px !important;
          font-weight: 500 !important;
        }

        .rich-editor-wrapper .ql-snow button:hover .ql-stroke,
        .rich-editor-wrapper .ql-snow .ql-picker:hover {
          stroke: var(--primary) !important;
          color: var(--primary) !important;
          opacity: 1 !important;
        }

        .rich-editor-wrapper .ql-snow button:hover .ql-fill {
          fill: var(--primary) !important;
          opacity: 1 !important;
        }

        .rich-editor-wrapper .ql-snow button.ql-active .ql-stroke {
          stroke: var(--primary) !important;
          opacity: 1 !important;
        }

        .rich-editor-wrapper .ql-snow button.ql-active .ql-fill {
          fill: var(--primary) !important;
          opacity: 1 !important;
        }

        .rich-editor-wrapper .ql-snow .ql-picker-options {
          background: var(--card) !important;
          border: 1px solid var(--border) !important;
          border-radius: 12px !important;
          padding: 6px !important;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2) !important;
        }

        .rich-editor-wrapper .ql-snow .ql-picker-item {
          color: var(--foreground) !important;
          border-radius: 6px !important;
          padding: 4px 8px !important;
        }

        .rich-editor-wrapper .ql-snow .ql-picker-item:hover {
          background: var(--muted) !important;
          color: var(--primary) !important;
        }

        /* Prose element rendering inside editor */
        .rich-editor-wrapper .ql-editor h2 {
          font-size: 1.6rem !important;
          font-weight: 800 !important;
          margin-top: 1.5rem !important;
          margin-bottom: 0.75rem !important;
          line-height: 1.3 !important;
        }

        .rich-editor-wrapper .ql-editor h3 {
          font-size: 1.3rem !important;
          font-weight: 700 !important;
          margin-top: 1.25rem !important;
          margin-bottom: 0.5rem !important;
        }

        .rich-editor-wrapper .ql-editor blockquote {
          border-left: 3px solid var(--primary) !important;
          padding-left: 1.25rem !important;
          font-style: italic !important;
          color: var(--muted-foreground) !important;
          margin: 1.25rem 0 !important;
        }

        .rich-editor-wrapper .ql-editor img {
          border-radius: 1rem !important;
          max-width: 100% !important;
          height: auto !important;
          margin: 1.5rem auto !important;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1) !important;
        }

        .rich-editor-wrapper .ql-editor a {
          color: var(--primary) !important;
          text-decoration: underline !important;
        }

        .rich-editor-wrapper .ql-editor ul,
        .rich-editor-wrapper .ql-editor ol {
          padding-left: 1.5rem !important;
          margin: 1rem 0 !important;
        }
      `}</style>
    </div>
  );
}
