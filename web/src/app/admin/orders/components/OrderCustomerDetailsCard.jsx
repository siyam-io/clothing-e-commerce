"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AdminCard,
  AdminCardHeader,
  AdminCardTitle,
  AdminCardContent,
} from "@/app/admin/_components/AdminCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getImageUrl } from "@/utils/imageUtils";
import {
  Mail,
  Phone,
  MapPin,
  User,
  Copy,
  Check,
  MessageCircle,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import { swalToast } from "@/utils/swal";

export default function OrderCustomerDetailsCard({
  order,
  customerName,
  customerEmail,
  isRegistered,
}) {
  const [copiedField, setCopiedField] = useState(null);

  if (!order) return null;

  const phone = order.shippingAddress?.phone || "";
  const address =
    order.shippingAddress?.address ||
    order.shippingAddress?.street ||
    "No street address provided";
  const city = order.shippingAddress?.city || "";
  const postalCode = order.shippingAddress?.postalCode || "";
  const fullAddress = [address, city, postalCode].filter(Boolean).join(", ");

  const cleanPhone = phone.replace(/[^\d+]/g, "");
  const waPhone = cleanPhone.startsWith("+")
    ? cleanPhone.replace("+", "")
    : cleanPhone.startsWith("01")
      ? `880${cleanPhone.slice(1)}`
      : cleanPhone;

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    swalToast(`Copied ${fieldName}`, "success");
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <AdminCard>
      <AdminCardHeader>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <User className="size-4" />
            </div>
            <AdminCardTitle className="text-sm font-bold">
              Customer Details
            </AdminCardTitle>
          </div>

          <Badge
            variant="outline"
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isRegistered
                ? "bg-primary/10 text-primary border-primary/25"
                : "bg-muted text-muted-foreground border-border/60"
              }`}
          >
            {isRegistered ? "Registered Member" : "Guest Checkout"}
          </Badge>
        </div>
      </AdminCardHeader>

      <AdminCardContent className="space-y-4">
        {/* Customer Avatar & Headline */}
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-muted flex items-center justify-center font-bold text-muted-foreground border border-border/60 overflow-hidden shrink-0 shadow-2xs">
            {order.user?.avatar ? (
              <img
                src={getImageUrl(order.user.avatar)}
                className="size-full object-cover"
                alt={customerName}
              />
            ) : (
              <span className="text-sm font-extrabold uppercase text-foreground">
                {customerName.charAt(0)}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm text-foreground tracking-tight leading-snug truncate">
              {customerName}
            </p>
            {order.user?._id ? (
              <Link
                href={`/admin/users/${order.user._id}`}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline mt-0.5"
              >
                View Account Profile
                <ExternalLink className="size-2.5" />
              </Link>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Direct Guest Buyer
              </p>
            )}
          </div>
        </div>

        {/* Contact List */}
        <div className="pt-2 border-t border-border/40 space-y-3 text-xs">
          {/* Email */}
          <div className="flex items-center justify-between gap-2 group">
            <div className="flex items-center gap-2 text-muted-foreground min-w-0">
              <Mail className="size-3.5 shrink-0 text-muted-foreground/80" />
              <a
                href={`mailto:${customerEmail}`}
                className="text-foreground hover:text-primary transition-colors truncate"
              >
                {customerEmail}
              </a>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(customerEmail, "email")}
              className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors cursor-pointer"
              title="Copy Email"
            >
              {copiedField === "email" ? (
                <Check className="size-3 text-emerald-500" />
              ) : (
                <Copy className="size-3" />
              )}
            </button>
          </div>

          {/* Phone */}
          <div className="flex items-center justify-between gap-2 group">
            <div className="flex items-center gap-2 text-muted-foreground min-w-0">
              <Phone className="size-3.5 shrink-0 text-muted-foreground/80" />
              <a
                href={`tel:${phone}`}
                className="text-foreground font-mono font-medium hover:text-primary transition-colors truncate"
              >
                {phone || "No phone"}
              </a>
            </div>

            <div className="flex items-center gap-1">
              {waPhone && (
                <a
                  href={`https://wa.me/${waPhone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 rounded-md text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                  title="Chat on WhatsApp"
                >
                  <MessageCircle className="size-3.5" />
                </a>
              )}
              <button
                type="button"
                onClick={() => handleCopy(phone, "phone")}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors cursor-pointer"
                title="Copy Phone"
              >
                {copiedField === "phone" ? (
                  <Check className="size-3 text-emerald-500" />
                ) : (
                  <Copy className="size-3" />
                )}
              </button>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="p-3 rounded-xl bg-muted/20 border border-border/50 space-y-1.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
                <MapPin className="size-3 text-primary" />
                Delivery Address
              </span>
              <button
                type="button"
                onClick={() => handleCopy(fullAddress, "address")}
                className="flex items-center gap-1 text-[10px] font-medium text-primary hover:underline cursor-pointer"
              >
                {copiedField === "address" ? (
                  <>
                    <Check className="size-2.5 text-emerald-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-2.5" />
                    Copy Address
                  </>
                )}
              </button>
            </div>
            <p className="text-foreground text-xs leading-relaxed break-words font-medium">
              {address}
            </p>
            {(city || postalCode) && (
              <p className="text-muted-foreground text-[11px] font-medium">
                {[city, postalCode].filter(Boolean).join(" • ")}
              </p>
            )}
          </div>

          {/* Customer Note */}
          {order.note && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
              <p className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5 text-[11px]">
                <MessageSquare className="size-3" />
                Customer Special Note
              </p>
              <p className="text-foreground leading-relaxed italic">
                &ldquo;{order.note}&rdquo;
              </p>
            </div>
          )}
        </div>
      </AdminCardContent>
    </AdminCard>
  );
}
