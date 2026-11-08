"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

function TimeUnit({ val, label }) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex flex-col items-center justify-center bg-accent/20 backdrop-blur-3xl border border-border/10 px-2 sm:px-4 py-2 sm:py-3 rounded-2xl min-w-[55px] sm:min-w-[75px] shadow-2xl ring-1 ring-white/5"
    >
      <span className="text-xl sm:text-3xl font-black text-foreground tracking-tighter tabular-nums leading-none">
        {String(val).padStart(2, "0")}
      </span>
      <span className="text-[7px] sm:text-[9px] font-black uppercase text-muted-foreground tracking-[0.3em] mt-1 sm:mt-1.5">
        {label}
      </span>
    </motion.div>
  );
}

export default function CountdownTimer({ targetDate, onExpire, label, className }) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      if (difference <= 0) {
        if (onExpire) onExpire();
        setTimeLeft(null);
        return false;
      } else {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
        return true;
      }
    };

    // Calculate immediately on mount
    const isActive = calculateTimeLeft();
    if (!isActive) return;

    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [targetDate, onExpire]);

  if (!timeLeft) return null;

  return (
    <div className={cn("flex flex-col items-center gap-4 sm:gap-6", className)}>
      {label && (
        <div className="flex items-center gap-3">
          <div className="h-px w-6 sm:w-10 bg-border/20" />
          <p className="text-[9px] sm:text-[11px] font-black text-accent-secondary uppercase tracking-[0.4em] whitespace-nowrap">
            {label}
          </p>
          <div className="h-px w-6 sm:w-10 bg-border/20" />
        </div>
      )}
      <div className="flex gap-2 sm:gap-4">
        <AnimatePresence mode="popLayout">
          {timeLeft.days > 0 && (
            <TimeUnit key="days" val={timeLeft.days} label="Days" />
          )}
          <TimeUnit key="hours" val={timeLeft.hours} label="Hrs" />
          <TimeUnit key="minutes" val={timeLeft.minutes} label="Min" />
          <TimeUnit key="seconds" val={timeLeft.seconds} label="Sec" />
        </AnimatePresence>
      </div>
    </div>
  );
}
