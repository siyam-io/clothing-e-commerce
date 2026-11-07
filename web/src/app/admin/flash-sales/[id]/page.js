"use client";

import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { useAdminFlashSales, useAdminFlashSale } from "@/app/admin/flash-sales/lib/useAdminFlashSales";
import { useAdminProducts } from "@/app/admin/products/lib/useAdminProducts";
import { useDebounce } from "@/hooks/useDebounce";
import Loader from "@/components/common/Loader";
import { swalToast, swalError } from "@/utils/swal";
import { Button } from "@/components/ui/button";
import { Zap, Package, Save, Loader2 } from "lucide-react";
import AdminPageContainer from "@/app/admin/_components/AdminPageContainer";
import AdminPageHeader, { AdminBackLink } from "@/app/admin/_components/AdminPageHeader";
import { AdminCard, AdminCardHeader, AdminCardTitle, AdminCardContent } from "@/app/admin/_components/AdminCard";

import FlashSaleDetailsForm from "../components/FlashSaleDetailsForm";
import FlashSaleProductSelect from "../components/FlashSaleProductSelect";

export default function FlashSaleFormPage() {
  const { id } = useParams();
  const router = useRouter();
  const isEdit = id !== "new";

  const { createFlashSale, updateFlashSale } = useAdminFlashSales();
  const { sale, isLoading: isSaleLoading } = useAdminFlashSale(id);

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 250);
  const { products: searchResults, isFetching } = useAdminProducts({
    search: debouncedSearch,
    limit: 6,
  });
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
      discount: 0,
      startImmediately: false,
      startDate: "",
      endDate: "",
      isActive: false,
    }
  });
  const watchStartImmediately = watch("startImmediately");

  const formatDateTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date - offset).toISOString().slice(0, 16);
  };

  useEffect(() => {
    if (isEdit && sale) {
      setValue("name", sale.name || "");
      setValue("description", sale.description || "");
      setValue("discount", sale.discount || 0);
      setValue("startDate", formatDateTime(sale.startDate));
      setValue("endDate", formatDateTime(sale.endDate));
      setValue("isActive", sale.isActive || false);
      setValue("startImmediately", sale.startImmediately || false);
      if (sale.products) setSelectedProducts(sale.products);
    }
  }, [isEdit, id, sale, setValue]);

  const toggleProductSelection = (product) => {
    const exists = selectedProducts.find((p) => p._id === product._id);
    if (exists) {
      setSelectedProducts((prev) => prev.filter((p) => p._id !== product._id));
    } else {
      setSelectedProducts((prev) => [...prev, product]);
    }
  };

  const onSubmit = async (data) => {
    if (selectedProducts.length === 0) {
      return swalError(
        "Products Required",
        "Please select at least one product for this flash sale.",
      );
    }

    let start = new Date(data.startDate);
    const end = new Date(data.endDate);

    if (data.startImmediately) {
      start = new Date();
    }

    if (start >= end) {
      return swalError("Invalid Timeframe", "End date must be scheduled after start date.");
    }

    setIsSaving(true);
    const payload = {
      ...data,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      products: selectedProducts.map((p) => p._id),
    };

    try {
      if (isEdit) {
        await updateFlashSale({ id, data: payload });
        swalToast("Flash sale updated successfully", "success");
      } else {
        await createFlashSale(payload);
        swalToast("Flash sale created successfully", "success");
      }
      setTimeout(() => router.push("/admin/flash-sales"), 1200);
    } catch (err) {
      swalError("Save Failed", err.response?.data?.message || "Could not save flash sale.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isEdit && isSaleLoading) {
    return (
      <div className="admin-page-container flex items-center justify-center min-h-[50vh]">
        <Loader />
      </div>
    );
  }

  return (
    <AdminPageContainer maxWidth="max-w-6xl">
      <AdminBackLink href="/admin/flash-sales" label="Back to Flash Sales" />
      <AdminPageHeader
        title={isEdit ? `Edit Sale: ${sale?.name || ""}` : "New Flash Sale"}
        description={isEdit ? "Update duration, discount percentage, and assigned products" : "Create a time-limited promotional event with automated discounts"}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Campaign Parameters (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <AdminCard>
              <AdminCardHeader>
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
                    <Zap className="size-4" />
                  </div>
                  <AdminCardTitle>Event Parameters</AdminCardTitle>
                </div>
              </AdminCardHeader>

              <AdminCardContent>
                <FlashSaleDetailsForm
                  register={register}
                  watchStartImmediately={watchStartImmediately}
                  errors={errors}
                  watch={watch}
                  setValue={setValue}
                />
              </AdminCardContent>
            </AdminCard>
          </div>

          {/* Right: Product Selector (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <AdminCard>
              <AdminCardHeader>
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Package className="size-4" />
                  </div>
                  <div>
                    <AdminCardTitle>Included Products ({selectedProducts.length})</AdminCardTitle>
                  </div>
                </div>
              </AdminCardHeader>

              <AdminCardContent>
                <FlashSaleProductSelect
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  searchResults={searchResults}
                  isFetching={isFetching}
                  selectedProducts={selectedProducts}
                  toggleProductSelection={toggleProductSelection}
                />
              </AdminCardContent>
            </AdminCard>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/flash-sales")}
            disabled={isSaving}
            className="h-10 px-5 rounded-xl text-xs font-medium"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
            className="h-10 px-6 rounded-xl text-xs font-medium gap-2 shadow-xs cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving...
              </>
            ) : (
              isEdit ? "Update Flash Sale" : "Launch Flash Sale"
            )}
          </Button>
        </div>
      </form>
    </AdminPageContainer>
  );
}
