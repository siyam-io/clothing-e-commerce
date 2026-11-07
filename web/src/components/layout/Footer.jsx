"use client";

import { useMemo } from "react";
import Link from "next/link";
import { 
  Globe, Mail, Sparkles, Send, Share2, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/appStore";
import { getTranslation } from "@/utils/typography/handler";
import { getImageUrl } from "@/utils/imageUtils";

// Custom Social SVGs to avoid library version issues
const FacebookIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
);
const InstagramIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
);
const TwitterIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-1 2.17-2.41 3.06a8.84 8.84 0 0 1-16.58 5.48A10.74 10.74 0 0 0 12 12a10.74 10.74 0 0 1-7.14 7.64 8.84 8.84 0 0 0 16.58-5.48A10.74 10.74 0 0 0 22 4z"/></svg>
);
const LinkedinIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
);
const TikTokIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>
);

const PLATFORM_ICONS = {
  facebook: FacebookIcon,
  fb: FacebookIcon,
  instagram: InstagramIcon,
  insta: InstagramIcon,
  twitter: TwitterIcon,
  x: TwitterIcon,
  linkedin: LinkedinIcon,
  tiktok: TikTokIcon,
  "tik-tok": TikTokIcon,
  youtube: Globe,
  globe: Globe,
};

export default function Footer() {
  const { lang, settings, theme } = useAppStore();
  const branding = settings?.branding || {};
  const socialLinks = settings?.socialLinks || [];
  const t = useMemo(() => getTranslation('footer', lang), [lang]);

  const activeSocials = useMemo(() => 
    socialLinks.filter(link => link.isActive && link.url), 
    [socialLinks]
  );

  const contact = settings?.contact || {};

  const footerSections = useMemo(() => [
    {
      title: t.explore,
      links: [
        { label: t.home, href: "/" },
        { label: t.products, href: "/products" },
        { label: t.flashSale, href: "/flash-sale" },
        { label: t.blog, href: "/blog" },
      ],
    },
    {
      title: t.support,
      links: [
        { label: t.profile, href: "/profile" },
        { label: t.wishlist, href: "/wishlist" },
        { label: t.cart, href: "/cart" },
        { label: t.liveSupport, href: "/live-support" },
      ],
    },
    {
      title: t.contact,
      links: [
        { label: `${t.phone}: ${contact.phone || "N/A"}`, href: `tel:${contact.phone}`, isStatic: true },
        { label: `${t.email}: ${contact.email || "N/A"}`, href: `mailto:${contact.email}`, isStatic: true },
        { label: `${t.whatsapp || "WhatsApp"}: ${contact.whatsapp || "N/A"}`, href: `https://wa.me/${contact.whatsapp?.replace(/\D/g, '')}`, isStatic: true },
        { label: `${t.address}: ${contact.address || "N/A"}`, href: "#", isStatic: true },
      ],
    },
  ], [t, contact]);

  return (
    <footer className="bg-background text-foreground border-t border-border/5 pt-16 pb-12 px-6 lg:px-12 overflow-hidden relative w-full">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[300px] bg-accent-secondary/5 blur-[100px] rounded-full -z-10" />
      
      <div className="max-w-screen-2xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-20">
          {/* Brand Engine */}
          <div className="lg:col-span-5 space-y-8">
            <Link href="/" className="flex items-center gap-3 group relative">
               <div className="absolute -inset-4 bg-accent-secondary/10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
               {branding.logo || branding.logoDark ? (
                 <img 
                   src={getImageUrl(theme === 'dark' ? (branding.logoDark || branding.logo) : (branding.logo || branding.logoDark))} 
                   alt={branding.siteName} 
                   className={`h-18 md:h-24 lg:h-32 w-auto object-contain transition-transform group-hover:scale-105 duration-500 relative z-10 ${theme === 'dark' ? 'invert' : ''}`}
                 />
               ) : (
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-foreground rounded-xl flex items-center justify-center text-background shadow-2xl relative z-10">
                     <Sparkles size={20} />
                   </div>
                   <span className="font-heading font-black tracking-wider text-xl uppercase text-foreground relative z-10">
                     {branding.siteName || "Store"}
                   </span>
                 </div>
               )}
            </Link>
            <p className="text-sm md:text-base font-medium text-foreground/80 leading-relaxed max-w-md">
              {branding.description || t.description}
            </p>
            <div className="flex items-center gap-4">
              {activeSocials.length > 0 ? (
                activeSocials.map((link, i) => {
                  const Icon = PLATFORM_ICONS[link.platform?.toLowerCase()] || Globe;
                  return (
                    <Link 
                      key={i} 
                      href={link.url || "#"} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-xl glass flex items-center justify-center text-foreground hover:bg-foreground hover:text-background transition-all duration-300 shadow-sm border-border/10"
                      aria-label={link.platform || "Social Media Link"}
                    >
                      <Icon size={18} />
                    </Link>
                  );
                })
              ) : (
                <p className="text-[8px] font-black uppercase tracking-[0.4em] text-muted-foreground opacity-40">Connecting...</p>
              )}
            </div>
          </div>

          {/* Link Matrix */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-10">
            {footerSections.map((section) => (
              <div key={section.title} className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/80">
                  {section.title}
                </h4>
                <nav aria-label={`${section.title} navigation`}>
                  <ul className="space-y-3">
                    {section.links.map((link) => (
                      <li key={link.label}>
                        <Link 
                          href={link.href}
                          className="text-[11px] font-bold uppercase tracking-widest text-foreground/70 hover:text-foreground transition-all flex items-center gap-2 group"
                        >
                          <span className="h-px w-0 bg-accent-secondary group-hover:w-2 transition-all duration-300" />
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            ))}
          </div>
        </div>

        {/* Newsletter Terminal */}
        <div className="mt-16 p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] bg-muted/20 border border-border/5 relative overflow-hidden group">
          <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8">
             <div className="space-y-2 text-center lg:text-left">
                <h3 className="text-2xl md:text-4xl font-black uppercase tracking-tighter leading-none">{t.newsletter}</h3>
                <p className="text-muted-foreground font-bold uppercase tracking-[0.1em] text-[10px]">{t.newsletterSub}</p>
             </div>
             <div className="w-full max-w-md">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <Input 
                    placeholder={t.emailPlaceholder} 
                    className="h-12 rounded-2xl bg-background/50 border-border/50 px-6 font-bold text-[11px] uppercase tracking-widest focus-visible:ring-1 focus-visible:ring-foreground transition-all w-full"
                    aria-label="Email for newsletter"
                  />
                  <Button 
                    className="h-12 w-full sm:w-auto rounded-2xl bg-foreground text-background hover:bg-accent-secondary hover:text-white transition-all px-8 shadow-xl"
                    aria-label="Subscribe"
                  >
                    <Mail size={14} className="mr-2" />
                    <span className="font-black uppercase text-[10px] tracking-widest">{t.subscribe}</span>
                  </Button>
                </div>
             </div>
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-border/5">
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
              <p className="text-[9px] font-bold uppercase tracking-widest text-foreground/60">Systems Active {branding.siteName || "Store"} v4.2</p>
           </div>
           <div className="flex items-center gap-6 md:gap-10">
              <Link href="/terms" className="text-[9px] font-bold uppercase tracking-widest text-foreground/60 hover:text-foreground transition-colors">{t.legal}</Link>
              <Link href="/privacy" className="text-[9px] font-bold uppercase tracking-widest text-foreground/60 hover:text-foreground transition-colors">{t.privacy}</Link>
               <p className="text-[9px] font-bold uppercase tracking-widest text-foreground/60">© 2026 {branding.siteName || "Store"}</p>
           </div>
        </div>
      </div>
    </footer>
  );
}