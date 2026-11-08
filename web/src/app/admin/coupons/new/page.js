"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAdminCoupons } from "@/app/admin/coupons/lib/useAdminCoupons";
import { swalToast, swalError } from "@/utils/swal";
import CouponForm from "@/app/admin/coupons/components/CouponForm";

export default function NewCouponPage() {
  const router = useRouter();
  const { createCoupon } = useAdminCoupons();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await createCoupon(data);
      swalToast("Coupon created successfully", "success");
      router.push("/admin/coupons");
    } catch (err) {
      swalError("Could Not Create Coupon", err.response?.data?.message || "Please check your inputs and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CouponForm
      title="New Coupon"
      description="Configure discount rules, spending thresholds, and expiry limits"
      submitLabel="Create Coupon"
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  );
}
