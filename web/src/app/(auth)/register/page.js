"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { swalToast, swalError } from "@/utils/swal";
import { useAuthStore } from "@/store/authStore";
import { useAppStore } from "@/store/appStore";
import { getTranslation } from "@/utils/typography/handler";
import { Eye, EyeOff } from "lucide-react";
import SocialAuthButtons from "@/components/common/SocialAuthButtons";

export default function RegisterPage() {
  const { register } = useAuthStore();
  const { lang, settings } = useAppStore();
  const siteName = settings?.branding?.siteName || "Store";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = useMemo(() => getTranslation('auth', lang), [lang]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || !password) {
      return swalError(t.missingFields, lang === 'bn' ? "দয়া করে সব তথ্য পূরণ করুন।" : "Please fill in all fields");
    }

    if (password.length < 6) {
      return swalError(
        lang === 'bn' ? "দুর্বল পাসওয়ার্ড" : "Weak Password",
        lang === 'bn' ? "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।" : "Password must be at least 6 characters",
      );
    }

    setIsSubmitting(true);
    try {
      const data = await register(name, email, password);

      if (data.token) {
        swalToast(
          t.identityEstablished,
          lang === 'bn' ? `${siteName}-এ স্বাগতম` : `Welcome to ${siteName}`,
        );
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
      } else {
        swalToast(
          t.identityEstablished,
          lang === 'bn' ? "আপনার অ্যাকাউন্ট ভেরিফাই করতে ইমেইল চেক করুন।" : "Please check your email to verify your account.",
        );
        setTimeout(() => {
          window.location.href = "/login";
        }, 3000);
      }
    } catch (err) {
      swalError(
        t.establishmentFailed,
        err.response?.data?.message || (lang === 'bn' ? "কিছু ভুল হয়েছে।" : "Something went wrong"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 sm:p-12 bg-background border border-border/10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent-secondary/0 via-accent-secondary/50 to-accent-secondary/0" />

      <div className="mb-10">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-3xl font-black text-foreground uppercase tracking-tighter mb-3 italic"
        >
          {t.registerTitle}
        </motion.h1>
        <p className="text-muted-foreground text-[9px] font-black uppercase tracking-[0.4em] leading-relaxed opacity-60">
          {t.registerSub}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">
            {t.nameLabel}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full bg-accent/10 border border-border/5 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-accent-secondary/30 transition-all font-bold text-sm"
            placeholder="CODENAME"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">
            {t.emailLabel}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-accent/10 border border-border/5 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-accent-secondary/30 transition-all font-bold text-sm"
            placeholder="name@example.com"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">
            {t.passwordLabel}
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-accent/10 border border-border/5 rounded-2xl pl-6 pr-14 py-4 outline-none focus:ring-2 focus:ring-accent-secondary/30 transition-all font-bold text-sm"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground/45 hover:text-foreground transition-colors cursor-pointer p-1"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-foreground text-background py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl hover:bg-accent-secondary hover:text-white transition-all disabled:opacity-50 mt-4"
        >
          {isSubmitting ? t.signingUp : t.signUp}
        </motion.button>
      </form>

      <SocialAuthButtons onSuccessRedirect={() => window.location.href = "/"} />

      <div className="mt-10 pt-8 border-t border-border/10 text-center">
        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest opacity-60">
          {t.haveAccount}{" "}
          <Link
            href="/login"
            className="text-foreground hover:text-accent-secondary border-b border-border/20 pb-0.5 ml-2 transition-colors"
          >
            {t.loginNow}
          </Link>
        </p>
      </div>
    </div>
  );
}
