"use client";

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import CountdownTimer from "@/components/common/CountdownTimer";
import { getImageUrl } from "@/utils/imageUtils";
import { useAppStore } from "@/store/appStore";
import { Badge } from "@/components/ui/badge";
import { Zap, Sparkles, ShieldAlert, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const DICTIONARY = {
  en: {
    drop: "Special Offer",
    defaultDesc: "Limited time offer. Get it before it's gone!",
    startsIn: "Starts In",
    endsIn: "Ends In",
    discountLabel: "Flash \n Discount",
    live: "LIVE NOW",
  },
  bn: {
    drop: "স্পেশাল অফার",
    defaultDesc: "সীমিত সময়ের অফার। স্টক শেষ হওয়ার আগেই লুফে নিন!",
    startsIn: "শুরু হবে",
    endsIn: "শেষ হবে",
    discountLabel: "অতিরিক্ত \n ছাড়",
    live: "লাইভ চলছে",
  },
};

export default function FlashSaleBanner({ flashSale, onExpire }) {
  const { lang, isMounted } = useAppStore();
  const ui = useMemo(() => DICTIONARY[lang] || DICTIONARY.en, [lang]);
  const isBn = lang === "bn";
  const [isActive, setIsActive] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!isMounted || !flashSale) return null;

  const startDate = new Date(flashSale.startDate);
  const endDate = new Date(flashSale.endDate);
  const hasStarted = now >= startDate;
  const hasEnded = now >= endDate;

  let status = "";
  let targetDate = null;
  let countdownLabel = "";

  if (!hasStarted) {
    status = "upcoming";
    targetDate = startDate;
    countdownLabel = ui.startsIn;
  } else if (hasStarted && !hasEnded) {
    status = "active";
    targetDate = endDate;
    countdownLabel = ui.endsIn;
    if (!isActive) setIsActive(true);
  } else {
    status = "ended";
  }

  const handleExpire = () => {
    if (status === "upcoming") {
      window.location.reload(); 
    } else if (status === "active") {
      setIsActive(false);
      if (onExpire) onExpire();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, ease: "easeOut" }}
      className="relative bg-black border border-white/5 rounded-[3rem] sm:rounded-[5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] group transition-all duration-1000"
    >
      {/* 🔮 Dynamic Brand Aura */}
      <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-accent-secondary/10 via-transparent to-transparent pointer-events-none" />
      <div className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] bg-accent-secondary/5 rounded-full blur-[200px] animate-pulse" />
      
      {flashSale.bannerImage && (
        <div className="absolute inset-0 z-0">
          <Image
            src={flashSale.bannerImage}
            alt={flashSale.name}
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b lg:bg-gradient-to-r from-black via-black/90 lg:via-black/70 to-transparent" />
        </div>
      )}
 
      <div className="relative z-10 p-8 sm:p-12 lg:p-20 flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-20">
        <div className="text-center lg:text-left max-w-3xl w-full space-y-8 sm:space-y-12">
          {/* Cybernetic Status Indicator */}
          <div className="flex flex-col items-center lg:items-start">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-4 bg-white/5 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 shadow-2xl"
            >
               <div className={cn(
                 "w-2.5 h-2.5 rounded-full",
                 status === "active" ? "bg-accent-secondary animate-ping shadow-[0_0_20px_rgba(244,63,94,1)]" : "bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,1)]"
               )} />
               <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-[0.5em] text-white/80">
                 {status === "active" ? ui.live : ui.drop}
               </span>
            </motion.div>
          </div>
 
          <div className="space-y-4 sm:space-y-8">
            <h2 className={cn(
              "text-3xl sm:text-6xl lg:text-7xl font-black text-white uppercase italic leading-[0.9] drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]",
              isBn ? "tracking-tight" : "tracking-tighter"
            )}>
              {flashSale.name}
            </h2>
 
            <p className="text-white/60 text-xs sm:text-lg font-medium tracking-wide leading-relaxed max-w-xl mx-auto lg:mx-0">
              {flashSale.description || ui.defaultDesc}
            </p>
          </div>
 
          <div className="flex items-center justify-center lg:justify-start gap-6 sm:gap-10 pt-4">
            <div className="relative">
               <div className="absolute -inset-4 bg-accent-secondary/20 blur-2xl rounded-full animate-pulse" />
               <span className="relative text-5xl sm:text-7xl font-black text-white tracking-tighter leading-none italic">
                -{flashSale.discount}%
               </span>
            </div>
            <div className="h-12 sm:h-20 w-px bg-white/10" />
            <div className="space-y-3 text-left">
               <div className="flex items-center gap-2">
                  <Sparkles className="text-accent-secondary w-5 h-5 sm:w-7 sm:h-7" />
                  <Cpu className="text-white/20 w-4 h-4 sm:w-6 sm:h-6" />
               </div>
               <span className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.3em] text-white/40 whitespace-pre-line leading-tight block">
                {ui.discountLabel}
               </span>
            </div>
          </div>
        </div>
 
        {/* Chronos Unit (Countdown) */}
        <div className="w-full lg:w-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative group/countdown"
          >
            <div className="absolute -inset-6 bg-accent-secondary/15 rounded-[3rem] sm:rounded-[4rem] blur-3xl opacity-0 group-hover/countdown:opacity-100 transition-opacity duration-1000" />
            <div className="relative bg-white/5 backdrop-blur-3xl border border-white/10 p-8 sm:p-14 rounded-[2.5rem] sm:rounded-[3.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.8)] flex flex-col items-center">
              {targetDate && (
                <CountdownTimer
                  targetDate={targetDate}
                  onExpire={handleExpire}
                  label={countdownLabel}
                  className="!text-white"
                />
              )}
              {status === "ended" && (
                <div className="text-center py-6">
                  <ShieldAlert className="text-white/20 mx-auto mb-4 animate-pulse" size={48} />
                  <p className="text-[10px] sm:text-[12px] font-black text-white/40 uppercase tracking-[0.6em]">
                    Sequence Terminated
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
      {/* Scanner Effect */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-accent-secondary/50 to-transparent opacity-30 animate-scan pointer-events-none" />
    </motion.div>
  );
}
