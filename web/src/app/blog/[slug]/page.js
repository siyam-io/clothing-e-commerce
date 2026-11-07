import { notFound } from "next/navigation";
import BlogDetails from "./BlogDetails";
import { getSettings } from "@/lib/settings";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://clothing-e-commerce-web.vercel.app";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    const [res, settings] = await Promise.all([
      fetch(`${API_URL}/blogs/${slug}`, { next: { revalidate: 3600 } }),
      getSettings(),
    ]);

    if (!res.ok) throw new Error("Blog not found");
    const blog = await res.json();
    const siteName = settings?.branding?.siteName || "Store";

    const imageUrl = blog.featuredImage?.startsWith("http")
      ? blog.featuredImage
      : `${SITE_URL}${blog.featuredImage}`;

    const seoTitle = blog.seo?.metaTitle || `${blog.title} | ${siteName} Journal`;
    const seoDescription = blog.seo?.metaDescription || blog.excerpt?.slice(0, 160) || blog.title;
    const seoKeywords = blog.seo?.keywords || blog.tags || [];

    return {
      title: seoTitle,
      description: seoDescription,
      keywords: seoKeywords,
      openGraph: {
        title: blog.seo?.metaTitle || blog.title,
        description: seoDescription,
        images: [{ url: imageUrl, width: 1200, height: 630, alt: blog.title }],
        type: "article",
        publishedTime: blog.createdAt,
        authors: [blog.author?.name || `${siteName} Team`],
        tags: [blog.category, ...seoKeywords],
      },
      twitter: {
        card: "summary_large_image",
        title: blog.seo?.metaTitle || blog.title,
        description: seoDescription,
        images: [imageUrl],
        "twitter:label2": "Reading Time",
        "twitter:data2": blog.readingTime,
      },
      alternates: {
        canonical: `${SITE_URL}/blog/${slug}`,
      },
    };
  } catch (error) {
    const settings = await getSettings();
    const siteName = settings?.branding?.siteName || "Store";
    return {
      title: `Blog Not Found | ${siteName}`,
    };
  }
}

export default async function BlogPage({ params }) {
  const { slug } = await params;
  let blog = null;
  let relatedPosts = [];

  try {
    const res = await fetch(`${API_URL}/blogs/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      if (res.status === 404) notFound();
      throw new Error(`HTTP ${res.status}`);
    }
    blog = await res.json();
    // fetch related posts by category (exclude current slug)
    try {
      const relatedRes = await fetch(`${API_URL}/blogs?category=${encodeURIComponent(blog.category || '')}&fields=title,slug,featuredImage,category,readingTime,author,createdAt&limit=6`, { next: { revalidate: 3600 } });
      if (relatedRes.ok) {
        const relatedData = await relatedRes.json();
        const relatedList = Array.isArray(relatedData.blogs) ? relatedData.blogs : (Array.isArray(relatedData) ? relatedData : []);
        relatedPosts = relatedList.filter(p => p.slug !== slug).slice(0,4);
      }
    } catch (e) {
      console.error('Related posts fetch failed', e);
    }
  } catch (err) {
    console.error("Blog fetch error:", err);
    notFound();
  }

  const settings = await getSettings();
  const siteName = settings?.branding?.siteName || "Store";

  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: blog.title,
    image: blog.featuredImage?.startsWith("http")
      ? blog.featuredImage
      : `${SITE_URL}${blog.featuredImage}`,
    datePublished: blog.createdAt,
    dateModified: blog.updatedAt || blog.createdAt,
    author: {
      "@type": "Person",
      name: blog.author?.name || `${siteName} Team`,
    },
    publisher: {
      "@type": "Organization",
      name: siteName,
      logo: {
        "@type": "ImageObject",
        url: settings?.branding?.logo ? `${SITE_URL}${settings.branding.logo}` : `${SITE_URL}/logo.png`,
      },
    },
    description: blog.seo?.metaDescription || blog.excerpt || blog.title,
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${SITE_URL}/blog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: blog.title,
        item: `${SITE_URL}/blog/${slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <BlogDetails blog={blog} relatedPosts={relatedPosts} siteUrl={SITE_URL} siteName={siteName} />
    </>
  );
}
