"use client";

import { useState, useEffect } from "react";
import { Save } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";

export default function ContactPage() {
  const { settings, isLoading, updateSettings, isUpdating } = useSettings();
  const [formData, setFormData] = useState({
    phone: "",
    email: "",
    address: "",
    whatsapp: "",
  });
  const [prevSettings, setPrevSettings] = useState(null);

  if (settings?.contact && settings !== prevSettings) {
    setPrevSettings(settings);
    setFormData({
      phone: settings.contact.phone || "",
      email: settings.contact.email || "",
      address: settings.contact.address || "",
      whatsapp: settings.contact.whatsapp || "",
    });
  }

  const handleSave = async () => {
    const payload = new FormData();
    payload.append("contact", JSON.stringify(formData));
    await updateSettings(payload);
  };

  if (isLoading && !settings) return <Skeleton className="h-96 w-full rounded-2xl" />;

  return (
    <div className="space-y-6">
      <AdminCard>
        <AdminCardHeader className="border-b border-border/60 pb-4">
          <AdminCardTitle className="text-base font-semibold">Store Contact Channels</AdminCardTitle>
          <AdminCardDescription className="text-xs text-muted-foreground mt-0.5">
            Public customer service contact information displayed in footer and order confirmations.
          </AdminCardDescription>
        </AdminCardHeader>

        <AdminCardContent className="space-y-5 pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormInput
              label="Phone Number"
              name="phone"
              register={() => ({})}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              errors={{}}
              placeholder="+880 1XXX XXXXXX"
            />
            <FormInput
              label="WhatsApp Support Number"
              name="whatsapp"
              register={() => ({})}
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              errors={{}}
              placeholder="+880 1XXX XXXXXX"
            />
            <FormInput
              label="Support Email Address"
              name="email"
              register={() => ({})}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              errors={{}}
              placeholder="support@clothingbrand.com"
            />
            <FormInput
              label="Physical Store / Office Address"
              name="address"
              register={() => ({})}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              errors={{}}
              placeholder="House 12, Road 4, Banani, Dhaka"
            />
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
