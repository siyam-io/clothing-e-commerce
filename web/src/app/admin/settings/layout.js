"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import AdminPageHeader from "@/app/admin/_components/AdminPageHeader";
import { AdminPageContainer } from "@/app/admin/_components/AdminPageContainer";
import {
  Globe, Palette, Share2, Mail, Settings2,
  Cpu, MessageSquare, Layout as LayoutIcon,
  Truck, Shield, Key, Sparkles
} from "lucide-react";

export default function SettingsLayout({ children }) {
  const pathname = usePathname();

  const tabs = [
    { id: "branding", label: "Branding", href: "/admin/settings/branding", icon: Globe },
    { id: "theme", label: "Appearance", href: "/admin/settings/theme", icon: Palette },
    { id: "layout-builder", label: "Homepage Layout", href: "/admin/settings/layout-builder", icon: LayoutIcon },
    { id: "shipping", label: "Shipping Rates", href: "/admin/settings/shipping", icon: Truck },
    { id: "payment", label: "Payment Gateways", href: "/admin/settings/payment", icon: Settings2 },
    { id: "auth", label: "Authentication", href: "/admin/settings/auth", icon: Key },
    { id: "contact", label: "Contact Info", href: "/admin/settings/contact", icon: Mail },
    { id: "socials", label: "Social Links", href: "/admin/settings/socials", icon: Share2 },
    { id: "roles", label: "Roles & Access", href: "/admin/settings/roles", icon: Shield },
    { id: "ai", label: "AI Configuration", href: "/admin/settings/ai", icon: Sparkles },
    { id: "marketing", label: "Marketing & Pixels", href: "/admin/settings/marketing", icon: Cpu },
    { id: "smtp", label: "Email (SMTP)", href: "/admin/settings/smtp", icon: Mail },
    { id: "sms", label: "SMS Gateway", href: "/admin/settings/sms", icon: MessageSquare },
  ];

  const activeTab = tabs.find(tab => pathname.startsWith(tab.href)) || tabs[0];

  return (
    <AdminPageContainer className="space-y-6 pb-16">
      <AdminPageHeader
        title={activeTab.label}
        description="Configure store settings, integrations, and administration preferences"
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Settings", href: "/admin/settings/branding" },
          { label: activeTab.label },
        ]}
      />

      {/* Top Tab Navigation Bar */}
      <div className="border-b border-border/60 pb-1">
        <nav 
          className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none"
          style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
        >
          {tabs.map((tab) => {
            const isActive = pathname.startsWith(tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={cn(
                  "inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all shrink-0",
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                <Icon className={cn("size-3.5", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <main className="w-full">
        {children}
      </main>
    </AdminPageContainer>
  );
}
