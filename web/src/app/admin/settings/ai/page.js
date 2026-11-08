"use client";

import { useState, useEffect } from "react";
import { Save, BrainCircuit, Sparkles, ShieldAlert } from "lucide-react";
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
import { useAuthStore } from "@/store/authStore";
import { Skeleton } from "@/components/ui/skeleton";

export default function AiSettingsPage() {
  const { settings, isLoading, updateSettings, isUpdating } = useSettings();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role?.name === "superadmin";

  const [formData, setFormData] = useState({
    geminiApiKey: "",
  });
  const [prevSettings, setPrevSettings] = useState(null);

  if (settings?.ai && settings !== prevSettings) {
    setPrevSettings(settings);
    setFormData({
      geminiApiKey: settings.ai.geminiApiKey || "",
    });
  }

  const handleSave = async () => {
    if (!isSuperAdmin) return;
    const payload = new FormData();
    payload.append("ai", JSON.stringify(formData));
    await updateSettings(payload);
  };

  if (isLoading && !settings) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  return (
    <div className="space-y-6">
      <AdminCard>
        <AdminCardHeader className="border-b border-border/60 pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <AdminCardTitle className="text-base font-semibold">
              Google Gemini AI Configuration
            </AdminCardTitle>
          </div>
          <AdminCardDescription className="text-xs text-muted-foreground mt-0.5">
            Configure your Gemini API key to enable AI description generation, automated FAQ creation, and intelligent storefront search.
          </AdminCardDescription>
        </AdminCardHeader>

        <AdminCardContent className="space-y-5 pt-5">
          {!isSuperAdmin && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 text-amber-800 dark:text-amber-300 text-xs font-medium">
              <ShieldAlert className="size-4 shrink-0 text-amber-600" />
              <span>
                Security Notice: Only users with the <strong>superadmin</strong> role have permissions to view or update AI Engine API credentials.
              </span>
            </div>
          )}

          <div className="max-w-md">
            <FormInput
              label="Google Gemini API Key"
              name="geminiApiKey"
              type="password"
              register={() => ({})}
              value={formData.geminiApiKey}
              onChange={(e) => setFormData({ ...formData, geminiApiKey: e.target.value })}
              errors={{}}
              placeholder={isSuperAdmin ? "AIzaSy..." : "••••••••••••••••••••"}
              disabled={!isSuperAdmin}
            />
          </div>
        </AdminCardContent>

        <AdminCardFooter className="border-t border-border/60 pt-4 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isUpdating || !isSuperAdmin}
            className="h-10 text-xs gap-2"
          >
            <Save className="size-4" />
            {isUpdating ? "Saving..." : "Save AI Key"}
          </Button>
        </AdminCardFooter>
      </AdminCard>
    </div>
  );
}
