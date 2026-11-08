import QueryProvider from "@/components/providers/QueryProvider";
import { 
  Inter, 
  Roboto, 
  Outfit, 
  Playfair_Display, 
  Montserrat, 
  Space_Grotesk, 
  Poppins, 
  Syncopate,
  Hind_Siliguri 
} from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const roboto = Roboto({ weight: ["400", "700", "900"], subsets: ["latin"], variable: "--font-roboto" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });
const poppins = Poppins({ weight: ["400", "700", "900"], subsets: ["latin"], variable: "--font-poppins" });
const syncopate = Syncopate({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-syncopate" });
const hindSiliguri = Hind_Siliguri({ 
  weight: ["400", "500", "600", "700"], 
  subsets: ["bengali", "latin"], 
  variable: "--font-hind-siliguri",
  display: "swap" 
});

import { cookies, headers } from "next/headers";
import { getSettings } from "@/lib/settings";
import { getImageUrl } from "@/utils/imageUtils";
import Script from "next/script";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://clothing-e-commerce-web.vercel.app";

export async function generateMetadata() {
  const settings = await getSettings();
  const branding = settings?.branding || {};
  const siteName = branding.siteName || "Store";
  const siteTitle = branding.siteTitle || siteName;
  const favicon = branding.favicon ? getImageUrl(branding.favicon) : "/favicon.ico";
  const description = branding.description || `Discover the latest premium apparel at ${siteName}. Experience, expertise, and quality you can trust.`;
  const ogImage = (branding.logoDark || branding.logo) ? getImageUrl(branding.logoDark || branding.logo) : "/og-image.jpg";

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: siteTitle, template: `%s | ${siteName}` },
    description,
    keywords: ["streetwear", "urban fashion", siteName, "premium apparel", "sustainable fashion", "limited drops"],
    icons: { icon: [{ url: favicon }] },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: SITE_URL,
    },
    openGraph: {
      title: `${siteName} – Premium Urban Apparel`,
      description,
      url: SITE_URL,
      siteName: siteName,
      locale: 'en_US',
      type: 'website',
      images: [{ url: ogImage, width: 1200, height: 630, alt: siteName }],
    },
    twitter: {
      card: 'summary_large_image',
      title: siteTitle,
      description,
      images: [ogImage],
      creator: branding.twitterHandle || `@${siteName.toLowerCase().replace(/\s+/g, '_')}`,
    },
  };
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#ffffff",
};

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ClientInitialization from "@/components/layout/ClientInitialization";
import ThemeProvider from "./ThemeProvider";
import LayoutResolver from "@/components/layout/LayoutResolver";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import PixelManager, { GTMNoScript } from "@/lib/tracking/PixelManager";
import UploadProgressBar from "@/components/layout/UploadProgressBar";

export default async function RootLayout({ children }) {
  const settings = await getSettings();
  const cookieStore = await cookies();
  const branding = settings?.branding || {};
  
  const identityTheme = cookieStore.get("vanguard-identity-theme")?.value || branding.activeTheme || "executive";
  const colorMode = cookieStore.get("vanguard-theme-mode")?.value || branding.defaultTheme || "light";
  const lang = cookieStore.get("vanguard-lang")?.value || branding.defaultLanguage || "en";

  const headerList = await headers();
  const pathname = headerList.get("x-pathname") || "";

  const contact = settings?.contact || {};
  const siteName = branding.siteName || "Store";
  const isMaintenance = settings?.config?.maintenanceMode && !pathname.startsWith("/admin");
  const socialLinks = settings?.socialLinks?.filter(l => l.isActive).map(l => l.url) || [];

  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": siteName,
      "url": SITE_URL,
      "logo": branding.logo ? getImageUrl(branding.logo) : `${SITE_URL}/logo.png`,
      "sameAs": socialLinks,
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": contact.phone || "",
        "contactType": "customer service"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": siteName,
      "url": SITE_URL,
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${SITE_URL}/products?search={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "ClothingStore",
      "name": siteName,
      "url": SITE_URL,
      "logo": branding.logo ? getImageUrl(branding.logo) : `${SITE_URL}/logo.png`,
      "image": branding.logoDark ? getImageUrl(branding.logoDark) : "",
      "description": branding.description || "",
      "telephone": contact.phone || "",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": contact.address || "",
        "addressLocality": "Dhaka",
        "addressCountry": "BD"
      }
    }
  ];

  return (
    <html 
      lang={lang} 
      className={`${inter.variable} ${roboto.variable} ${outfit.variable} ${playfair.variable} ${montserrat.variable} ${spaceGrotesk.variable} ${poppins.variable} ${syncopate.variable} ${hindSiliguri.variable} ${colorMode}`} 
      data-theme={identityTheme}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        {schemas.map((schema, i) => (
          <script 
            key={i}
            type="application/ld+json" 
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} 
          />
        ))}
        {settings?.marketing?.gtmId && !pathname.startsWith("/admin") && (
          <Script
            id="gtm-script"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${settings.marketing.gtmId.trim()}');`,
            }}
          />
        )}
        {!pathname.startsWith("/admin") && <GTMNoScript marketing={settings?.marketing} />}
        <QueryProvider>
          <TooltipProvider>
            <ClientInitialization initialSettings={settings} initialLang={lang} initialTheme={colorMode} />
            <ThemeProvider>
              {isMaintenance ? (
                <div className="min-h-screen flex items-center justify-center">Maintenance Mode</div>
              ) : (
                <div className="layout-root">
                  <LayoutResolver theme={identityTheme}>{children}</LayoutResolver>
                </div>
              )}
            </ThemeProvider>
            <Toaster position="top-right" richColors />
            <UploadProgressBar />
            {!pathname.startsWith("/admin") && (
              <PixelManager marketing={settings?.marketing} />
            )}
          </TooltipProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
