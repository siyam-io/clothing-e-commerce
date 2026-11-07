"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAdminOrders } from "@/app/admin/orders/lib/useAdminOrders";
import { useAdminProducts } from "@/app/admin/products/lib/useAdminProducts";
import { swalToast, swalError } from "@/utils/swal";
import Loader from "@/components/common/Loader";
import { Save, Package, Truck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminPageContainer from "@/app/admin/_components/AdminPageContainer";
import AdminPageHeader, { AdminBackLink } from "@/app/admin/_components/AdminPageHeader";
import { AdminCard, AdminCardHeader, AdminCardTitle, AdminCardContent } from "@/app/admin/_components/AdminCard";

// Reusable Components
import OrderItemsEditor from "@/app/admin/orders/components/OrderItemsEditor";
import OrderProductSearch from "@/app/admin/orders/components/OrderProductSearch";
import OrderShippingForm from "@/app/admin/orders/components/OrderShippingForm";
import OrderSummaryCard from "@/app/admin/orders/components/OrderSummaryCard";

export default function EditOrderPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const { orderDetails: order, orderDetailsLoading, updateOrder } = useAdminOrders({}, id);
  const [searchTerm, setSearchTerm] = useState("");
  const { products: allProducts } = useAdminProducts({ search: searchTerm, limit: 5 });
  
  const [items, setItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (order) {
      setItems(order.orderItems || []);
      
      const rawPayment = order.paymentMethod || "COD";
      const normalizedPayment = 
        rawPayment.toUpperCase() === "COD" ? "COD" :
        rawPayment.toLowerCase() === "bkash" ? "bKash" :
        rawPayment.toLowerCase() === "sslcommerz" ? "SSLCommerz" : rawPayment;

      reset({
        name: order.shippingAddress?.name || "",
        email: order.shippingAddress?.email || "",
        phone: order.shippingAddress?.phone || "",
        address: order.shippingAddress?.address || order.shippingAddress?.street || "",
        paymentMethod: normalizedPayment
      });
    }
  }, [order, reset]);

  const handleAddItem = (product, size) => {
    const sizeId = typeof size === "object" && size ? size._id : size;
    const sizeName = typeof size === "object" && size ? size.name : size;

    const existingIndex = items.findIndex(
      (i) => (i.product?._id || i.product) === product._id && (i.size?._id || i.size) === sizeId
    );

    if (existingIndex > -1) {
      const newItems = [...items];
      newItems[existingIndex].quantity += 1;
      setItems(newItems);
    } else {
      setItems([
        ...items,
        {
          product: { _id: product._id, name: product.name, images: product.images },
          name: product.name,
          size: sizeId,
          sizeName: sizeName,
          quantity: 1,
          price: product.discount > 0 ? product.price * (1 - product.discount / 100) : product.price,
        },
      ]);
    }
    setSearchTerm("");
  };

  const handleUpdateQuantity = (index, delta) => {
    const newItems = [...items];
    newItems[index].quantity = Math.max(1, newItems[index].quantity + delta);
    setItems(newItems);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const onSubmit = async (data) => {
    if (items.length === 0) {
      return swalError("Validation Error", "Order must have at least one product.");
    }

    setIsSubmitting(true);
    try {
      const cleanItems = items.map(i => ({
        product: i.product?._id || i.product,
        size: i.size?._id || i.size,
        quantity: i.quantity,
        price: i.price
      }));

      await updateOrder({ 
        id, 
        data: {
          shippingAddress: {
            name: data.name,
            email: data.email,
            phone: data.phone,
            address: data.address,
          },
          orderItems: cleanItems,
          paymentMethod: data.paymentMethod
        } 
      });
      
      swalToast("Order updated successfully", "success");
      router.push(`/admin/orders/${id}`);
    } catch (err) {
      swalError("Update Failed", err.response?.data?.message || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderDetailsLoading) {
    return (
      <div className="admin-page-container flex items-center justify-center min-h-[50vh]">
        <Loader />
      </div>
    );
  }

  return (
    <AdminPageContainer maxWidth="max-w-6xl">
      <AdminBackLink href={`/admin/orders/${id}`} label="Back to Order Details" />

      <AdminPageHeader
        title={`Edit Order #${id.slice(-8).toUpperCase()}`}
        description="Update line items, quantities, shipping address, or payment parameters"
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="h-10 px-4 rounded-xl text-xs font-medium"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="h-10 px-5 rounded-xl text-xs font-medium gap-2 shadow-xs cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Line Items & Catalog Search (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          <AdminCard>
            <AdminCardHeader>
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Package className="size-4" />
                </div>
                <AdminCardTitle>Order Items & Variations</AdminCardTitle>
              </div>
            </AdminCardHeader>

            <AdminCardContent className="space-y-6">
              <OrderItemsEditor
                items={items}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
              />

              <div className="pt-6 border-t border-border/40">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Add Product to Order</h4>
                <OrderProductSearch
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  products={allProducts}
                  onAddItem={handleAddItem}
                />
              </div>
            </AdminCardContent>
          </AdminCard>
        </div>

        {/* Right: Shipping Address & Summary (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          <AdminCard>
            <AdminCardHeader>
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Truck className="size-4" />
                </div>
                <AdminCardTitle>Shipping Destination</AdminCardTitle>
              </div>
            </AdminCardHeader>

            <AdminCardContent>
              <OrderShippingForm
                register={register}
                errors={errors}
              />
            </AdminCardContent>
          </AdminCard>

          <OrderSummaryCard
            mode="edit"
            subtotal={items.reduce((acc, item) => acc + (item.price * item.quantity), 0)}
            total={items.reduce((acc, item) => acc + (item.price * item.quantity), 0)}
            register={register}
            onSubmit={handleSubmit(onSubmit)}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </AdminPageContainer>
  );
}
