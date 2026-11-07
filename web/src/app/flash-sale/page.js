import { Suspense } from "react";
import FlashSaleView from "@/app/flash-sale/components/FlashSaleView";
import { Skeleton } from "@/components/ui/skeleton";
import { getFlashSales } from "@/app/flash-sale/lib/flashSaleApi";

const FlashSaleSkeleton = () => (
  <div className="min-h-screen bg-background pt-32 pb-40 space-y-24">
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-12 space-y-12">
      <Skeleton className="h-[400px] w-full rounded-[4rem] bg-accent/10" />
      <div className="space-y-4">
        <Skeleton className="h-20 w-3/4 rounded-2xl" />
        <Skeleton className="h-4 w-1/4 rounded-full" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-[400px] w-full rounded-3xl" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function FlashSalePage() {
  const dataPromise = getFlashSales();

  return (
    <main className="min-h-screen bg-page transition-colors duration-700">
      <Suspense fallback={<FlashSaleSkeleton />}>
        <FlashSaleDataWrapper dataPromise={dataPromise} />
      </Suspense>
    </main>
  );
}

async function FlashSaleDataWrapper({ dataPromise }) {
  const initialData = await dataPromise;
  return <FlashSaleView initialData={initialData} />;
}


import { getSettings } from "@/lib/settings";

export async function generateMetadata() {
  const settings = await getSettings();
  const siteName = settings?.branding?.siteName || "Store";
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://clothing-e-commerce-web.vercel.app";

  let salesCount = 0;
  let activeSalesNames = [];
  try {
    const sales = await getFlashSales();
    const activeSales = (sales || []).filter(s => s.isActive);
    salesCount = activeSales.length;
    activeSalesNames = activeSales.map(s => s.name);
  } catch (e) {
    console.error("Flash sale metadata fetch failed", e);
  }

  const title = `Limited Flash Drops & Campaigns | ${siteName}`;
  const description = salesCount > 0
    ? `Shop our active exclusive flash campaigns: ${activeSalesNames.join(", ")}. Limited time streetwear drops up to 70% off at ${siteName}!`
    : `Explore limited-time exclusive drops and high-performance streetwear artifacts on flash sale at ${siteName}.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/flash-sale`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: `${SITE_URL}/flash-sale`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    }
  };
}
