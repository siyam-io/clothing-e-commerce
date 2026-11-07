"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useSettings } from "@/hooks/useSettings";

export default function AuthLayout({ children }) {
  const { settings } = useSettings();
  const branding = settings?.branding || {};
  const siteName = branding.siteName || "Store";

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#fcfcfc] dark:bg-[#050505] transition-colors duration-700">
      {/* Left: Cinematic Brand Visual */}
      <div className="hidden lg:block relative bg-accent-primary overflow-hidden">
        <motion.div
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <img
            src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop"
            className="w-full h-full object-cover grayscale opacity-40 hover:grayscale-0 transition-all duration-1000"
            alt={`${siteName} Visual`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
        </motion.div>

        <div className="absolute bottom-20 left-20 z-10">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <h2 className="text-6xl font-black text-primary uppercase tracking-tighter italic leading-none">
              {siteName} <br /> Collective
            </h2>
            <p className="text-muted mt-4 uppercase text-[10px] font-black tracking-[0.4em]">
              {branding.siteTitle || "The Architecture of Style"}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right: Forms Area */}
      <div className="flex items-center justify-center p-6 sm:p-12 lg:p-20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 dark:opacity-40">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent-secondary rounded-full blur-[120px]"></div>
        </div>

        <div className="w-full max-w-md relative z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted hover:text-primary dark:hover:text-primary transition-colors mb-12"
          >
            Back to Home
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
