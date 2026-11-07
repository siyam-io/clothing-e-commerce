import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { Share2, Star, ShieldCheck, Truck, RotateCcw } from "lucide-react";
import StarRating from "./components/StarRating";
import ProductImageGallery from "@/app/products/[slug]/components/ProductImageGallery";
import WishlistButton from "@/app/wishlist/components/WishlistButton";
import ProductActionsClient from "@/app/products/[slug]/components/ProductActionsClient";
import ProductViewTracker from "@/app/products/[slug]/components/ProductViewTracker";
import RelatedProducts from "@/app/products/[slug]/components/RelatedProducts";
import ReviewSectionWrapper from "./components/ReviewSectionWrapper";
import ProductShareButton from "@/app/products/[slug]/components/ProductShareButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Price } from "@/components/common/Price";
import { getTranslation } from "@/utils/typography/handler";
import { GridSkeleton } from "@/components/common/Skeletons";
import { getProductDetails } from "@/app/products/[slug]/lib/productDetailsApi";
import { getSettings } from "@/lib/settings";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://clothing-e-commerce-web.vercel.app";

// Static generation for popular products at build time
export async function generateStaticParams() {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const res = await fetch(`${API_URL}/products?limit=100&isActive=true`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(15000)
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.products || []).map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([
    getProductDetails(slug),
    getSettings()
  ]);

  const siteName = settings?.branding?.siteName || "Store";
  if (!product || product.error) {
    return {
      title: `Product Not Found | ${siteName}`,
    };
  }

  const title = `${product.name} | ${siteName}`;
  const description =
    product.seo?.metaDescription ||
    product.description?.replace(/<[^>]*>/g, "").slice(0, 160) ||
    `Shop ${product.name} at ${siteName}. Premium quality apparel.`;

  const image =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images[0]
      : product.image || "";

  return {
    title,
    description,
    keywords: product.seo?.keywords || [product.name, product.category?.name, siteName].filter(Boolean),
    alternates: {
      canonical: `${SITE_URL}/products/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: `${SITE_URL}/products/${slug}`,
      siteName,
      images: image ? [{ url: image, alt: product.name }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : [],
    },
  };
}

export default async function ProductDetailsPage({ params }) {
  const { slug } = await params;

  // Parallel fetch: product + settings simultaneously (saves ~100-300ms per load)
  const [product, settings] = await Promise.all([
    getProductDetails(slug),
    getSettings()
  ]);

  if (product.error) {
    notFound();
  }

  const discountedPrice =
    product.price - (product.price * (product.discount || 0)) / 100;
  const isAvailable = product.sizes?.filter(Boolean).some((s) => s && s.stock > 0) || false;

  const cookieStore = await cookies();
  const lang = cookieStore.get("vanguard-lang")?.value || "en";
  const t = getTranslation('product_details', lang);

  const siteName = settings?.branding?.siteName || "Store";

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "image": product.images?.map((img) =>
      img.startsWith("http") ? img : `${SITE_URL}${img}`,
    ),
    "sku": product.sku || product._id,
    "gtin13": product.gtin || "",
    "brand": { "@type": "Brand", name: product.brand || siteName },
    "material": product.material || "Premium Fabric",
    "color": product.color || "",
    "offers": {
      "@type": "Offer",
      "url": `${SITE_URL}/products/${slug}`,
      "priceCurrency": "BDT",
      "price": discountedPrice,
      "priceValidUntil": "2026-12-31",
      "availability": isAvailable
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      "itemCondition": "https://schema.org/NewCondition",
      "seller": { "@type": "Organization", "name": siteName }
    }
  };

  if (product.totalReviews > 0) {
    productSchema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": product.averageRating || 0,
      "reviewCount": product.totalReviews
    };
  }

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": product.faqs && product.faqs.length > 0
      ? product.faqs.map((faq) => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
      : [
        {
          "@type": "Question",
          "name": `What is the material of ${product.name}?`,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": t.compositionDesc
          }
        },
        {
          "@type": "Question",
          "name": `How to care for ${product.name}?`,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": t.maintenanceDesc
          }
        },
        {
          "@type": "Question",
          "name": `Is the ${product.name} authentic?`,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": t.authenticityDesc
          }
        }
      ]
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
        name: product.category?.name || "Products",
        item: `${SITE_URL}/products?category=${product.category?.slug || ""}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: `${SITE_URL}/products/${slug}`,
      },
    ],
  };

  return (
    <main className="min-h-screen bg-background text-foreground transition-colors duration-700">
      <ProductViewTracker product={product} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="max-w-[1800px] mx-auto pt-4 lg:pt-10 px-4 sm:px-6 lg:px-12">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-20 xl:gap-32">
          {/* LEFT: Media Section */}
          <div className="lg:col-span-7 min-w-0 animate-in fade-in slide-in-from-left-4 duration-1000">
            <ProductImageGallery
              images={product.images}
              name={product.name}
              discount={product.discount}
              isFeatured={product.isFeatured}
            />
          </div>

          {/* RIGHT: Information Engine */}
          <div className="lg:col-span-5 py-2 lg:py-4 flex flex-col gap-8 lg:gap-10 animate-in fade-in slide-in-from-right-4 duration-1000">
            <section className="space-y-8 lg:space-y-10">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className="bg-accent-secondary text-white border-none px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
                    {product.category?.name || t.premiumArtifact}
                  </Badge>
                  {product.isFeatured && (
                    <Badge className="bg-amber-500 text-black border-none px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
                      {t.featuredProduct || "Featured Product"}
                    </Badge>
                  )}
                  {product.discount > 0 && (
                    <Badge className="bg-red-600 text-white border-none px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
                      {product.discount}% {t.off || "OFF"}
                    </Badge>
                  )}
                  {product.showReviews !== false && product.showReviews !== "false" && product.totalReviews > 0 && (
                    <div className="flex items-center gap-2 glass px-3 py-1 rounded-xl">
                      <StarRating rating={product.averageRating || 0} size="small" />
                      <span className="text-[9px] font-black text-foreground">
                        {product.totalReviews} {t.reviews}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <WishlistButton
                    product={product}
                    lang={lang}
                    className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center"
                  />
                  <ProductShareButton
                    productName={product.name}
                    productDescription={product.description}
                  />
                </div>
              </div>

              <div className="space-y-6 lg:space-y-8">
                <div className="space-y-4">
                  <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tighter uppercase italic leading-[0.9] text-gradient">
                    {product.name}
                  </h1>
                  <div className="flex items-baseline gap-3">
                    <Price
                      amount={discountedPrice.toFixed(0)}
                      className="text-2xl md:text-4xl font-black text-foreground"
                    />
                    {product.discount > 0 && (
                      <Price
                        amount={product.price.toFixed(0)}
                        lineThrough
                        className="text-lg md:text-xl font-bold text-muted-foreground/50"
                      />
                    )}
                  </div>
                </div>

                <p className="text-sm md:text-base text-muted-foreground leading-relaxed font-medium max-w-xl">
                  {product.description}
                </p>

                {/* Specifications Grid */}
                {(product.brand || product.material || product.color || product.gender || (product.specifications && Object.values(product.specifications).some(Boolean))) && (
                  <div className="space-y-4 pt-2">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-secondary">{t.specifications || "Specifications"}</h3>
                    <div className="grid grid-cols-2 gap-4 bg-muted/10 border border-border/5 rounded-2xl p-5 text-xs">
                      {product.brand && (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[8px] font-black uppercase tracking-wider text-muted-foreground">Brand</span>
                          <span className="font-bold text-foreground">{product.brand}</span>
                        </div>
                      )}
                      {product.material && (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[8px] font-black uppercase tracking-wider text-muted-foreground">Material</span>
                          <span className="font-bold text-foreground">{product.material}</span>
                        </div>
                      )}
                      {product.color && (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[8px] font-black uppercase tracking-wider text-muted-foreground">Color</span>
                          <span className="font-bold text-foreground">{product.color}</span>
                        </div>
                      )}
                      {product.gender && (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[8px] font-black uppercase tracking-wider text-muted-foreground">Gender</span>
                          <span className="font-bold text-foreground">{product.gender}</span>
                        </div>
                      )}
                      {product.specifications?.fit && (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[8px] font-black uppercase tracking-wider text-muted-foreground">Fit</span>
                          <span className="font-bold text-foreground">{product.specifications.fit}</span>
                        </div>
                      )}
                      {product.specifications?.sleeve && (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[8px] font-black uppercase tracking-wider text-muted-foreground">Sleeve</span>
                          <span className="font-bold text-foreground">{product.specifications.sleeve}</span>
                        </div>
                      )}
                      {product.specifications?.pattern && (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[8px] font-black uppercase tracking-wider text-muted-foreground">Pattern</span>
                          <span className="font-bold text-foreground">{product.specifications.pattern}</span>
                        </div>
                      )}
                      {product.specifications?.collar && (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[8px] font-black uppercase tracking-wider text-muted-foreground">Collar</span>
                          <span className="font-bold text-foreground">{product.specifications.collar}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Core USP Items */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 lg:pt-8">
                  <div className="flex flex-col items-center gap-3 text-center group/usp p-3 rounded-2xl hover:bg-accent/10 transition-all duration-500 border border-border/5">
                    <div className="w-10 h-10 rounded-xl glass flex items-center justify-center text-accent-secondary group-hover/usp:scale-110 group-hover/usp:rotate-6 transition-all duration-500 shadow-md">
                      <ShieldCheck size={18} />
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-[9px] font-black uppercase tracking-widest text-foreground">{t.authenticity}</span>
                      <span className="block text-[7px] font-medium tracking-tight text-muted-foreground/60 leading-tight">{t.authenticityDesc}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-3 text-center group/usp p-3 rounded-2xl hover:bg-accent/10 transition-all duration-500 border border-border/5">
                    <div className="w-10 h-10 rounded-xl glass flex items-center justify-center text-accent-secondary group-hover/usp:scale-110 group-hover/usp:-rotate-6 transition-all duration-500 shadow-md">
                      <Truck size={18} />
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-[9px] font-black uppercase tracking-widest text-foreground">{t.express}</span>
                      <span className="block text-[7px] font-medium tracking-tight text-muted-foreground/60 leading-tight">{t.globalTransit}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-3 text-center group/usp p-3 rounded-2xl hover:bg-accent/10 transition-all duration-500 border border-border/5">
                    <div className="w-10 h-10 rounded-xl glass flex items-center justify-center text-accent-secondary group-hover/usp:scale-110 group-hover/usp:rotate-12 transition-all duration-500 shadow-md">
                      <RotateCcw size={18} />
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-[9px] font-black uppercase tracking-widest text-foreground">{t.recovery}</span>
                      <span className="block text-[7px] font-medium tracking-tight text-muted-foreground/60 leading-tight">{t.secureReturns}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-3 text-center group/usp p-3 rounded-2xl hover:bg-accent/10 transition-all duration-500 border border-border/5">
                    <div className="w-10 h-10 rounded-xl glass flex items-center justify-center text-accent-secondary group-hover/usp:scale-110 group-hover/usp:-rotate-12 transition-all duration-500 shadow-md">
                      <Star size={18} />
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-[9px] font-black uppercase tracking-widest text-foreground">{t.expertCuration}</span>
                      <span className="block text-[7px] font-medium tracking-tight text-muted-foreground/60 leading-tight">{t.expertCurationDesc}</span>
                    </div>
                  </div>
                </div>

                <Separator className="bg-border/30" />

                {/* AEO / FAQ Section */}
                <div className="space-y-8">
                  <div className="grid sm:grid-cols-2 gap-8">
                    {product.faqs && product.faqs.length > 0 ? (
                      product.faqs.map((faq, idx) => (
                        <div key={idx} itemScope itemType="https://schema.org/Question" className="space-y-3 bg-muted/5 border border-border/5 rounded-2xl p-5 hover:bg-muted/10 transition-all">
                          <h3 itemProp="name" className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-secondary flex items-center gap-2">
                            <div className="w-1 h-1 bg-accent-secondary rounded-full" />
                            {faq.question}
                          </h3>
                          <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                            <p itemProp="text" className="text-xs text-muted-foreground leading-relaxed font-medium">
                              {faq.answer}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <>
                        <div itemScope itemType="https://schema.org/Question" className="space-y-3">
                          <h3 itemProp="name" className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-secondary flex items-center gap-2">
                            <div className="w-1 h-1 bg-accent-secondary rounded-full" />
                            {t.composition}
                          </h3>
                          <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                            <p itemProp="text" className="text-xs text-muted-foreground leading-relaxed font-medium">
                              {t.compositionDesc}
                            </p>
                          </div>
                        </div>

                        <div itemScope itemType="https://schema.org/Question" className="space-y-3">
                          <h3 itemProp="name" className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-secondary flex items-center gap-2">
                            <div className="w-1 h-1 bg-accent-secondary rounded-full" />
                            {t.maintenance}
                          </h3>
                          <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                            <p itemProp="text" className="text-xs text-muted-foreground leading-relaxed font-medium">
                              {t.maintenanceDesc}
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Actions (Client Island) */}
            <ProductActionsClient product={product} />
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 mt-20 lg:mt-32 pb-24 lg:pb-32 space-y-20 lg:space-y-32">
        {/* Reviews */}
        {product.showReviews !== false && product.showReviews !== "false" && (
          <Suspense fallback={<div className="h-40 animate-pulse bg-muted rounded-3xl" />}>
            <ReviewSectionWrapper productId={product._id} />
          </Suspense>
        )}

        {/* Related Products */}
        <Suspense fallback={<GridSkeleton count={4} />}>
          <RelatedProducts
            categorySlug={product.category?.slug}
            currentProductId={product._id}
            title={t.related}
          />
        </Suspense>
      </div>
    </main>
  );
}
