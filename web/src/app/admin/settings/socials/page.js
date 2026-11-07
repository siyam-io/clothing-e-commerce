"use client";

import { useState, useEffect } from "react";
import { Save, Share2 } from "lucide-react";
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

export default function SocialsPage() {
  const { settings, isLoading, updateSettings, isUpdating } = useSettings();
  const [socialLinks, setSocialLinks] = useState([]);

  useEffect(() => {
    if (settings?.socialLinks) {
      setSocialLinks(settings.socialLinks || []);
    }
  }, [settings]);

  const handleSave = async () => {
    const allowedPlatforms = ["facebook", "instagram", "twitter", "linkedin", "tiktok"];
    const cleanedSocialLinks = socialLinks.filter(link => 
      allowedPlatforms.includes(link.platform?.toLowerCase()) && link.url?.trim() !== ""
    );

    const payload = new FormData();
    payload.append("socialLinks", JSON.stringify(cleanedSocialLinks));
    await updateSettings(payload);
  };

  const updateLink = (platform, url) => {
    const newLinks = [...socialLinks];
    const index = newLinks.findIndex(s => s.platform === platform);
    if (index > -1) {
      newLinks[index].url = url;
    } else {
      newLinks.push({ platform, url });
    }
    setSocialLinks(newLinks);
  };

  if (isLoading && !settings) return <Skeleton className="h-96 w-full rounded-2xl" />;

  const platforms = [
    { id: "facebook", label: "Facebook Page URL", placeholder: "https://facebook.com/your-brand" },
    { id: "instagram", label: "Instagram Profile URL", placeholder: "https://instagram.com/your-brand" },
    { id: "twitter", label: "Twitter / X Profile URL", placeholder: "https://x.com/your-brand" },
    { id: "linkedin", label: "LinkedIn Company Page", placeholder: "https://linkedin.com/company/your-brand" },
    { id: "tiktok", label: "TikTok Profile URL", placeholder: "https://tiktok.com/@your-brand" },
  ];

  return (
    <div className="space-y-6">
      <AdminCard>
        <AdminCardHeader className="border-b border-border/60 pb-4">
          <AdminCardTitle className="text-base font-semibold">Social Media Channels</AdminCardTitle>
          <AdminCardDescription className="text-xs text-muted-foreground mt-0.5">
            Public social handles and profile links displayed in the storefront header and footer.
          </AdminCardDescription>
        </AdminCardHeader>

        <AdminCardContent className="space-y-5 pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {platforms.map((platform) => (
              <FormInput
                key={platform.id}
                label={platform.label}
                name={platform.id}
                register={() => ({})}
                value={socialLinks.find(s => s.platform === platform.id)?.url || ""}
                onChange={(e) => updateLink(platform.id, e.target.value)}
                errors={{}}
                placeholder={platform.placeholder}
              />
            ))}
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
