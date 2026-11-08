"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/store/appStore";
import { useAuthStore } from "@/store/authStore";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SupportChat from "@/app/live-support/components/SupportChat";

const emptySubscribe = () => () => {};

export default function ClientWrapper({ children }) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const pathname = usePathname();
  const { initApp, lang, settings } = useAppStore();
  const { checkSession, isLoading } = useAuthStore();
  const branding = settings?.branding || {};

  const isAdminPage = pathname.startsWith("/admin");

  useEffect(() => {
    initApp();
    checkSession();
  }, [initApp, checkSession]);

  if (!mounted || isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-surface">
        <div className="animate-pulse text-primary font-black text-4xl italic tracking-tighter uppercase">
          {branding.siteName || "Store"}
        </div>
      </div>
    );
  }

  return (
    <>
      {!isAdminPage && <Navbar />}
      <main className={!isAdminPage ? "min-h-screen" : ""}>{children}</main>
      {!isAdminPage && <Footer lang={lang} />}
      {!isAdminPage && <SupportChat />}
    </>
  );
}
