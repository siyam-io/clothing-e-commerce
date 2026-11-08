"use client";

import { useState, useEffect } from "react";
import { Save, Key, ShieldCheck } from "lucide-react";
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

export default function AuthSettingsPage() {
  const { settings, isLoading, updateSettings, isUpdating } = useSettings();
  const [formData, setFormData] = useState({
    googleClientId: "",
    googleClientSecret: "",
    facebookAppId: "",
  });
  const [prevSettings, setPrevSettings] = useState(null);

  if (settings?.auth && settings !== prevSettings) {
    setPrevSettings(settings);
    setFormData({
      googleClientId: settings.auth.googleClientId || "",
      googleClientSecret: settings.auth.googleClientSecret || "",
      facebookAppId: settings.auth.facebookAppId || "",
    });
  }

  const handleSave = async () => {
    const payload = new FormData();
    payload.append("auth", JSON.stringify(formData));
    await updateSettings(payload);
  };

  if (isLoading && !settings) return <Skeleton className="h-96 w-full rounded-2xl" />;

  return (
    <div className="space-y-6">
      <AdminCard>
        <AdminCardHeader className="border-b border-border/60 pb-4">
          <AdminCardTitle className="text-base font-semibold">Social Authentication (OAuth)</AdminCardTitle>
          <AdminCardDescription className="text-xs text-muted-foreground mt-0.5">
            Configure Google and Facebook single sign-on credentials for customer login.
          </AdminCardDescription>
        </AdminCardHeader>

        <AdminCardContent className="space-y-5 pt-5">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Key className="size-4 text-primary" /> Google Login Credentials
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                label="Google Client ID"
                name="googleClientId"
                register={() => ({})}
                value={formData.googleClientId}
                onChange={(e) => setFormData({ ...formData, googleClientId: e.target.value })}
                errors={{}}
                placeholder="e.g. 123456789-abc.apps.googleusercontent.com"
              />
              <FormInput
                label="Google Client Secret"
                name="googleClientSecret"
                type="password"
                register={() => ({})}
                value={formData.googleClientSecret}
                onChange={(e) => setFormData({ ...formData, googleClientSecret: e.target.value })}
                errors={{}}
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <div className="pt-5 border-t border-border/50 space-y-4">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" /> Facebook Login Credentials
            </h4>
            <div className="max-w-md">
              <FormInput
                label="Facebook App ID"
                name="facebookAppId"
                register={() => ({})}
                value={formData.facebookAppId}
                onChange={(e) => setFormData({ ...formData, facebookAppId: e.target.value })}
                errors={{}}
                placeholder="e.g. 123456789012345"
              />
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
