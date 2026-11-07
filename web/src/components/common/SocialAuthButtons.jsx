"use client";

import { useState, useEffect } from "react";
import { useGoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { motion } from "framer-motion";
import { swalToast, swalError } from "@/utils/swal";
import { useAuthStore } from "@/store/authStore";
import { useAppStore } from "@/store/appStore";
import { useSettings } from "@/hooks/useSettings";

// Subcomponent to handle Google sign-in actions under GoogleOAuthProvider
function GoogleSignInButton({ isSubmitting, setIsSubmitting, lang, loginWithGoogle, onSuccessRedirect }) {
  const triggerGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsSubmitting(true);
      try {
        await loginWithGoogle(tokenResponse.access_token);
        swalToast(lang === "bn" ? "গুগল লগইন সফল হয়েছে!" : "Google Sign-In Successful!", "success");
        if (onSuccessRedirect) onSuccessRedirect();
      } catch (err) {
        console.error("Google Auth Store Action Error:", err);
        swalError(
          lang === "bn" ? "লগইন ব্যর্থ হয়েছে" : "Sign-In Failed",
          err.response?.data?.message || (lang === "bn" ? "গুগল ভেরিফিকেশন ব্যর্থ হয়েছে" : "Google verification failed")
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    onError: (error) => {
      console.error("Google Client Login Error:", error);
      swalError(
        lang === "bn" ? "লগইন বাতিল হয়েছে" : "Sign-In Cancelled",
        lang === "bn" ? "গুগল পপআপ বন্ধ করা হয়েছে বা সমস্যা হয়েছে।" : "Google popup was closed or failed to initialize."
      );
      setIsSubmitting(false);
    },
  });

  return (
    <motion.button
      whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
      whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
      type="button"
      disabled={isSubmitting}
      onClick={() => {
        setIsSubmitting(true);
        triggerGoogleLogin();
      }}
      className="flex items-center justify-center gap-3 bg-accent/5 hover:bg-accent/10 border border-border/5 rounded-2xl px-6 py-4 transition-all text-xs font-black uppercase tracking-widest text-foreground hover:border-border/30 disabled:opacity-50 cursor-pointer shadow-lg w-full"
    >
      {isSubmitting ? (
        <svg
          className="animate-spin h-5 w-5 text-accent-secondary"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      ) : (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#EA4335"
            d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.354 0 3.373 2.673 1.455 6.573L5.266 9.765z"
          />
          <path
            fill="#34A853"
            d="M16.04 15.345c-1.073.727-2.436 1.164-4.04 1.164-2.927 0-5.41-1.982-6.29-4.654L1.89 15.027C3.882 18.99 8.018 21.818 12 21.818c3.073 0 5.89-.982 7.964-2.836l-3.927-3.637z"
          />
          <path
            fill="#4285F4"
            d="M23.49 12.273c0-.818-.072-1.609-.2-2.364H12v4.51h6.473c-.273 1.436-1.09 2.654-2.31 3.473l3.927 3.636c2.29-2.127 3.6-5.273 3.6-9.255z"
          />
          <path
            fill="#FBBC05"
            d="M5.71 11.855c-.236-.728-.373-1.51-.373-2.318 0-.809.137-1.59.373-2.318L1.9 4.027C1.073 5.673.6 7.51.6 9.537c0 2.027.473 3.864 1.3 5.509l3.81-3.191z"
          />
        </svg>
      )}
      <span>Google</span>
    </motion.button>
  );
}

export default function SocialAuthButtons({ onSuccessRedirect }) {
  const { loginWithGoogle, loginWithFacebook } = useAuthStore();
  const { lang } = useAppStore();
  const { settings, isLoading: settingsLoading } = useSettings();
  
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isFacebookLoading, setIsFacebookLoading] = useState(false);
  const [isHttps, setIsHttps] = useState(false);

  const googleClientId =
    settings?.auth?.googleClientId ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    "";
  const facebookAppId =
    settings?.auth?.facebookAppId ||
    process.env.NEXT_PUBLIC_FACEBOOK_APP_ID ||
    "";

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsHttps(window.location.protocol === "https:");
    }
  }, []);

  // Dynamic Facebook SDK initialization when facebookAppId is loaded from DB and is secure
  useEffect(() => {
    if (facebookAppId && isHttps && !window.FB) {
      window.fbAsyncInit = function () {
        window.FB.init({
          appId: facebookAppId,
          cookie: true,
          status: false, // Prevent auto-fetching login status which triggers warnings on HTTP/local pages
          xfbml: true,
          version: "v18.0",
        });
      };

      // Load SDK Script
      (function (d, s, id) {
        var js,
          fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s);
        js.id = id;
        js.src = "https://connect.facebook.net/en_US/sdk.js";
        fjs.parentNode.insertBefore(js, fjs);
      })(document, "script", "facebook-jssdk");
    }
  }, [facebookAppId, isHttps]);

  const handleFacebookLogin = () => {
    if (!facebookAppId) return;

    if (!isHttps) {
      swalError(
        lang === "bn" ? "নিরাপদ সংযোগ প্রয়োজন" : "Secure Connection Required",
        lang === "bn"
          ? "ফেসবুক লগইন এর জন্য HTTPS সংযোগ প্রয়োজন। অনুগ্রহ করে সাইটটি সিকিউর প্রোটোকল দিয়ে ব্রাউজ করুন।"
          : "Facebook Login requires a secure HTTPS connection. Please browse the site using HTTPS."
      );
      return;
    }

    setIsFacebookLoading(true);

    const performLogin = () => {
      window.FB.login(
        async (response) => {
          if (response.authResponse) {
            const accessToken = response.authResponse.accessToken;
            try {
              await loginWithFacebook(accessToken);
              swalToast(lang === "bn" ? "ফেসবুক লগইন সফল হয়েছে!" : "Facebook Sign-In Successful!", "success");
              if (onSuccessRedirect) onSuccessRedirect();
            } catch (err) {
              console.error("Facebook Login Store Action Error:", err);
              swalError(
                lang === "bn" ? "লগইন ব্যর্থ হয়েছে" : "Sign-In Failed",
                err.response?.data?.message ||
                  (lang === "bn" ? "ফেসবুক ভেরিফিকেশন ব্যর্থ হয়েছে" : "Facebook verification failed")
              );
            } finally {
              setIsFacebookLoading(false);
            }
          } else {
            swalError(
              lang === "bn" ? "লগইন বাতিল হয়েছে" : "Sign-In Cancelled",
              lang === "bn" ? "ফেসবুক লগইন পপআপ বাতিল করা হয়েছে।" : "Facebook login was cancelled by the user."
            );
            setIsFacebookLoading(false);
          }
        },
        { scope: "public_profile,email" }
      );
    };

    if (!window.FB) {
      // Re-initialize if not loaded
      window.fbAsyncInit = function () {
        window.FB.init({
          appId: facebookAppId,
          cookie: true,
          status: false,
          xfbml: true,
          version: "v18.0",
        });
        performLogin();
      };
    } else {
      performLogin();
    }
  };

  if (settingsLoading) {
    return (
      <div className="w-full mt-8 space-y-4 animate-pulse">
        <div className="h-px bg-border/10 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-12 bg-accent/5 rounded-2xl" />
          <div className="h-12 bg-accent/5 rounded-2xl" />
        </div>
      </div>
    );
  }

  // If neither key is configured in settings, gracefully hide the social sign-in section entirely
  if (!googleClientId && !facebookAppId) {
    return null;
  }

  const dividerText = lang === "bn" ? "অথবা সোশ্যাল মিডিয়া" : "Or continue with";
  const isLoading = isGoogleLoading || isFacebookLoading;

  return (
    <div className="w-full mt-8 space-y-6">
      {/* Divider */}
      <div className="relative flex items-center justify-center my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/10"></div>
        </div>
        <span className="relative px-4 text-[9px] font-black text-muted-foreground bg-background uppercase tracking-[0.25em] z-10">
          {dividerText}
        </span>
      </div>

      {/* Action Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Google Dynamic Hook Button */}
        {googleClientId && (
          <GoogleOAuthProvider clientId={googleClientId}>
            <GoogleSignInButton
              isSubmitting={isGoogleLoading}
              setIsSubmitting={setIsGoogleLoading}
              lang={lang}
              loginWithGoogle={loginWithGoogle}
              onSuccessRedirect={onSuccessRedirect}
            />
          </GoogleOAuthProvider>
        )}

        {/* Facebook Dynamic Button */}
        {facebookAppId && (
          <motion.button
            whileHover={{ scale: isLoading ? 1 : 1.02 }}
            whileTap={{ scale: isLoading ? 1 : 0.98 }}
            type="button"
            disabled={isLoading}
            onClick={handleFacebookLogin}
            className="flex items-center justify-center gap-3 bg-[#1877F2] hover:bg-[#1565C0] text-white rounded-2xl px-6 py-4 transition-all text-xs font-black uppercase tracking-widest disabled:opacity-50 cursor-pointer shadow-lg w-full"
          >
            {isFacebookLoading ? (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            )}
            <span>Facebook</span>
          </motion.button>
        )}
      </div>
    </div>
  );
}
