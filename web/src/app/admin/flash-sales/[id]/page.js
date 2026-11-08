"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAdminFlashSales, useAdminFlashSale } from "@/app/admin/flash-sales/lib/useAdminFlashSales";
import { useAdminCategories } from "@/app/admin/categories/lib/useAdminCategories";
import { useDebounce } from "@/hooks/useDebounce";
import { swalToast, swalError } from "@/utils/swal";
import Loader from "@/components/common/Loader";
import { playBeep, playSuccessChime, playErrorSound } from "@/app/admin/orders/lib/posAudio";

// Modular Flash Sale POS Components
import FlashSalePosHeader from "../components/FlashSalePosHeader";
import FlashSaleProductCatalog from "../components/FlashSaleProductCatalog";
import FlashSaleCampaignRegister from "../components/FlashSaleCampaignRegister";

function FlashSalePosContent() {
  const { id } = useParams();
  const router = useRouter();
  const isEdit = id !== "new";

  const { createFlashSale, updateFlashSale } = useAdminFlashSales();
  const { sale, isLoading: isSaleLoading } = useAdminFlashSale(id);
  const { categories } = useAdminCategories();

  const searchInputRef = useRef(null);

  // 1. Campaign Details State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [discount, setDiscount] = useState(20);
  const [startImmediately, setStartImmediately] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Set default end date to 48 hours from now for convenience in new mode
  useEffect(() => {
    if (!isEdit && !endDate) {
      const defaultEnd = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const offset = defaultEnd.getTimezoneOffset() * 60000;
      setEndDate(new Date(defaultEnd - offset).toISOString().slice(0, 16));
    }
  }, [isEdit, endDate]);

  // Pre-fill form when editing an existing campaign
  useEffect(() => {
    if (isEdit && sale) {
      setName(sale.name || "");
      setDescription(sale.description || "");
      setDiscount(sale.discount || 20);
      setIsActive(Boolean(sale.isActive));
      setStartImmediately(Boolean(sale.startImmediately));

      const formatIsoToLocal = (isoString) => {
        if (!isoString) return "";
        const d = new Date(isoString);
        const offset = d.getTimezoneOffset() * 60000;
        return new Date(d - offset).toISOString().slice(0, 16);
      };

      if (sale.startDate) setStartDate(formatIsoToLocal(sale.startDate));
      if (sale.endDate) setEndDate(formatIsoToLocal(sale.endDate));
      if (sale.products && Array.isArray(sale.products)) {
        setSelectedProducts(sale.products);
      }
    }
  }, [isEdit, sale]);

  // Set dynamic window title
  useEffect(() => {
    if (isEdit) {
      document.title = `Edit Flash Sale: ${name || "Campaign"} | Admin POS`;
    } else {
      document.title = "Flash Sale POS Terminal | Admin";
    }
  }, [isEdit, name]);

  // 2. Product Catalog Filtering & State
  const [productSearch, setProductSearch] = useState("");
  const debouncedSearch = useDebounce(productSearch, 250);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["adminProductsForFlashSale", { search: debouncedSearch, category: selectedCategory, limit: 60 }],
    queryFn: async () => {
      const { data } = await api.get("/admin/products", {
        params: {
          search: debouncedSearch || undefined,
          category: selectedCategory !== "all" ? selectedCategory : undefined,
          limit: 60,
          isActive: "true",
        },
      });
      return data;
    },
    staleTime: 1000 * 60 * 2,
  });

  const products = productsData?.products || [];

  // 3. Selection Handlers
  const handleToggleProduct = (product) => {
    setSelectedProducts((prev) => {
      const exists = prev.some((p) => p._id === product._id);
      if (exists) {
        return prev.filter((p) => p._id !== product._id);
      }
      return [...prev, product];
    });
  };

  const handleBatchToggleProducts = (isAdd, targets) => {
    if (isAdd) {
      // Add all from targets that are not already in selectedProducts
      const currentIds = new Set(selectedProducts.map((p) => p._id));
      const toAdd = targets.filter((p) => !currentIds.has(p._id));
      setSelectedProducts((prev) => [...prev, ...toAdd]);
    } else {
      // Remove all whose IDs are in targets (targets is a Set of IDs)
      setSelectedProducts((prev) => prev.filter((p) => !targets.has(p._id)));
    }
  };

  const handleRemoveProduct = (product) => {
    setSelectedProducts((prev) => prev.filter((p) => p._id !== product._id));
    playBeep();
  };

  const handleClearProducts = () => {
    setSelectedProducts([]);
    playBeep();
  };

  // 4. Save & Launch Flash Sale
  const handleSubmit = async () => {
    if (!name.trim()) {
      playErrorSound();
      return swalError("Campaign Name Required", "Please enter a descriptive campaign name.");
    }

    const numDiscount = Number(discount);
    if (!numDiscount || numDiscount < 1 || numDiscount > 100) {
      playErrorSound();
      return swalError("Invalid Discount", "Please specify a discount percentage between 1% and 100%.");
    }

    if (selectedProducts.length === 0) {
      playErrorSound();
      return swalError("Products Required", "Please select at least one product for this flash sale.");
    }

    if (!endDate) {
      playErrorSound();
      return swalError("End Date Required", "Please set an end date and time for this flash sale.");
    }

    let start = startImmediately ? new Date() : new Date(startDate);
    const end = new Date(endDate);

    if (!startImmediately && isNaN(start.getTime())) {
      playErrorSound();
      return swalError("Invalid Start Date", "Please set a valid start date and time.");
    }

    if (isNaN(end.getTime()) || start >= end) {
      playErrorSound();
      return swalError("Invalid Timeframe", "Campaign end date must be scheduled after the start date.");
    }

    setIsSaving(true);
    const payload = {
      name: name.trim(),
      description: description.trim(),
      discount: numDiscount,
      startImmediately,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      isActive,
      products: selectedProducts.map((p) => p._id),
    };

    try {
      if (isEdit) {
        await updateFlashSale({ id, data: payload });
        playSuccessChime();
        swalToast("Flash sale updated successfully!", "success");
      } else {
        await createFlashSale(payload);
        playSuccessChime();
        swalToast("Flash sale launched successfully!", "success");
      }
      setTimeout(() => router.push("/admin/flash-sales"), 1000);
    } catch (err) {
      playErrorSound();
      swalError("Save Failed", err.response?.data?.message || "Could not save flash sale.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isEdit && isSaleLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center">
        <Loader />
        <p className="mt-4 text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">
          Loading Flash Campaign #{id?.slice(-8).toUpperCase()} into POS...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Top POS Header */}
      <FlashSalePosHeader
        selectedCount={selectedProducts.length}
        onResetProducts={handleClearProducts}
        isEdit={isEdit}
        saleName={name}
      />

      {/* Main Dual-Pane Terminal Workspace */}
      <main className="flex-1 p-3 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1920px] mx-auto w-full overflow-hidden">
        {/* Left Side: Product Catalog & Visual Filter Grid (7 Cols) */}
        <section className="lg:col-span-7 flex flex-col h-[calc(100vh-85px)] min-h-[500px]">
          <FlashSaleProductCatalog
            products={products}
            categories={categories}
            isLoading={isLoadingProducts}
            searchTerm={productSearch}
            onSearchChange={setProductSearch}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            selectedProducts={selectedProducts}
            onToggleProduct={handleToggleProduct}
            onBatchToggleProducts={handleBatchToggleProducts}
            discountPercentage={discount}
            searchRef={searchInputRef}
          />
        </section>

        {/* Right Side: Campaign Parameters & Live Manifest Register (5 Cols) */}
        <section className="lg:col-span-5 flex flex-col h-[calc(100vh-85px)] min-h-[500px]">
          <FlashSaleCampaignRegister
            name={name}
            setName={setName}
            description={description}
            setDescription={setDescription}
            discount={discount}
            setDiscount={setDiscount}
            startImmediately={startImmediately}
            setStartImmediately={setStartImmediately}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            isActive={isActive}
            setIsActive={setIsActive}
            selectedProducts={selectedProducts}
            onRemoveProduct={handleRemoveProduct}
            onClearProducts={handleClearProducts}
            onSubmit={handleSubmit}
            isSaving={isSaving}
            isEdit={isEdit}
          />
        </section>
      </main>
    </div>
  );
}

export default function FlashSaleFormPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col min-h-screen bg-background items-center justify-center">
          <Loader />
        </div>
      }
    >
      <FlashSalePosContent />
    </Suspense>
  );
}
