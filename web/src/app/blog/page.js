import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cookies } from "next/headers";
import { getTranslation } from "@/utils/typography/handler";
import BlogListing from "./BlogListing";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://clothing-e-commerce-web.vercel.app";

import { getSettings } from "@/lib/settings";

export async function generateMetadata() {
  const settings = await getSettings();
  const siteName = settings?.branding?.siteName || "Store";
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://clothing-e-commerce-web.vercel.app";

  let blogCount = 0;
  let categories = [];
  try {
    const res = await fetch(`${API_URL}/blogs?fields=category`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(15000)
    });
    if (res.ok) {
      const data = await res.json();
      const blogs = data.blogs || [];
      blogCount = blogs.length;
      categories = [...new Set(blogs.map(b => b.category))].filter(Boolean);
    }
  } catch (e) {
    console.error("Blog metadata fetch failed", e);
  }

  const title = `Tactical Aesthetic & Streetwear Journal | ${siteName}`;
  const description = blogCount > 0
    ? `Read our ${blogCount} exclusive streetwear journals and fabric narratives. Discover latest trends in ${categories.slice(0, 3).join(", ").toLowerCase()} and sustainable tactical fashion at ${siteName}.`
    : `Explore editorial articles and fabric narratives at the ${siteName} Journal. Latest fashion trends at ${siteName}.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/blog`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: `${SITE_URL}/blog`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    }
  };
}

export default async function BlogPage() {
  const [settings, cookieStore] = await Promise.all([
    getSettings(),
    cookies()
  ]);
  const siteName = settings?.branding?.siteName || "Store";
  const lang = cookieStore.get("vanguard-lang")?.value || "en";
  const t = getTranslation('blog', lang);

  const postsPromise = fetch(
    `${API_URL}/blogs?fields=title,slug,featuredImage,category,readingTime,author,createdAt`,
    { 
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(15000)
    }
  ).then(res => res.ok ? res.json().then(data => data.blogs || []) : []);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What is ${siteName}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `${siteName} is a premium brand focused on high-quality fabrics, ethical production, and curated apparel collections.`,
        },
      },
      {
        "@type": "Question",
        name: "How often do you release new journals?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "We release new fabric narratives and tactical aesthetic journals weekly.",
        },
      },
    ],
  };

  return (
    <main className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Suspense fallback={<BlogSkeleton />}>
        <BlogDataWrapper postsPromise={postsPromise} t={t} siteName={siteName} />
      </Suspense>
    </main>
  );
}

async function BlogDataWrapper({ postsPromise, t, siteName }) {
  const posts = await postsPromise;
  return <BlogListing posts={posts} t={t} siteName={siteName} />;
}

function BlogSkeleton() {
  return (
    <div className="container mx-auto px-6 pt-4 lg:pt-10 space-y-20">
      <div className="space-y-4">
        <Skeleton className="h-24 w-2/3 rounded-3xl" />
        <Skeleton className="h-4 w-1/3 rounded-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="space-y-6">
            <Skeleton className="h-[300px] w-full rounded-[2.5rem]" />
            <div className="space-y-3 px-2">
              <Skeleton className="h-6 w-3/4 rounded-xl" />
              <Skeleton className="h-3 w-1/2 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
