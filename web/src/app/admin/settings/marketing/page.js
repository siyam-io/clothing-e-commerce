"use client";

import { useState, useEffect } from "react";
import { Save, Activity, BarChart2 } from "lucide-react";
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

export default function MarketingPage() {
  const { settings, isLoading, updateSettings, isUpdating } = useSettings();
  const [formData, setFormData] = useState({
    fbPixelId: "",
    fbAccessToken: "",
    fbTestEventCode: "",
    gtmId: "",
    tiktokPixelId: "",
    tiktokAccessToken: "",
    snapPixelId: "",
    pinterestTagId: "",
    googleAdsId: "",
    clarityId: ""
  });

  useEffect(() => {
    if (settings?.marketing) {
      setFormData({
        fbPixelId: settings.marketing.fbPixelId || "",
        fbAccessToken: settings.marketing.fbAccessToken || "",
        fbTestEventCode: settings.marketing.fbTestEventCode || "",
        gtmId: settings.marketing.gtmId || "",
        tiktokPixelId: settings.marketing.tiktokPixelId || "",
        tiktokAccessToken: settings.marketing.tiktokAccessToken || "",
        snapPixelId: settings.marketing.snapPixelId || "",
        pinterestTagId: settings.marketing.pinterestTagId || "",
        googleAdsId: settings.marketing.googleAdsId || "",
        clarityId: settings.marketing.clarityId || ""
      });
    }
  }, [settings]);

  const handleSave = async () => {
    const payload = new FormData();
    payload.append("marketing", JSON.stringify(formData));
    await updateSettings(payload);
  };

  if (isLoading && !settings) return <Skeleton className="h-96 w-full rounded-2xl" />;

  return (
    <div className="space-y-6">
      <AdminCard>
        <AdminCardHeader className="border-b border-border/60 pb-4">
          <AdminCardTitle className="text-base font-semibold">Meta (Facebook) Pixel & Conversions API</AdminCardTitle>
          <AdminCardDescription className="text-xs text-muted-foreground mt-0.5">
            Track pageviews, Add to Cart events, and purchase conversions via browser pixel and server CAPI.
          </AdminCardDescription>
        </AdminCardHeader>

        <AdminCardContent className="space-y-5 pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <FormInput
              label="Facebook Pixel ID"
              name="fbPixelId"
              register={() => ({})}
              value={formData.fbPixelId}
              onChange={(e) => setFormData({...formData, fbPixelId: e.target.value})}
              errors={{}}
              placeholder="e.g. 123456789012345"
            />
            <FormInput
              label="Conversions API Access Token"
              name="fbAccessToken"
              type="password"
              register={() => ({})}
              value={formData.fbAccessToken}
              onChange={(e) => setFormData({...formData, fbAccessToken: e.target.value})}
              errors={{}}
              placeholder="••••••••••••"
            />
            <FormInput
              label="Test Event Code (Optional)"
              name="fbTestEventCode"
              register={() => ({})}
              value={formData.fbTestEventCode}
              onChange={(e) => setFormData({...formData, fbTestEventCode: e.target.value})}
              errors={{}}
              placeholder="e.g. TEST12345"
            />
          </div>
        </AdminCardContent>
      </AdminCard>

      <AdminCard>
        <AdminCardHeader className="border-b border-border/60 pb-4">
          <AdminCardTitle className="text-base font-semibold">Google Tag Manager & Ads</AdminCardTitle>
          <AdminCardDescription className="text-xs text-muted-foreground mt-0.5">
            Connect Google Tag Manager (GTM) and Google Ads Conversion Tracking.
          </AdminCardDescription>
        </AdminCardHeader>

        <AdminCardContent className="space-y-5 pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormInput
              label="Google Tag Manager (GTM) ID"
              name="gtmId"
              register={() => ({})}
              value={formData.gtmId}
              onChange={(e) => setFormData({...formData, gtmId: e.target.value})}
              errors={{}}
              placeholder="e.g. GTM-XXXXXXX"
            />
            <FormInput
              label="Google Ads Conversion ID"
              name="googleAdsId"
              register={() => ({})}
              value={formData.googleAdsId}
              onChange={(e) => setFormData({...formData, googleAdsId: e.target.value})}
              errors={{}}
              placeholder="e.g. AW-123456789"
            />
          </div>
        </AdminCardContent>
      </AdminCard>

      <AdminCard>
        <AdminCardHeader className="border-b border-border/60 pb-4">
          <AdminCardTitle className="text-base font-semibold">Other Marketing Tags</AdminCardTitle>
          <AdminCardDescription className="text-xs text-muted-foreground mt-0.5">
            TikTok Pixel, Microsoft Clarity, Snapchat Pixel, and Pinterest Tags.
          </AdminCardDescription>
        </AdminCardHeader>

        <AdminCardContent className="space-y-5 pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormInput
              label="TikTok Pixel ID"
              name="tiktokPixelId"
              register={() => ({})}
              value={formData.tiktokPixelId}
              onChange={(e) => setFormData({...formData, tiktokPixelId: e.target.value})}
              errors={{}}
              placeholder="e.g. CXXXXXXXXXXXXXXX"
            />
            <FormInput
              label="Microsoft Clarity Project ID"
              name="clarityId"
              register={() => ({})}
              value={formData.clarityId}
              onChange={(e) => setFormData({...formData, clarityId: e.target.value})}
              errors={{}}
              placeholder="e.g. abcdef1234"
            />
            <FormInput
              label="Snapchat Pixel ID"
              name="snapPixelId"
              register={() => ({})}
              value={formData.snapPixelId}
              onChange={(e) => setFormData({...formData, snapPixelId: e.target.value})}
              errors={{}}
              placeholder="e.g. 1234-5678-90ab"
            />
            <FormInput
              label="Pinterest Tag ID"
              name="pinterestTagId"
              register={() => ({})}
              value={formData.pinterestTagId}
              onChange={(e) => setFormData({...formData, pinterestTagId: e.target.value})}
              errors={{}}
              placeholder="e.g. 123456789012"
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
