"use client";

import { useState, useEffect } from "react";
import { Save, Check, RotateCcw } from "lucide-react";
import { useSettings } from "@/app/admin/settings/lib/useSettings";
import { useAppStore } from "@/store/appStore";
import { 
  AdminCard, 
  AdminCardHeader, 
  AdminCardTitle, 
  AdminCardDescription, 
  AdminCardContent, 
  AdminCardFooter 
} from "@/app/admin/_components/AdminCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const THEME_COLORS = [
  { name: "Zinc", label: "Neutral Zinc", class: "bg-zinc-900 dark:bg-zinc-100" },
  { name: "Rose", label: "Modern Rose", class: "bg-rose-600" },
  { name: "Blue", label: "Cobalt Blue", class: "bg-blue-600" },
  { name: "Green", label: "Emerald Green", class: "bg-emerald-600" },
  { name: "Orange", label: "Amber Orange", class: "bg-amber-600" },
  { name: "Amethyst", label: "Royal Violet", class: "bg-purple-600" },
  { name: "Teal", label: "Cyber Teal", class: "bg-teal-600" },
];

const FONTS = [
  { name: "Inter", label: "Inter (Modern Sans)" },
  { name: "Roboto", label: "Roboto (Clean Standard)" },
  { name: "Plus Jakarta Sans", label: "Plus Jakarta Sans (Friendly Sans)" },
  { name: "Outfit", label: "Outfit (Fashion & Lifestyle)" },
  { name: "Geist", label: "Geist (Technical Precision)" },
];

export default function ThemePage() {
  const { settings, isLoading, updateSettings, isUpdating } = useSettings();
  const storeThemeColor = useAppStore((state) => state.themeColor);
  const storeThemeFont = useAppStore((state) => state.themeFont);
  const setThemeColor = useAppStore((state) => state.setThemeColor);
  const setThemeFont = useAppStore((state) => state.setThemeFont);

  const [formData, setFormData] = useState({
    defaultThemeColor: "Zinc",
    defaultThemeFont: "Inter",
    activeTheme: "executive",
  });

  useEffect(() => {
    if (settings?.branding) {
      const savedColor = settings.branding.defaultThemeColor || "Zinc";
      const savedFont = settings.branding.defaultThemeFont || "Inter";
      const savedTheme = settings.branding.activeTheme || "executive";
      
      setFormData({
        defaultThemeColor: savedColor,
        defaultThemeFont: savedFont,
        activeTheme: savedTheme,
      });

      // Ensure store matches saved settings if not already set
      if (storeThemeColor !== savedColor) {
        setThemeColor(savedColor);
      }
      if (storeThemeFont !== savedFont) {
        setThemeFont(savedFont);
      }
    }
  }, [settings]);

  // 🎨 Instant Live Color Preview
  const handleColorSelect = (colorName) => {
    setFormData((prev) => ({ ...prev, defaultThemeColor: colorName }));
    setThemeColor(colorName); // Immediately updates CSS variables on document.documentElement
  };

  // 🔤 Instant Live Font Preview
  const handleFontSelect = (fontName) => {
    setFormData((prev) => ({ ...prev, defaultThemeFont: fontName }));
    setThemeFont(fontName); // Immediately updates font on document.documentElement
  };

  // 🔄 Discard Changes back to saved settings
  const handleDiscard = () => {
    if (settings?.branding) {
      const savedColor = settings.branding.defaultThemeColor || "Zinc";
      const savedFont = settings.branding.defaultThemeFont || "Inter";
      setFormData({
        defaultThemeColor: savedColor,
        defaultThemeFont: savedFont,
        activeTheme: settings.branding.activeTheme || "executive",
      });
      setThemeColor(savedColor);
      setThemeFont(savedFont);
    }
  };

  const handleSave = async () => {
    const updatedBranding = { ...settings?.branding, ...formData };
    const payload = new FormData();
    payload.append("branding", JSON.stringify(updatedBranding));
    await updateSettings(payload);
  };

  if (isLoading && !settings) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  const hasChanges = 
    formData.defaultThemeColor !== (settings?.branding?.defaultThemeColor || "Zinc") ||
    formData.defaultThemeFont !== (settings?.branding?.defaultThemeFont || "Inter");

  return (
    <div className="space-y-6">
      <AdminCard>
        <AdminCardHeader className="border-b border-border/60 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <AdminCardTitle className="text-base font-semibold">Brand Color Palette</AdminCardTitle>
              <AdminCardDescription className="text-xs text-muted-foreground mt-0.5">
                Select your brand&apos;s primary color. Changes apply live across buttons, active rings, and highlight elements.
              </AdminCardDescription>
            </div>
            {hasChanges && (
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 px-2.5 py-1 rounded-full w-fit">
                Live Preview Active (Unsaved)
              </span>
            )}
          </div>
        </AdminCardHeader>

        <AdminCardContent className="space-y-6 pt-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {THEME_COLORS.map((item) => {
              const isSelected = formData.defaultThemeColor === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => handleColorSelect(item.name)}
                  type="button"
                  className={cn(
                    "p-3 rounded-xl border text-center flex flex-col items-center gap-2.5 transition-all cursor-pointer",
                    isSelected
                      ? "border-primary bg-primary/10 ring-2 ring-primary shadow-2xs font-semibold"
                      : "border-border/60 hover:border-border bg-card hover:bg-muted/30"
                  )}
                >
                  <div className={cn("size-8 rounded-full shadow-xs flex items-center justify-center transition-transform hover:scale-105", item.class)}>
                    {isSelected && <Check className="size-4 text-white drop-shadow-sm" />}
                  </div>
                  <span className="text-xs font-medium text-foreground">{item.name}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-5 border-t border-border/50 space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-foreground">Typography Family</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Select the primary font family for storefront headings and UI elements.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {FONTS.map((font) => {
                const isSelected = formData.defaultThemeFont === font.name;
                return (
                  <button
                    key={font.name}
                    type="button"
                    onClick={() => handleFontSelect(font.name)}
                    className={cn(
                      "p-3.5 rounded-xl border text-left transition-all cursor-pointer",
                      isSelected
                        ? "border-primary bg-primary/10 ring-2 ring-primary shadow-2xs font-semibold"
                        : "border-border/60 hover:border-border bg-card hover:bg-muted/30"
                    )}
                  >
                    <p className="text-xs font-semibold text-foreground">{font.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">The quick brown fox jumps</p>
                  </button>
                );
              })}
            </div>
          </div>
        </AdminCardContent>

        <AdminCardFooter className="border-t border-border/60 pt-4 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleDiscard}
            disabled={!hasChanges || isUpdating}
            className="h-10 text-xs gap-1.5"
          >
            <RotateCcw className="size-3.5" /> Reset Preview
          </Button>
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
