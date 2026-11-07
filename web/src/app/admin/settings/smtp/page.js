"use client";

import { useState, useEffect } from "react";
import { Save, Mail } from "lucide-react";
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

export default function SMTPPage() {
  const { settings, isLoading, updateSettings, isUpdating } = useSettings();
  const [formData, setFormData] = useState({
    mailHost: "",
    mailPort: "",
    mailUser: "",
    mailPass: "",
    mailFrom: "",
  });

  useEffect(() => {
    if (settings?.smtp) {
      setFormData({
        mailHost: settings.smtp.mailHost || "",
        mailPort: settings.smtp.mailPort || "",
        mailUser: settings.smtp.mailUser || "",
        mailPass: settings.smtp.mailPass || "",
        mailFrom: settings.smtp.mailFrom || "",
      });
    }
  }, [settings]);

  const handleSave = async () => {
    const payload = new FormData();
    payload.append("smtp", JSON.stringify(formData));
    await updateSettings(payload);
  };

  if (isLoading && !settings) return <Skeleton className="h-96 w-full rounded-2xl" />;

  return (
    <div className="space-y-6">
      <AdminCard>
        <AdminCardHeader className="border-b border-border/60 pb-4">
          <AdminCardTitle className="text-base font-semibold">SMTP Email Server Settings</AdminCardTitle>
          <AdminCardDescription className="text-xs text-muted-foreground mt-0.5">
            Configure outbound mail delivery credentials for order invoices and password resets.
          </AdminCardDescription>
        </AdminCardHeader>

        <AdminCardContent className="space-y-5 pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormInput
              label="SMTP Server Host"
              name="mailHost"
              register={() => ({})}
              value={formData.mailHost}
              onChange={(e) => setFormData({...formData, mailHost: e.target.value})}
              errors={{}}
              placeholder="e.g. smtp.gmail.com"
            />
            <FormInput
              label="SMTP Port"
              name="mailPort"
              register={() => ({})}
              value={formData.mailPort}
              onChange={(e) => setFormData({...formData, mailPort: e.target.value})}
              errors={{}}
              placeholder="e.g. 587 or 465"
            />
            <FormInput
              label="SMTP Username / Sender Email"
              name="mailUser"
              register={() => ({})}
              value={formData.mailUser}
              onChange={(e) => setFormData({...formData, mailUser: e.target.value})}
              errors={{}}
              placeholder="e.g. notifications@yourstore.com"
            />
            <FormInput
              label="SMTP Password / App Key"
              name="mailPass"
              type="password"
              register={() => ({})}
              value={formData.mailPass}
              onChange={(e) => setFormData({...formData, mailPass: e.target.value})}
              errors={{}}
              placeholder="••••••••••••"
            />
            <FormInput
              label="Sender Display Name"
              name="mailFrom"
              register={() => ({})}
              value={formData.mailFrom}
              onChange={(e) => setFormData({...formData, mailFrom: e.target.value})}
              errors={{}}
              placeholder="e.g. Urban Attire Orders"
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
