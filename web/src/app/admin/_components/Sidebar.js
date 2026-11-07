"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppStore } from "@/store/appStore";
import { navGroups } from "@/utils/adminRoutes";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { hasPermission } from "@/utils/rbacUtils";

/**
 * Admin Sidebar component with instant prefetching on hover.
 */
export default function Sidebar({ className, onItemClick, collapsible = true }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { unreadCount } = useChatStore();
  const { settings, isAdminSidebarCollapsed, toggleAdminSidebar } = useAppStore();
  const branding = settings?.branding || {};
  const siteName = branding.siteName || "Store";
  const isCollapsed = collapsible && isAdminSidebarCollapsed;

  const filteredGroups = useMemo(() => {
    return navGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          if (!item.permission) return true;
          return hasPermission(user, item.permission);
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [user]);

  // Disambiguate active route: find the most specific match (longest matching href)
  const activeHref = useMemo(() => {
    const allHrefs = filteredGroups.flatMap((group) => group.items.map((i) => i.href));
    return (
      allHrefs
        .filter((href) => {
          if (href === "/admin") return pathname === "/admin";
          return pathname === href || pathname.startsWith(`${href}/`);
        })
        .sort((a, b) => b.length - a.length)[0] || null
    );
  }, [filteredGroups, pathname]);

  return (
    <aside
      className={cn(
        "admin-sidebar flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 ease-in-out shrink-0 select-none",
        isCollapsed ? "w-20" : "w-72",
        className
      )}
    >
      {/* Brand Header */}
      <div
        className={cn(
          "transition-opacity cursor-pointer border-b border-sidebar-border/30",
          isCollapsed ? "py-6 px-2 flex justify-center" : "p-6 lg:p-8",
          !collapsible && "cursor-default hover:opacity-100",
          collapsible && "hover:opacity-80 active:scale-95"
        )}
        onClick={collapsible ? toggleAdminSidebar : undefined}
        title={collapsible ? (isCollapsed ? "Expand Sidebar" : "Collapse Sidebar") : undefined}
      >
        <div className="flex items-center gap-3.5">
          <div className="min-w-10 w-10 h-10 bg-sidebar-primary rounded-2xl flex items-center justify-center shadow-xl shadow-black/20 shrink-0">
            <span className="text-sidebar-primary-foreground font-black italic text-lg leading-none">
              {siteName.charAt(0).toUpperCase()}
            </span>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 overflow-hidden whitespace-nowrap animate-in fade-in duration-200">
              <h2 className="text-sm font-black tracking-tighter uppercase text-sidebar-foreground leading-none truncate">
                {siteName}
              </h2>
              <span className="text-[8px] font-black uppercase tracking-[0.35em] text-muted-foreground mt-1 opacity-70">
                Admin Panel
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav
        className={cn(
          "flex-1 overflow-y-auto no-scrollbar py-4 space-y-8 overscroll-y-contain",
          isCollapsed ? "px-2" : "px-4"
        )}
      >
        {filteredGroups.map((group, groupIdx) => (
          <div key={groupIdx}>
            {!isCollapsed && (
              <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-[0.4em] mb-3 pl-3 animate-in fade-in duration-200">
                {group.label}
              </p>
            )}
            {isCollapsed && <div className="h-px bg-sidebar-border/20 mb-3 mx-2" />}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const isActive = item.href === activeHref;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      prefetch={true}
                      onMouseEnter={() => router.prefetch(item.href)}
                      onClick={onItemClick}
                      className={cn(
                        "sidebar-nav-item relative flex items-center rounded-2xl font-bold uppercase transition-all duration-150",
                        isCollapsed
                          ? "w-11 h-11 justify-center mx-auto p-0"
                          : "px-3.5 py-3 gap-3.5 text-[10px] tracking-[0.12em]",
                        isActive ? "sidebar-nav-item-active" : "sidebar-nav-item-inactive"
                      )}
                      title={isCollapsed ? item.name : ""}
                    >
                      <span
                        className={cn(
                          "flex items-center justify-center shrink-0 transition-transform duration-200",
                          isActive ? "scale-110" : "opacity-75 group-hover:opacity-100",
                          isCollapsed ? "text-lg" : ""
                        )}
                      >
                        {item.icon}
                      </span>
                      {!isCollapsed && (
                        <div className="flex-1 flex items-center justify-between min-w-0">
                          <span className="truncate">{item.name}</span>
                          {item.href === "/admin/chat" && unreadCount > 0 && (
                            <span className="flex h-5 min-w-[20px] px-1.5 items-center justify-center rounded-full bg-destructive text-[10px] font-black text-white shadow-md animate-in zoom-in duration-200">
                              {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                          )}
                        </div>
                      )}
                      {isCollapsed && item.href === "/admin/chat" && unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-destructive text-[8px] font-black text-white border-2 border-sidebar shadow-lg">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer Info */}
      <div className={cn("mt-auto", isCollapsed ? "p-2.5 py-4" : "p-4 lg:p-6")}>
        <div
          className={cn(
            "bg-sidebar-accent/50 rounded-2xl border border-sidebar-border/40",
            isCollapsed ? "p-2 flex justify-center" : "p-3.5"
          )}
        >
          {isCollapsed ? (
            <span className="text-[10px] font-black text-primary italic">V2</span>
          ) : (
            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.3em] text-center opacity-60 truncate">
              {siteName} Admin v2.0.6
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
