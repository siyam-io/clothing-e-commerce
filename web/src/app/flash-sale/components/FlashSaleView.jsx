"use client";

import { useMemo, useState, useEffect } from "react";
import { useAppStore } from "@/store/appStore";
import { useFlashSales } from "@/app/flash-sale/lib/useFlashSale";
import { Skeleton } from "@/components/ui/skeleton";
import ActiveSalesSection from "@/app/flash-sale/components/ActiveSalesSection";
import UpcomingSalesSection from "@/app/flash-sale/components/UpcomingSalesSection";

const DICTIONARY = {
  en: {
    emptyTitle: "The Vault is Closed",
    explore: "Explore Collection",
    activeTitle: "Live Drops Active",
    upcomingTitle: "Upcoming Sequences",
    viewDetails: "Inspect Drop",
    liveNow: "Live",
    startsOn: "Sequence Initiation",
    allArtifacts: "All Artifacts",
  },
  bn: {
    emptyTitle: "কালেকশনটি বন্ধ আছে",
    explore: "কালেকশন দেখুন",
    activeTitle: "অফারটি চলছে",
    upcomingTitle: "শীঘ্রই আসছে",
    viewDetails: "ড্রপ দেখুন",
    liveNow: "লাইভ চলছে",
    startsOn: "শুরু হবে",
    allArtifacts: "সব প্রোডাক্ট",
  },
};

export default function FlashSaleView({ initialData }) {
  const { lang } = useAppStore();
  const ui = useMemo(() => DICTIONARY[lang] || DICTIONARY.en, [lang]);
  const { allActiveSales, isLoading } = useFlashSales();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const sales = allActiveSales?.length > 0 ? allActiveSales : initialData;

  const { activeSales, upcomingSales } = useMemo(() => {
    if (!sales || !Array.isArray(sales))
      return { activeSales: [], upcomingSales: [] };
    const active = sales.filter((s) => new Date(s.startDate) <= now && new Date(s.endDate) > now);
    const upcoming = sales.filter((s) => new Date(s.startDate) > now);
    return { activeSales: active, upcomingSales: upcoming };
  }, [sales, now]);

  if (isLoading && !initialData) {
    return (
      <div className="min-h-screen bg-background pt-32 pb-40 space-y-24">
        <div className="max-w-screen-2xl mx-auto px-6 sm:px-12 space-y-12">
          <Skeleton className="h-[400px] sm:h-[600px] w-full rounded-[4rem] bg-accent/10" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-10">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-[400px] w-full rounded-3xl" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 sm:pb-40 pt-20 sm:pt-32 space-y-20 sm:space-y-40 overflow-hidden">
      <ActiveSalesSection 
        activeSales={activeSales} 
        upcomingSalesLength={upcomingSales.length} 
        ui={ui} 
      />
      <UpcomingSalesSection 
        upcomingSales={upcomingSales} 
        ui={ui} 
      />
    </div>
  );
}
