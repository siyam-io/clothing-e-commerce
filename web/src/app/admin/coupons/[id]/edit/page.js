"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useAdminCoupons, useAdminCoupon } from "@/app/admin/coupons/lib/useAdminCoupons";
import Loader from "@/components/common/Loader";
import { swalToast, swalError } from "@/utils/swal";
import CouponForm from "@/app/admin/coupons/components/CouponForm";

export default function CouponEditPage() {
  const { id } = useParams();
  const router = useRouter();
  const { updateCoupon } = useAdminCoupons();
  const { data: coupon, isLoading: isCouponLoading } = useAdminCoupon(id);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await updateCoupon({ id, data });
      swalToast("Coupon updated successfully", "success");
      router.push("/admin/coupons");
    } catch (err) {
      swalError("Could Not Update Coupon", err.response?.data?.message || "Please check your inputs and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCouponLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader />
      </div>
    );
  }

  return (
    <CouponForm
      initialData={coupon}
      title="Edit Coupon"
      description="Modify discount parameters, usage limits, and active status"
      submitLabel="Save Changes"
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  );
}
