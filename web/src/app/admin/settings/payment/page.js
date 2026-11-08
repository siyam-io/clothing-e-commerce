"use client";

import { useState, useEffect } from "react";
import { Save, Banknote, CreditCard, Smartphone, Check } from "lucide-react";
import { useSettings } from "@/app/admin/settings/lib/useSettings";
import { 
  AdminCard, 
  AdminCardHeader, 
  AdminCardTitle, 
  AdminCardDescription, 
  AdminCardContent, 
  AdminCardFooter 
} from "@/app/admin/_components/AdminCard";
import { Button } from "@/components/ui/button";
import FormInput from "@/app/admin/_components/FormInput";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function PaymentPage() {
  const { settings, isLoading, updateSettings, isUpdating } = useSettings();
  const [formData, setFormData] = useState({
    paymentOptions: {
      cod: true,
      online: true,
      bkash: true,
    },
    payment: {
      sslStoreId: "",
      sslStorePassword: "",
      sslIsTest: true,
      bkashAppKey: "",
      bkashAppSecret: "",
      bkashUsername: "",
      bkashPassword: "",
      bkashIsTest: true,
    }
  });
  const [prevSettings, setPrevSettings] = useState(null);

  if (settings && settings !== prevSettings) {
    setPrevSettings(settings);
    setFormData(prev => ({
      paymentOptions: settings.paymentOptions || prev.paymentOptions,
      payment: settings.payment || prev.payment,
    }));
  }

  const handleSave = async () => {
    const payload = new FormData();
    payload.append("paymentOptions", JSON.stringify(formData.paymentOptions));
    payload.append("payment", JSON.stringify(formData.payment));
    await updateSettings(payload);
  };

  if (isLoading && !settings) return <Skeleton className="h-96 w-full rounded-2xl" />;

  const paymentMethods = [
    { id: "cod", label: "Cash on Delivery", desc: "Collect cash payment at doorstep upon product arrival", icon: Banknote },
    { id: "online", label: "SSLCommerz Gateway", desc: "Visa, Mastercard, Amex, and internet banking", icon: CreditCard },
    { id: "bkash", label: "bKash Direct Gateway", desc: "Direct bKash seamless tokenized checkout", icon: Smartphone },
  ];

  return (
    <div className="space-y-6">
      <AdminCard>
        <AdminCardHeader className="border-b border-border/60 pb-4">
          <AdminCardTitle className="text-base font-semibold">Enabled Payment Methods</AdminCardTitle>
          <AdminCardDescription className="text-xs text-muted-foreground mt-0.5">
            Toggle which checkout options customers see when paying for orders.
          </AdminCardDescription>
        </AdminCardHeader>

        <AdminCardContent className="space-y-6 pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {paymentMethods.map((option) => {
              const isEnabled = Boolean(formData.paymentOptions?.[option.id]);
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    paymentOptions: { 
                      ...formData.paymentOptions, 
                      [option.id]: !isEnabled 
                    }
                  })}
                  className={cn(
                    "p-4 rounded-xl border text-left flex flex-col justify-between transition-all",
                    isEnabled
                      ? "border-primary bg-primary/5 shadow-2xs"
                      : "border-border/60 bg-muted/20 opacity-60 hover:opacity-100"
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className={cn("size-8 rounded-lg border flex items-center justify-center", isEnabled ? "border-primary/20 text-primary bg-primary/10" : "text-muted-foreground")}>
                        <Icon className="size-4" />
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs px-2 py-0.2 rounded-full",
                          isEnabled
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 border-emerald-200/60"
                            : "bg-muted text-muted-foreground border-border/60"
                        )}
                      >
                        {isEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">{option.label}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{option.desc}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Gateway Credentials */}
          <div className="pt-6 border-t border-border/50 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* SSLCommerz */}
            <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">SSLCommerz API Credentials</h4>
                <button 
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    payment: { ...formData.payment, sslIsTest: !formData.payment?.sslIsTest }
                  })}
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors",
                    formData.payment?.sslIsTest 
                      ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 border-amber-200/60" 
                      : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 border-emerald-200/60"
                  )}
                >
                  {formData.payment?.sslIsTest ? "Sandbox (Test)" : "Live"}
                </button>
              </div>

              <div className="space-y-4">
                <FormInput
                  label="Store ID"
                  name="sslStoreId"
                  register={() => ({})}
                  value={formData.payment.sslStoreId}
                  onChange={(e) => setFormData({...formData, payment: {...formData.payment, sslStoreId: e.target.value}})}
                  errors={{}}
                  placeholder="e.g. yourstore001"
                />
                <FormInput
                  label="Store Password / Secret"
                  name="sslStorePassword"
                  type="password"
                  register={() => ({})}
                  value={formData.payment.sslStorePassword}
                  onChange={(e) => setFormData({...formData, payment: {...formData.payment, sslStorePassword: e.target.value}})}
                  errors={{}}
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            {/* bKash */}
            <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">bKash Merchant API Credentials</h4>
                <button 
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    payment: { ...formData.payment, bkashIsTest: !formData.payment?.bkashIsTest }
                  })}
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors",
                    formData.payment?.bkashIsTest 
                      ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 border-amber-200/60" 
                      : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 border-emerald-200/60"
                  )}
                >
                  {formData.payment?.bkashIsTest ? "Sandbox (Test)" : "Live"}
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormInput
                    label="App Key"
                    name="bkashAppKey"
                    register={() => ({})}
                    value={formData.payment.bkashAppKey}
                    onChange={(e) => setFormData({...formData, payment: {...formData.payment, bkashAppKey: e.target.value}})}
                    errors={{}}
                    placeholder="App Key"
                  />
                  <FormInput
                    label="App Secret"
                    name="bkashAppSecret"
                    type="password"
                    register={() => ({})}
                    value={formData.payment.bkashAppSecret}
                    onChange={(e) => setFormData({...formData, payment: {...formData.payment, bkashAppSecret: e.target.value}})}
                    errors={{}}
                    placeholder="••••••••••••"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormInput
                    label="Username"
                    name="bkashUsername"
                    register={() => ({})}
                    value={formData.payment.bkashUsername}
                    onChange={(e) => setFormData({...formData, payment: {...formData.payment, bkashUsername: e.target.value}})}
                    errors={{}}
                    placeholder="Merchant Username"
                  />
                  <FormInput
                    label="Password"
                    name="bkashPassword"
                    type="password"
                    register={() => ({})}
                    value={formData.payment.bkashPassword}
                    onChange={(e) => setFormData({...formData, payment: {...formData.payment, bkashPassword: e.target.value}})}
                    errors={{}}
                    placeholder="••••••••••••"
                  />
                </div>
              </div>
            </div>
          </div>
        </AdminCardContent>

        <AdminCardFooter className="border-t border-border/60 pt-4 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isUpdating}
            className="h-10 text-xs gap-2"
          >
            <Save className="size-4" />
            {isUpdating ? "Saving..." : "Save Changes"}
          </Button>
        </AdminCardFooter>
      </AdminCard>
    </div>
  );
}
