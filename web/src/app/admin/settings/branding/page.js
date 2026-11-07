"use client";

import { useState, useEffect } from "react";
import { Save, Server, Cloud } from "lucide-react";
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
import ImageUpload from "@/app/admin/_components/ImageUpload";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function BrandingPage() {
  const { settings, isLoading, updateSettings, isUpdating } = useSettings();
  const [formData, setFormData] = useState({
    siteName: "",
    siteTitle: "",
    description: "",
    logo: "",
    logoDark: "",
    favicon: "",
  });

  const [files, setFiles] = useState({
    logo: null,
    logoDark: null,
    favicon: null,
  });

  const [storageMethod, setStorageMethod] = useState("cloudinary");
  const [cloudinaryKeys, setCloudinaryKeys] = useState({
    cloudinaryCloudName: "",
    cloudinaryApiKey: "",
    cloudinaryApiSecret: "",
  });

  useEffect(() => {
    if (settings) {
      if (settings.branding) {
        setFormData({
          siteName: settings.branding.siteName || "",
          siteTitle: settings.branding.siteTitle || "",
          description: settings.branding.description || "",
          logo: settings.branding.logo || "",
          logoDark: settings.branding.logoDark || "",
          favicon: settings.branding.favicon || "",
        });
      }
      if (settings.config?.storageMethod) {
        setStorageMethod(settings.config.storageMethod);
      }
      if (settings.cloudinary) {
        setCloudinaryKeys({
          cloudinaryCloudName: settings.cloudinary.cloudinaryCloudName || "",
          cloudinaryApiKey: settings.cloudinary.cloudinaryApiKey || "",
          cloudinaryApiSecret: settings.cloudinary.cloudinaryApiSecret || "",
        });
      }
    }
  }, [settings]);

  const handleSave = async () => {
    const mergedBranding = {
      ...settings?.branding,
      ...formData
    };

    const payload = new FormData();
    payload.append("branding", JSON.stringify(mergedBranding));

    const mergedConfig = {
      ...settings?.config,
      storageMethod: storageMethod
    };
    payload.append("config", JSON.stringify(mergedConfig));
    payload.append("cloudinary", JSON.stringify(cloudinaryKeys));

    if (files.logo) payload.append("logo", files.logo);
    if (files.logoDark) payload.append("logoDark", files.logoDark);
    if (files.favicon) payload.append("favicon", files.favicon);

    await updateSettings(payload);
  };

  if (isLoading && !settings) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminCard>
        <AdminCardHeader className="border-b border-border/60 pb-4">
          <AdminCardTitle className="text-base font-semibold">Store Identity</AdminCardTitle>
          <AdminCardDescription className="text-xs text-muted-foreground mt-0.5">
            Basic store naming and search engine meta descriptions.
          </AdminCardDescription>
        </AdminCardHeader>

        <AdminCardContent className="space-y-5 pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormInput
              label="Store Name"
              name="siteName"
              register={() => ({})}
              value={formData.siteName}
              onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
              errors={{}}
              placeholder="e.g. Urban Attire"
            />
            <FormInput
              label="Page Title Tag"
              name="siteTitle"
              register={() => ({})}
              value={formData.siteTitle}
              onChange={(e) => setFormData({ ...formData, siteTitle: e.target.value })}
              errors={{}}
              placeholder="e.g. Urban Attire - Premium Clothing Brand"
            />
          </div>

          <FormInput
            label="Store Description (SEO)"
            name="description"
            register={() => ({})}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            errors={{}}
            placeholder="Short description for search engine listings..."
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-4 border-t border-border/50">
            <ImageUpload
              label="Primary Logo (Light)"
              name="logo"
              register={() => ({})}
              currentImage={formData.logo}
              onImageChange={(f) => {
                setFiles(prev => ({ ...prev, logo: f }));
                if (!f) setFormData(prev => ({ ...prev, logo: "" }));
              }}
            />
            <ImageUpload
              label="Logo (Dark Mode)"
              name="logoDark"
              register={() => ({})}
              currentImage={formData.logoDark}
              onImageChange={(f) => {
                setFiles(prev => ({ ...prev, logoDark: f }));
                if (!f) setFormData(prev => ({ ...prev, logoDark: "" }));
              }}
            />
            <ImageUpload
              label="Favicon"
              name="favicon"
              register={() => ({})}
              currentImage={formData.favicon}
              onImageChange={(f) => {
                setFiles(prev => ({ ...prev, favicon: f }));
                if (!f) setFormData(prev => ({ ...prev, favicon: "" }));
              }}
            />
          </div>
        </AdminCardContent>
      </AdminCard>

      <AdminCard>
        <AdminCardHeader className="border-b border-border/60 pb-4">
          <AdminCardTitle className="text-base font-semibold">Media Storage Strategy</AdminCardTitle>
          <AdminCardDescription className="text-xs text-muted-foreground mt-0.5">
            Choose where store product photos, banners, and icons are permanently saved.
          </AdminCardDescription>
        </AdminCardHeader>

        <AdminCardContent className="space-y-5 pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setStorageMethod("server")}
              className={cn(
                "p-4 rounded-xl border text-left flex items-start gap-3 transition-all",
                storageMethod === "server"
                  ? "border-primary bg-primary/5 shadow-2xs"
                  : "border-border/60 hover:border-border bg-card"
              )}
            >
              <div className={cn("p-2 rounded-lg border", storageMethod === "server" ? "border-primary/20 text-primary bg-primary/10" : "text-muted-foreground")}>
                <Server className="size-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-foreground">Local Server Storage</h4>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Saved inside the node server directory. Best for dedicated or VPS hosting.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setStorageMethod("cloudinary")}
              className={cn(
                "p-4 rounded-xl border text-left flex items-start gap-3 transition-all",
                storageMethod === "cloudinary"
                  ? "border-primary bg-primary/5 shadow-2xs"
                  : "border-border/60 hover:border-border bg-card"
              )}
            >
              <div className={cn("p-2 rounded-lg border", storageMethod === "cloudinary" ? "border-primary/20 text-primary bg-primary/10" : "text-muted-foreground")}>
                <Cloud className="size-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-foreground">Cloudinary CDN (Recommended)</h4>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Global CDN caching, auto WebP compression, and persistent storage across deploys.
                </p>
              </div>
            </button>
          </div>

          {storageMethod === "cloudinary" && (
            <div className="pt-4 border-t border-border/50 space-y-4">
              <h4 className="text-xs font-semibold text-foreground">Cloudinary Credentials</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormInput
                  label="Cloud Name"
                  name="cloudinaryCloudName"
                  register={() => ({})}
                  value={cloudinaryKeys.cloudinaryCloudName}
                  onChange={(e) => setCloudinaryKeys({ ...cloudinaryKeys, cloudinaryCloudName: e.target.value })}
                  errors={{}}
                  placeholder="e.g. dxyz123"
                />
                <FormInput
                  label="API Key"
                  name="cloudinaryApiKey"
                  register={() => ({})}
                  value={cloudinaryKeys.cloudinaryApiKey}
                  onChange={(e) => setCloudinaryKeys({ ...cloudinaryKeys, cloudinaryApiKey: e.target.value })}
                  errors={{}}
                  placeholder="e.g. 1234567890"
                />
                <FormInput
                  label="API Secret"
                  name="cloudinaryApiSecret"
                  type="password"
                  register={() => ({})}
                  value={cloudinaryKeys.cloudinaryApiSecret}
                  onChange={(e) => setCloudinaryKeys({ ...cloudinaryKeys, cloudinaryApiSecret: e.target.value })}
                  errors={{}}
                  placeholder="••••••••••••"
                />
              </div>
            </div>
          )}
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
