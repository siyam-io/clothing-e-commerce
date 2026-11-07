import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientFetchSettings, clientUpdateSettings } from "./settings";
import { notify } from "@/utils/swal";
import { revalidateSettings } from "@/app/actions/revalidate";
import { useAppStore } from "@/store/appStore";

export const useSettings = () => {
  const queryClient = useQueryClient();

  const { data: settings, isLoading, refetch } = useQuery({
    queryKey: ["site-settings"],
    queryFn: clientFetchSettings,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  const updateSettings = useMutation({
    mutationFn: clientUpdateSettings,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      revalidateSettings();

      // Extract updated branding from backend response or request payload
      let branding = data?.settings?.branding;
      if (!branding && variables instanceof FormData && variables.has("branding")) {
        try {
          branding = JSON.parse(variables.get("branding"));
        } catch (e) {}
      } else if (!branding && variables?.branding) {
        branding = typeof variables.branding === "string" ? JSON.parse(variables.branding) : variables.branding;
      }
      branding = branding || {};

      // Sync with Global App Store and Cookies for instant site-wide live update
      const store = useAppStore.getState();
      if (branding.defaultTheme) store.setTheme(branding.defaultTheme);
      if (branding.defaultThemeColor) store.setThemeColor(branding.defaultThemeColor);
      if (branding.defaultThemeFont) store.setThemeFont(branding.defaultThemeFont);
      if (branding.activeTheme) store.setIdentityTheme(branding.activeTheme);
      if (branding.defaultLanguage) store.setLang(branding.defaultLanguage);

      notify.success("Settings saved successfully");
    },
    onError: (err) => {
      notify.error(
        "Update Failed",
        err.response?.data?.message || "Something went wrong"
      );
    },
  });

  return {
    settings,
    isLoading,
    refetch,
    updateSettings: updateSettings.mutateAsync,
    isUpdating: updateSettings.isPending,
  };
};
