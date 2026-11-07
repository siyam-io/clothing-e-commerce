"use client";

import { useState, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { getImageUrl } from "@/utils/imageUtils";
import { Calendar, User, Clock, ArrowLeft, CheckCircle, Activity, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import DOMPurify from "isomorphic-dompurify";

const DOMPURIFY_CONFIG = {
  ALLOWED_TAGS: [
    "h1", "h2", "h3", "h4", "h5", "h6", "p", "b", "i", "strong", "em", "strike",
    "code", "pre", "blockquote", "ul", "ol", "li", "a", "img", "span", "div",
    "table", "thead", "tbody", "tr", "th", "td", "br", "hr"
  ],
  ALLOWED_ATTR: ["href", "src", "alt", "title", "class", "target", "rel", "width", "height"],
  ALLOW_DATA_ATTR: false,
  ADD_ATTR: ["target", "rel"],
  FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input", "textarea", "style"],
  FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur"]
};

export default function BlogDetails({ blog, relatedPosts = [], siteUrl = '', siteName = '' }) {
  const [copied, setCopied] = useState(false);
  const permalink = `${siteUrl.replace(/\/$/, '')}/blog/${blog?.slug}`;

  const copyPermalink = useCallback(async () => {
    if (!navigator?.clipboard) return;
    try {
      await navigator.clipboard.writeText(permalink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Copy failed', e);
    }
  }, [permalink]);

  const blogContent = blog?.content;
  const sanitizedContent = useMemo(() => {
    if (!blogContent) return "";
    const cleaned = DOMPurify.sanitize(blogContent, DOMPURIFY_CONFIG);
    return cleaned.replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"/gi, (match) => {
      if (!match.includes('rel=')) {
        return `${match} rel="noopener noreferrer" target="_blank"`;
      }
      return match;
    });
  }, [blogContent]);

  if (!blog) return null;

  return (
    <div className="min-h-screen bg-background pt-4 lg:pt-10 pb-20">
      <div className="max-w-screen-xl mx-auto px-6 relative">
        {/* 🔙 Back Navigation */}
        <div className="pt-0">
          <Link
            href="/blog"
            className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-rose-600 transition-colors group"
          >
            <ArrowLeft size={12} className="transition-transform group-hover:-translate-x-1" />
            Back to Journal
          </Link>
        </div>

        <article>
          {/* 📰 Blog Header */}
          <header className="pt-8 pb-10 sm:pt-10 sm:pb-12 text-center space-y-6">
            <div className="space-y-6">
              <Badge variant="outline" className="rounded-full px-6 py-1.5 border-rose-500/30 text-rose-500 font-black text-[10px] uppercase tracking-[0.2em] bg-rose-500/5">
                {blog.category}
              </Badge>
              
              <h1 className="text-4xl md:text-7xl font-black uppercase italic tracking-tighter leading-[0.9] text-foreground">
                {blog.title}
              </h1>

              <div className="flex flex-wrap items-center justify-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground pt-2">
                <div className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-rose-500" />
                  <span>{blog.author?.name || `${siteName || "Editorial"} Team`}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <span>{new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <span>{blog.readingTime || "5 MIN READ"}</span>
                </div>
              </div>

              {/* Share buttons */}
              <div className="mt-4 flex items-center justify-center gap-3">
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(permalink)}&text=${encodeURIComponent(blog.title)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-md hover:bg-muted/5"
                  aria-label="Share on Twitter"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69a4.3 4.3 0 0 0 1.88-2.37 8.59 8.59 0 0 1-2.72 1.04 4.28 4.28 0 0 0-7.3 3.9A12.14 12.14 0 0 1 3.15 4.6a4.28 4.28 0 0 0 1.32 5.72c-.66-.02-1.28-.2-1.82-.5v.05a4.28 4.28 0 0 0 3.43 4.19c-.3.08-.61.12-.94.12-.23 0-.46-.02-.68-.06a4.29 4.29 0 0 0 4 2.97A8.58 8.58 0 0 1 2 19.54a12.11 12.11 0 0 0 6.56 1.92c7.88 0 12.2-6.53 12.2-12.2v-.56A8.66 8.66 0 0 0 22.46 6z" fill="currentColor" />
                  </svg>
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(permalink)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-md hover:bg-muted/5"
                  aria-label="Share on Facebook"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground">
                    <path d="M22 12C22 6.477 17.523 2 12 2S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879v-6.99H7.897v-2.89h2.541V9.845c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.242 0-1.63.771-1.63 1.562v1.875h2.773l-.443 2.89h-2.33v6.99C18.343 21.128 22 16.991 22 12z" fill="currentColor"/>
                  </svg>
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(permalink)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-md hover:bg-muted/5"
                  aria-label="Share on LinkedIn"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground">
                    <path d="M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM0 8.98h5V24H0V8.98zM8.5 8.98h4.79v2.06h.07c.67-1.27 2.31-2.6 4.75-2.6 5.08 0 6.01 3.34 6.01 7.68V24h-5v-7.03c0-1.68-.03-3.85-2.35-3.85-2.36 0-2.72 1.84-2.72 3.74V24h-5V8.98z" fill="currentColor"/>
                  </svg>
                </a>
                <button onClick={copyPermalink} className="p-2 rounded-md hover:bg-muted/5" aria-label="Copy permalink">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v12h2V3h12V1zM20 5H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h12v14z" fill="currentColor"/>
                  </svg>
                </button>
                {copied && <span className="text-xs text-muted-foreground ml-2">Copied!</span>}
              </div>
            </div>
          </header>

          {/* 🖼️ Featured Image */}
          <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-[2rem] overflow-hidden mb-24 shadow-2xl shadow-black/20 group">
            <Image
              src={getImageUrl(blog.featuredImage)}
              alt={blog.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
          </div>

          {/* 📝 Main Content */}
          <div className="max-w-3xl mx-auto">
            <div 
              className="prose prose-invert prose-lg max-w-none break-words overflow-hidden
                prose-headings:font-black prose-headings:uppercase prose-headings:italic prose-headings:tracking-tighter
                prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:text-lg
                prose-strong:text-foreground prose-strong:font-black
                prose-blockquote:border-l-rose-500 prose-blockquote:bg-rose-500/5 prose-blockquote:rounded-2xl prose-blockquote:p-8 prose-blockquote:italic prose-blockquote:text-2xl prose-blockquote:font-bold
                prose-img:rounded-[2rem] prose-img:shadow-2xl prose-img:mx-auto
                prose-a:text-rose-500 prose-a:no-underline hover:prose-a:underline
                prose-pre:bg-zinc-900/50 prose-pre:border prose-pre:border-border/10 prose-pre:rounded-[2rem] prose-pre:p-8
                prose-code:text-rose-400 prose-code:bg-rose-400/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none"
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />

            {/* 🔚 Footer Info */}
            <Separator className="my-20 bg-border/10" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-accent relative border-2 border-border/10">
                  <Image
                    src={getImageUrl(blog.author?.avatar)}
                    alt={blog.author?.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-1">Written By</p>
                  <p className="text-xl font-black uppercase italic">{blog.author?.name}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 justify-end">
                {typeof blog.tags === 'string' ? blog.tags.split(',').map((tag) => (
                  <Badge key={tag} variant="secondary" className="rounded-full px-4 py-1 font-bold text-[9px] uppercase tracking-widest bg-accent/50 hover:bg-accent transition-colors cursor-default">
                    #{tag.trim()}
                  </Badge>
                )) : Array.isArray(blog.tags) ? blog.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="rounded-full px-4 py-1 font-bold text-[9px] uppercase tracking-widest bg-accent/50 hover:bg-accent transition-colors cursor-default">
                    #{tag}
                  </Badge>
                )) : null}
              </div>
            </div>

              {/* Related posts */}
              {Array.isArray(relatedPosts) && relatedPosts.length > 0 && (
                <section className="mt-20">
                  <h3 className="text-xl font-extrabold uppercase mb-6">Related Posts</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {relatedPosts.map((rp) => (
                      <Link key={rp._id || rp.slug} href={`/blog/${rp.slug}`} className="group block rounded-xl overflow-hidden border border-border/5 bg-card">
                        <div className="relative aspect-[4/3] w-full">
                          <Image src={getImageUrl(rp.featuredImage, 600, 70)} alt={rp.title} fill className="object-cover" loading="lazy" />
                        </div>
                        <div className="p-3">
                          <div className="text-xs text-muted-foreground mb-2">{rp.category}</div>
                          <h4 className="font-bold line-clamp-2">{rp.title}</h4>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Integrity Footer */}
          </div>
        </article>
      </div>
    </div>
  );
}
