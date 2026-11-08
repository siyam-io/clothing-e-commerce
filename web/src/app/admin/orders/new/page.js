"use client";

import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAdminOrders } from "@/app/admin/orders/lib/useAdminOrders";
import { useAdminCategories } from "@/app/admin/categories/lib/useAdminCategories";
import { useAuthStore } from "@/store/authStore";
import { useAppStore } from "@/store/appStore";
import { notify, swalToast } from "@/utils/swal";
import Loader from "@/components/common/Loader";

// POS Modular Components & Audio
import PosHeader from "@/app/admin/orders/components/pos/PosHeader";
import PosProductCatalog from "@/app/admin/orders/components/pos/PosProductCatalog";
import PosCartRegister from "@/app/admin/orders/components/pos/PosCartRegister";
import PosReceiptModal from "@/app/admin/orders/components/pos/PosReceiptModal";
import PosHeldOrdersModal from "@/app/admin/orders/components/pos/PosHeldOrdersModal";
import { playBeep, playErrorSound, playSuccessChime, playParkSound } from "@/app/admin/orders/lib/posAudio";

function PosOrderTerminalContent({ editingOrderId: propEditingOrderId }) {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const editingOrderId = propEditingOrderId || params?.id || searchParams?.get("orderId") || null;
  const isEditing = Boolean(editingOrderId);

  const { user } = useAuthStore();
  const { settings } = useAppStore();
  const storeName = settings?.branding?.siteName || "Store";

  const {
    searchAdminUsers,
    createAdminOrder,
    isCreating,
    orderDetails: editingOrder,
    orderDetailsLoading: isLoadingEditingOrder,
    updateOrder,
    isUpdating,
  } = useAdminOrders({}, editingOrderId);

  const { categories } = useAdminCategories();
  const isSubmitting = isEditing ? isUpdating : isCreating;

  const searchInputRef = useRef(null);

  // Set document title
  useEffect(() => {
    if (isEditing) {
      document.title = `Edit Order #${editingOrderId?.slice(-8).toUpperCase()} | POS Terminal`;
    } else {
      document.title = `POS Terminal | ${storeName} Admin`;
    }
  }, [storeName, isEditing, editingOrderId]);

  // Global F2 shortcut to focus barcode search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "F2" || (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA")) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 1. Product Catalog Filters & State
  const [productSearch, setProductSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(productSearch);
    }, 250);
    return () => clearTimeout(timer);
  }, [productSearch]);

  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["adminProducts", { search: debouncedSearch, category: selectedCategory, limit: 60, isActive: "true" }],
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

  // 2. Cart & Items State
  const [items, setItems] = useState([]);

  // 3. Customer & Logistics State
  const [customerMode, setCustomerMode] = useState("walkin"); // "walkin", "member", "delivery"
  const [walkinPhone, setWalkinPhone] = useState("");
  const [customerData, setCustomerData] = useState({
    selectedUser: null,
    name: "",
    phone: "",
    address: "",
  });

  const [deliveryType, setDeliveryType] = useState("counter"); // "counter" (৳0) or "delivery"
  const [shippingRegion, setShippingRegion] = useState("dhaka");
  const [customShippingPrice, setCustomShippingPrice] = useState(60);

  // 4. Financials & Payment State
  const [couponCode, setCouponCode] = useState("");
  const [manualDiscountType, setManualDiscountType] = useState("flat");
  const [manualDiscountValue, setManualDiscountValue] = useState(0);

  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [cashReceived, setCashReceived] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [senderPhone, setSenderPhone] = useState("");

  // Split payment state
  const [splitCash, setSplitCash] = useState("");
  const [splitDigital, setSplitDigital] = useState("");
  const [splitMethod, setSplitMethod] = useState("bKash");

  // Order Note / Remarks
  const [orderNote, setOrderNote] = useState("");

  // 5. Held / Parked Orders State
  const [heldOrders, setHeldOrders] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("pos_held_orders_v1");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showHeldModal, setShowHeldModal] = useState(false);
  const [prevEditingOrder, setPrevEditingOrder] = useState(null);

  // Prepopulate form when editing an existing order
  if (editingOrder && isEditing && editingOrder !== prevEditingOrder) {
    setPrevEditingOrder(editingOrder);

    // 1. Items
      const loadedItems = (editingOrder.orderItems || []).map((item) => {
        const rawSizeId = item.size?._id || item.size;
        let resolvedSizeName = item.size?.name || item.sizeName || "";
        if (!resolvedSizeName || /^[0-9a-fA-F]{24}$/.test(resolvedSizeName)) {
          const foundSize = item.product?.sizes?.find(
            (s) => (s.size?._id || s.size)?.toString() === rawSizeId?.toString()
          );
          resolvedSizeName = foundSize?.size?.name || foundSize?.name || "Standard";
        }

        return {
          product: item.product?._id || item.product,
          name: item.product?.name || item.name || "Product",
          image: item.product?.images?.[0] || "",
          size: rawSizeId,
          sizeName: resolvedSizeName,
          quantity: item.quantity,
          price: item.price,
          maxStock: 999,
        };
      });
      setItems(loadedItems);

      // 2. Customer
      const isMember = Boolean(editingOrder.user && (editingOrder.user._id || editingOrder.user.id));
      const customerName = editingOrder.user?.name || editingOrder.shippingAddress?.name || "";
      const customerPhone = editingOrder.user?.phone || editingOrder.shippingAddress?.phone || "";
      const customerAddress = editingOrder.shippingAddress?.address || editingOrder.shippingAddress?.street || "";

      if (isMember) {
        setCustomerMode("member");
        setCustomerData({
          selectedUser: editingOrder.user,
          name: customerName,
          phone: customerPhone,
          address: customerAddress,
        });
      } else {
        setCustomerMode("walkin");
        setWalkinPhone(customerPhone);
        setCustomerData({
          selectedUser: null,
          name: customerName,
          phone: customerPhone,
          address: customerAddress,
        });
      }

      // 3. Delivery
      const isCounter = editingOrder.deliveryZone === "pos" || (!editingOrder.shippingPrice && !editingOrder.deliveryZone);
      if (isCounter) {
        setDeliveryType("counter");
      } else {
        setDeliveryType("delivery");
        setShippingRegion(editingOrder.deliveryZone || (editingOrder.shippingPrice === 60 ? "dhaka" : "outside"));
        setCustomShippingPrice(editingOrder.shippingPrice || 60);
      }

      // 4. Financials & Payment
      setCouponCode(editingOrder.couponCode || "");
      if (editingOrder.discountAmount > 0) {
        setManualDiscountType("flat");
        setManualDiscountValue(editingOrder.discountAmount);
      }
      setPaymentMethod(editingOrder.paymentMethod || "Cash");
      setOrderNote(editingOrder.note || "");
      setTransactionId(editingOrder.paymentResult?.transactionId || "");
  }

  const handleAddItem = (product, size) => {
    const sizeId = typeof size === "object" && size ? size._id : size;
    let sizeName = typeof size === "object" && size ? size.name : (size || "Standard");
    if (!sizeName || /^[0-9a-fA-F]{24}$/.test(sizeName)) {
      const found = product.sizes?.find((s) => (s.size?._id || s.size)?.toString() === sizeId?.toString());
      sizeName = found?.size?.name || found?.name || "Standard";
    }

    const unitPrice = product.discount > 0
      ? Math.round(product.price * (1 - product.discount / 100))
      : product.price;

    // Find stock for selected size
    let maxStock = 999;
    if (product.sizes?.length > 0 && sizeId) {
      const foundSize = product.sizes.find(
        (s) => (s.size?._id || s.size)?.toString() === sizeId.toString()
      );
      if (foundSize) {
        maxStock = foundSize.stock;
      }
    }

    const existingIndex = items.findIndex(
      (item) => (item.product?._id || item.product) === product._id && item.size === sizeId
    );

    if (existingIndex > -1) {
      if (!isEditing && items[existingIndex].quantity >= maxStock) {
        playErrorSound();
        notify.error("Stock Limit", `Only ${maxStock} available in stock for size ${sizeName}.`);
        return;
      }
      playBeep();
      const updated = [...items];
      updated[existingIndex].quantity += 1;
      setItems(updated);
    } else {
      if (!isEditing && maxStock < 1) {
        playErrorSound();
        notify.error("Out of Stock", `${product.name} is currently out of stock.`);
        return;
      }
      playBeep();
      setItems([
        ...items,
        {
          product: product._id,
          name: product.name,
          image: product.images?.[0] || "",
          size: sizeId,
          sizeName,
          quantity: 1,
          price: unitPrice,
          maxStock,
        },
      ]);
    }
  };

  const handleUpdateQuantity = (index, delta) => {
    const updated = [...items];
    const current = updated[index];
    if (!current) return;

    const newQty = current.quantity + delta;
    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }

    if (!isEditing && delta > 0 && newQty > current.maxStock) {
      playErrorSound();
      notify.error("Stock Limit", `Only ${current.maxStock} available in stock.`);
      return;
    }

    current.quantity = newQty;
    setItems(updated);
  };

  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearCart = () => {
    setItems([]);
  };



  // Save held orders to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("pos_held_orders_v1", JSON.stringify(heldOrders));
    } catch { }
  }, [heldOrders]);

  const handleHoldOrder = () => {
    if (items.length === 0) {
      notify.error("Cart Empty", "Cannot park an empty cart.");
      return;
    }

    const heldItem = {
      id: `HOLD-${Date.now()}`,
      timestamp: Date.now(),
      label: customerData?.name ? `Held for ${customerData.name}` : `Held Cart (${items.length} items)`,
      items: [...items],
      customerMode,
      walkinPhone,
      customerData: { ...customerData },
      deliveryType,
      shippingRegion,
      customShippingPrice,
      couponCode,
      manualDiscountType,
      manualDiscountValue,
      paymentMethod,
      orderNote,
    };

    setHeldOrders((prev) => [heldItem, ...prev]);

    // Reset current active cart
    setItems([]);
    setWalkinPhone("");
    setCustomerData({ selectedUser: null, name: "", phone: "", address: "" });
    setCashReceived("");
    setManualDiscountValue(0);
    setCouponCode("");
    setTransactionId("");
    setSenderPhone("");
    setOrderNote("");

    playParkSound();
    notify.success("Order Parked", "Active cart held. Ready for next customer.");
  };

  const handleResumeHeldOrder = (held) => {
    if (!held) return;

    setItems(held.items || []);
    setCustomerMode(held.customerMode || "walkin");
    setWalkinPhone(held.walkinPhone || "");
    setCustomerData(held.customerData || { selectedUser: null, name: "", phone: "", address: "" });
    setDeliveryType(held.deliveryType || "counter");
    setShippingRegion(held.shippingRegion || "dhaka");
    setCustomShippingPrice(held.customShippingPrice || 60);
    setCouponCode(held.couponCode || "");
    setManualDiscountType(held.manualDiscountType || "flat");
    setManualDiscountValue(held.manualDiscountValue || 0);
    setPaymentMethod(held.paymentMethod || "Cash");
    setOrderNote(held.orderNote || "");

    // Remove resumed order from held list
    setHeldOrders((prev) => prev.filter((h) => h.id !== held.id));
    setShowHeldModal(false);

    playParkSound();
    notify.success("Order Resumed", "Parked cart restored to register.");
  };

  const handleDeleteHeldOrder = (id) => {
    setHeldOrders((prev) => prev.filter((h) => h.id !== id));
  };

  const handleClearAllHeld = () => {
    setHeldOrders([]);
  };

  // 6. Post-Sale Receipt Modal State
  const [completedOrder, setCompletedOrder] = useState(null);
  const [lastPaidAmount, setLastPaidAmount] = useState(0);
  const [lastChangeDue, setLastChangeDue] = useState(0);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Subtotal & Calculations
  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [items]);

  const discountAmount = useMemo(() => {
    const val = Number(manualDiscountValue) || 0;
    if (manualDiscountType === "percent") {
      return Math.min(subtotal, Math.round((subtotal * val) / 100));
    }
    return Math.min(subtotal, val);
  }, [subtotal, manualDiscountType, manualDiscountValue]);

  const shippingPrice = useMemo(() => {
    if (deliveryType === "counter") return 0;
    if (shippingRegion === "dhaka") return 60;
    if (shippingRegion === "outside") return 120;
    return Number(customShippingPrice) || 0;
  }, [deliveryType, shippingRegion, customShippingPrice]);

  const grandTotal = Math.max(0, subtotal - discountAmount + shippingPrice);
  const parsedCash = Number(cashReceived) || 0;
  const changeDue = parsedCash >= grandTotal ? parsedCash - grandTotal : 0;

  // 7. Update Existing Order in Edit Mode
  const handleUpdateOrder = async () => {
    const cleanItems = items.map((i) => ({
      product: i.product?._id || i.product,
      size: i.size?._id || i.size,
      quantity: i.quantity,
      price: i.price,
    }));

    const isDelivery = deliveryType === "delivery";
    const deliveryZone = isDelivery ? shippingRegion : "pos";
    const shippingCharge = isDelivery ? shippingPrice : 0;

    let shippingAddress = {
      name: customerData.name?.trim() || editingOrder?.shippingAddress?.name || "Customer",
      email: customerData.selectedUser?.email || editingOrder?.shippingAddress?.email || "",
      phone: customerData.phone?.trim() || walkinPhone.trim() || editingOrder?.shippingAddress?.phone || "01700000000",
      address: customerData.address?.trim() || editingOrder?.shippingAddress?.address || (isDelivery ? "Customer Delivery Address" : "In-Store / POS Store"),
    };

    let finalPaymentMethod = paymentMethod;
    if (paymentMethod === "Split") {
      finalPaymentMethod = `Split (${splitMethod} + Cash)`;
    }

    try {
      await updateOrder({
        id: editingOrderId,
        data: {
          orderItems: cleanItems,
          shippingAddress,
          paymentMethod: finalPaymentMethod,
          shippingPrice: shippingCharge,
          deliveryZone,
          note: orderNote?.trim() || undefined,
        },
      });

      playSuccessChime();
      swalToast(`Order #${editingOrderId.slice(-8).toUpperCase()} updated successfully!`, "success");
      router.push(`/admin/orders/${editingOrderId}`);
    } catch (err) {
      playErrorSound();
      console.error(err);
      notify.error("Update Failed", err.response?.data?.message || "Failed to update order.");
    }
  };

  // 8. Complete Order Submission (New Sale or Edit Update)
  const handleSubmitOrder = async () => {
    if (items.length === 0) {
      playErrorSound();
      notify.error("Cart Empty", "Please add at least one product to the register.");
      return;
    }

    if (isEditing) {
      await handleUpdateOrder();
      return;
    }

    let shippingAddress = {};
    let userId = null;
    let isGuest = true;
    let deliveryZone = "pos";
    let shippingCharge = 0;
    let orderStatus = "Delivered";
    let paymentStatus = "Completed";

    const isDelivery = deliveryType === "delivery";
    deliveryZone = isDelivery ? shippingRegion : "pos";
    shippingCharge = isDelivery ? shippingPrice : 0;
    orderStatus = isDelivery ? "Processing" : "Delivered";
    paymentStatus = paymentMethod === "COD" ? "Pending" : "Completed";

    if (customerMode === "member" && customerData.selectedUser) {
      const u = customerData.selectedUser;
      userId = u._id;
      isGuest = false;
      shippingAddress = {
        name: customerData.name?.trim() || u.name || "Member Customer",
        email: u.email || "",
        phone: customerData.phone?.trim() || u.phone || walkinPhone || "01700000000",
        address: customerData.address?.trim() || u.address || (isDelivery ? "Customer Delivery Address" : "In-Store / POS Store"),
      };
    } else {
      isGuest = true;
      userId = null;
      shippingAddress = {
        name: customerData.name?.trim() || "Walk-in Customer",
        phone: customerData.phone?.trim() || walkinPhone.trim() || "01700000000",
        address: customerData.address?.trim() || (isDelivery ? "Customer Delivery Address" : "In-Store / POS Store"),
      };
    }

    let finalPaymentMethod = paymentMethod;
    let finalTransactionId = transactionId?.trim();

    if (paymentMethod === "Split") {
      finalPaymentMethod = `Split (${splitMethod} + Cash)`;
      finalTransactionId = `SPLIT: Cash ৳${splitCash || 0} + ${splitMethod} ৳${splitDigital || 0}${transactionId ? ` [Ref: ${transactionId}]` : ""}`;
    } else if (paymentMethod === "Cash") {
      finalTransactionId = finalTransactionId || `CASH-REG-${Date.now().toString().slice(-6)}`;
    } else {
      finalTransactionId = finalTransactionId || `POS-${paymentMethod.toUpperCase()}-${Date.now().toString().slice(-6)}`;
    }

    const payload = {
      user: userId,
      orderItems: items.map((i) => ({
        product: i.product?._id || i.product,
        size: i.size?._id || i.size,
        quantity: i.quantity,
      })),
      shippingAddress,
      paymentMethod: finalPaymentMethod,
      orderStatus,
      paymentStatus,
      shippingPrice: shippingCharge,
      deliveryZone,
      couponCode: couponCode ? couponCode.trim() : undefined,
      discountAmount: discountAmount > 0 ? discountAmount : 0,
      note: orderNote?.trim() || undefined,
      transactionId: finalTransactionId,
    };

    try {
      const created = await createAdminOrder(payload);
      playSuccessChime();
      setCompletedOrder(created);
      setLastPaidAmount(paymentMethod === "Cash" ? (cashReceived || grandTotal) : grandTotal);
      setLastChangeDue(paymentMethod === "Cash" ? changeDue : 0);
      setShowReceiptModal(true);
    } catch (err) {
      playErrorSound();
      console.error(err);
    }
  };

  const handleCancelEdit = () => {
    if (editingOrderId) {
      router.push(`/admin/orders/${editingOrderId}`);
    } else {
      router.push("/admin/orders");
    }
  };

  const handleNewSale = () => {
    setShowReceiptModal(false);
    setCompletedOrder(null);
    setItems([]);
    setWalkinPhone("");
    setCustomerData({ selectedUser: null, name: "", phone: "", address: "" });
    setCashReceived("");
    setTransactionId("");
    setSenderPhone("");
    setSplitCash("");
    setSplitDigital("");
    setOrderNote("");
    setManualDiscountValue(0);
    setCouponCode("");
    setCustomerMode("walkin");
    setDeliveryType("counter");
    searchInputRef.current?.focus();
  };

  if (isEditing && isLoadingEditingOrder) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center">
        <Loader />
        <p className="mt-4 text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">
          Loading Order #{editingOrderId?.slice(-8).toUpperCase()} into POS...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* POS Top Navigation Header */}
      <PosHeader
        cartCount={items.length}
        onResetCart={handleClearCart}
        heldOrdersCount={heldOrders.length}
        onOpenHeldOrders={() => setShowHeldModal(true)}
        isEditing={isEditing}
        editingOrderId={editingOrderId}
        onCancelEdit={handleCancelEdit}
      />

      {/* POS Main Workspace Split Screen */}
      <main className="flex-1 p-3 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1920px] mx-auto w-full overflow-hidden">

        {/* Left Side: Product Catalog, Barcode Search & Category Filters (7 cols) */}
        <section className="lg:col-span-7 flex flex-col h-[calc(100vh-85px)] min-h-[500px]">
          <PosProductCatalog
            products={products}
            categories={categories}
            isLoading={isLoadingProducts}
            searchTerm={productSearch}
            onSearchChange={setProductSearch}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onAddItem={handleAddItem}
            searchRef={searchInputRef}
          />
        </section>

        {/* Right Side: Active Cart Register & Fast Checkout (Detail Transaction - 5 cols) */}
        <section className="lg:col-span-5 flex flex-col h-[calc(100vh-85px)] min-h-[500px]">
          <PosCartRegister
            items={items}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}

            customerMode={customerMode}
            setCustomerMode={setCustomerMode}
            walkinPhone={walkinPhone}
            setWalkinPhone={setWalkinPhone}
            customerData={customerData}
            setCustomerData={setCustomerData}
            searchUsers={searchAdminUsers}

            deliveryType={deliveryType}
            setDeliveryType={setDeliveryType}
            shippingRegion={shippingRegion}
            setShippingRegion={setShippingRegion}
            customShippingPrice={customShippingPrice}
            setCustomShippingPrice={setCustomShippingPrice}

            couponCode={couponCode}
            setCouponCode={setCouponCode}
            manualDiscountType={manualDiscountType}
            setManualDiscountType={setManualDiscountType}
            manualDiscountValue={manualDiscountValue}
            setManualDiscountValue={setManualDiscountValue}

            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            cashReceived={cashReceived}
            setCashReceived={setCashReceived}
            transactionId={transactionId}
            setTransactionId={setTransactionId}
            senderPhone={senderPhone}
            setSenderPhone={setSenderPhone}

            splitCash={splitCash}
            setSplitCash={setSplitCash}
            splitDigital={splitDigital}
            setSplitDigital={setSplitDigital}
            splitMethod={splitMethod}
            setSplitMethod={setSplitMethod}

            orderNote={orderNote}
            setOrderNote={setOrderNote}

            onHoldOrder={handleHoldOrder}
            heldOrdersCount={heldOrders.length}
            onOpenHeldOrders={() => setShowHeldModal(true)}

            onSubmitOrder={handleSubmitOrder}
            isSubmitting={isSubmitting}

            isEditing={isEditing}
            editingOrderId={editingOrderId}
            onCancelEdit={handleCancelEdit}
          />
        </section>

      </main>

      {/* Held / Parked Orders Drawer Modal */}
      <PosHeldOrdersModal
        isOpen={showHeldModal}
        onClose={() => setShowHeldModal(false)}
        heldOrders={heldOrders}
        onResumeOrder={handleResumeHeldOrder}
        onDeleteHeldOrder={handleDeleteHeldOrder}
        onClearAllHeld={handleClearAllHeld}
      />

      {/* Post-Sale Thermal Receipt Modal */}
      {showReceiptModal && (
        <PosReceiptModal
          order={completedOrder}
          onNewSale={handleNewSale}
          onClose={() => setShowReceiptModal(false)}
          cashierName={user?.name || "Cashier"}
          storeName={storeName}
          paidAmount={lastPaidAmount}
          changeReturned={lastChangeDue}
        />
      )}
    </div>
  );
}

export default function PosNewOrderPage(props) {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen bg-background items-center justify-center">
        <Loader />
      </div>
    }>
      <PosOrderTerminalContent {...props} />
    </Suspense>
  );
}
