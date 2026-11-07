"use client";

import { useState, useEffect } from "react";
import { Save, MessageSquare } from "lucide-react";
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

export default function SMSPage() {
  const { settings, isLoading, updateSettings, isUpdating } = useSettings();
  const [formData, setFormData] = useState({
    smsApiKey: "",
    smsSenderId: "",
  });

  useEffect(() => {
    if (settings?.sms) {
      setFormData({
        smsApiKey: settings.sms.smsApiKey || "",
        smsSenderId: settings.sms.smsSenderId || "",
      });
    }
  }, [settings]);

  const handleSave = async () => {
    const payload = new FormData();
    payload.append("sms", JSON.stringify(formData));
    await updateSettings(payload);
  };

  if (isLoading && !settings) return <Skeleton className="h-96 w-full rounded-2xl" />;

  return (
    <div className="space-y-6">
      <AdminCard>
        <AdminCardHeader className="border-b border-border/60 pb-4">
          <AdminCardTitle className="text-base font-semibold">SMS Gateway Configuration</AdminCardTitle>
          <AdminCardDescription className="text-xs text-muted-foreground mt-0.5">
            Configure bulk SMS credentials for order updates and OTP verifications.
          </AdminCardDescription>
        </AdminCardHeader>

        <AdminCardContent className="space-y-5 pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormInput
              label="SMS Gateway API Key"
              name="smsApiKey"
              register={() => ({})}
              value={formData.smsApiKey}
              onChange={(e) => setFormData({...formData, smsApiKey: e.target.value})}
              errors={{}}
              placeholder="e.g. your_sms_api_key_here"
            />
            <FormInput
              label="Sender ID / Sender Mask"
              name="smsSenderId"
              register={() => ({})}
              value={formData.smsSenderId}
              onChange={(e) => setFormData({...formData, smsSenderId: e.target.value})}
              errors={{}}
              placeholder="e.g. STORENAME"
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
