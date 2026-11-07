import Link from "next/link";
import Image from "next/image";
import { getImageUrl } from "@/utils/imageUtils";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Clock, User } from "lucide-react";

export default function BlogListing({ posts, t, siteName = "Editorial" }) {
  const safePosts = Array.isArray(posts) ? posts : [];
  const featured = safePosts?.[0];
  const remaining = safePosts?.slice(1) || [];

  return (
    <div className="min-h-screen bg-background pt-4 lg:pt-10 pb-32">
      {/* Magazine Header */}
      <header className="pt-0 pb-10 sm:pt-0 sm:pb-14">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight uppercase">{t.journal}</h2>
              <p className="mt-2 text-sm text-muted-foreground max-w-xl">{t.narrative}</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border-foreground/10 text-muted-foreground">
                {t.protocol}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-6">
        {/* Hero */}
        {featured && (
          <article className="mb-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <Link href={`/blog/${featured.slug}`} className="relative group lg:col-span-7 rounded-2xl overflow-hidden shadow-xl">
              <div className="relative aspect-[16/9] lg:aspect-[4/3] w-full">
                <Image
                  src={getImageUrl(featured.featuredImage, 1200, 80)}
                  alt={featured.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                <div className="absolute left-6 bottom-6 right-6 text-white">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide bg-rose-600/10 text-rose-600 border-none">
                      {featured.category || "Feature"}
                    </Badge>
                    <div className="text-xs opacity-80 flex items-center gap-2"><Clock size={12} /> {featured.readingTime?.replace(/read/i, '').trim() || '6M'} Read</div>
                  </div>
                  <h3 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight italic">{featured.title}</h3>
                  <div className="mt-4 flex items-center gap-4 text-sm opacity-90">
                    <span className="flex items-center gap-2"><User size={14} /> {featured.author?.name || siteName}</span>
                    <span className="text-muted-foreground">{new Date(featured.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </Link>

            <div className="lg:col-span-5 grid grid-rows-2 gap-6">
              {remaining.slice(0, 2).map((post) => (
                <Link key={post._id} href={`/blog/${post.slug}`} className="group flex gap-4 items-center rounded-2xl overflow-hidden border border-border/5 p-3 hover:shadow-md transition-shadow">
                  <div className="relative w-32 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-accent/10">
                    <Image src={getImageUrl(post.featuredImage, 400, 70)} alt={post.title} fill className="object-cover" loading="lazy" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <h4 className="font-bold line-clamp-2">{post.title}</h4>
                      <div className="text-xs text-muted-foreground"><Clock size={12} /> {post.readingTime?.replace(/read/i, '').trim() || '4M'}</div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">{post.author?.name || siteName}</div>
                  </div>
                </Link>
              ))}
            </div>
          </article>
        )}

        {/* Article Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {remaining.slice(2).map((post) => (
            <article key={post._id} className="group rounded-2xl overflow-hidden border border-border/5 bg-card p-4">
              <Link href={`/blog/${post.slug}`} className="block">
                <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden">
                  <Image src={getImageUrl(post.featuredImage, 800, 70)} alt={post.title} fill className="object-cover" loading="lazy" />
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-rose-600/10 text-rose-600 border-none">{post.category || 'Intel'}</Badge>
                    <div className="text-xs text-muted-foreground flex items-center gap-2"><Clock size={12} /> {post.readingTime?.replace(/read/i, '').trim() || '5M'}</div>
                  </div>
                  <h5 className="mt-3 font-bold text-lg line-clamp-2">{post.title}</h5>
                  <div className="mt-3 text-xs text-muted-foreground flex items-center justify-between">
                    <span>{post.author?.name || siteName}</span>
                    <ArrowUpRight size={14} className="opacity-70 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
