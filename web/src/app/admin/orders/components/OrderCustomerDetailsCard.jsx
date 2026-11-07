"use client";

import { AdminCard, AdminCardHeader, AdminCardTitle, AdminCardContent } from "@/app/admin/_components/AdminCard";
import { Badge } from "@/components/ui/badge";
import { getImageUrl } from "@/utils/imageUtils";
import { Mail, Phone, MapPin, User } from "lucide-react";

export default function OrderCustomerDetailsCard({
  order,
  customerName,
  customerEmail,
  isRegistered,
}) {
  if (!order) return null;

  const phone = order.shippingAddress?.phone || "N/A";
  const address = order.shippingAddress?.address || order.shippingAddress?.street || "No address provided";
  const city = order.shippingAddress?.city || "";
  const postalCode = order.shippingAddress?.postalCode || "";

  return (
    <AdminCard>
      <AdminCardHeader>
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <User className="size-4" />
          </div>
          <AdminCardTitle>Customer Details</AdminCardTitle>
        </div>
      </AdminCardHeader>

      <AdminCardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-full bg-muted flex items-center justify-center font-semibold text-muted-foreground border border-border/60 overflow-hidden shrink-0">
            {order.user?.avatar ? (
              <img
                src={getImageUrl(order.user.avatar)}
                className="size-full object-cover"
                alt={customerName}
              />
            ) : (
              <span className="text-sm font-bold uppercase">{customerName.charAt(0)}</span>
            )}
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground tracking-tight leading-snug">
              {customerName}
            </p>
            <Badge
              variant="outline"
              className="text-[10px] font-medium px-2 py-0.2 rounded-full border border-border/60 mt-0.5"
            >
              {isRegistered ? "Registered Member" : "Guest Checkout"}
            </Badge>
          </div>
        </div>

        <div className="pt-2 border-t border-border/40 space-y-2.5 text-xs">
          <div className="flex items-start gap-2.5 text-muted-foreground">
            <Mail className="size-3.5 mt-0.5 shrink-0" />
            <span className="text-foreground break-all">{customerEmail}</span>
          </div>

          <div className="flex items-start gap-2.5 text-muted-foreground">
            <Phone className="size-3.5 mt-0.5 shrink-0" />
            <span className="text-foreground font-mono">{phone}</span>
          </div>

          <div className="flex items-start gap-2.5 text-muted-foreground">
            <MapPin className="size-3.5 mt-0.5 shrink-0" />
            <span className="text-foreground">
              {address}
              {(city || postalCode) && (
                <span className="block text-muted-foreground text-[11px] mt-0.5">
                  {[city, postalCode].filter(Boolean).join(", ")}
                </span>
              )}
            </span>
          </div>
        </div>
      </AdminCardContent>
    </AdminCard>
  );
}
