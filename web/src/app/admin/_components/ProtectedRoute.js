"use client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Loader from "@/components/common/Loader";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/authStore";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const isRoleAdmin = user?.role === "admin" || user?.role?.name === "admin" || user?.role?.name === "superadmin";
  const isAuthorized = !isLoading && isAuthenticated && (!adminOnly || isRoleAdmin);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    } else if (adminOnly && !isRoleAdmin) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, user, router, adminOnly, pathname, isRoleAdmin]);

  if (isLoading || !isAuthorized) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#fcfcfc] dark:bg-[#050505] transition-colors duration-700">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Loader />
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
