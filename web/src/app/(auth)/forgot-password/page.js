"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { swalToast, swalError } from "@/utils/swal";
import { useAuthStore } from "@/store/authStore";

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuthStore();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      return swalError("Missing Email", "Please enter your email address");
    }

    setIsSubmitting(true);
    try {
      await forgotPassword(email);
      setSubmitted(true);
      swalToast("Reset link sent!", "Check your email for instructions.");
    } catch (err) {
      swalError(
        "Failed",
        err.response?.data?.message || "Something went wrong",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="w-full max-w-md mx-auto text-center">
        <div className="bg-surface dark:bg-accent-primary p-8 rounded-[3rem] shadow-2xl border border-light">
          <span className="text-6xl mb-6 block">📧</span>
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-4">
            Check Your Email
          </h2>
          <p className="text-secondary text-sm mb-8">
            We&apos;ve sent password reset instructions to {email}
          </p>
          <Link
            href="/login"
            className="inline-block bg-accent-primary text-primary  px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-widest"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-10">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-4xl md:text-5xl font-black text-primary uppercase tracking-tighter mb-3"
        >
          Reset Password
        </motion.h1>
        <p className="text-secondary text-[10px] font-black uppercase tracking-[0.3em] leading-relaxed">
          Enter your email to receive a reset link
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted ml-1">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-surface-alt dark:bg-[#0d0d0d] border border-light rounded-2xl px-5 py-4 outline-none focus:border-zinc-900 dark:focus:border-white transition-all font-bold text-sm"
            placeholder="name@example.com"
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-accent-primary text-primary  py-6 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-xl transition-all disabled:opacity-50"
        >
          {isSubmitting ? "SENDING..." : "Send Reset Link"}
        </motion.button>

        <div className="text-center">
          <Link
            href="/login"
            className="text-[10px] font-black text-secondary hover:text-primary dark:hover:text-primary transition-colors"
          >
            ← Back to Login
          </Link>
        </div>
      </form>
    </div>
  );
}
