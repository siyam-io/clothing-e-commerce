"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { getImageUrl } from "@/utils/imageUtils";
import Sidebar from "@/app/admin/_components/Sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/store/appStore";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import {
  Menu,
  Globe,
  Sun,
  Moon,
  LogOut,
  BarChart3,
  ShoppingBag,
  Package,
  Layers,
  Image,
  Zap,
  Ticket,
  FileText,
  Users,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";
import { hasAnyAdminPermission } from "@/utils/rbacUtils";
import { useQueryClient } from "@tanstack/react-query";
import { swalToast } from "@/utils/swal";

export default function AdminLayout({ children }) {
  const { user, token, isLoading: authLoading, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { theme, toggleTheme, isMounted, isAdminSidebarCollapsed } = useAppStore();
  const { socket, initSocket, disconnectSocket, fetchUnreadCount } = useChatStore();
  const queryClient = useQueryClient();
  useTheme();

  const [counts, setCounts] = useState(null);
  const [showStatsDropdown, setShowStatsDropdown] = useState(false);

  useEffect(() => {
    if (token) {
      api
        .get("/admin/counts")
        .then((res) => setCounts(res.data))
        .catch(() => {});
    }
  }, [token]);

  useEffect(() => {
    setShowStatsDropdown(false);
  }, [pathname]);

  const statItems = [
    {
      label: "Orders",
      count: counts?.orders,
      icon: ShoppingBag,
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20 dark:bg-emerald-500/20",
    },
    {
      label: "Products",
      count: counts?.products,
      icon: Package,
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20 dark:bg-blue-500/20",
    },
    {
      label: "Categories",
      count: counts?.categories,
      icon: Layers,
      color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20 dark:bg-indigo-500/20",
    },
    {
      label: "Banners",
      count: counts?.banners,
      icon: Image,
      color: "text-purple-500 bg-purple-500/10 border-purple-500/20 dark:bg-purple-500/20",
    },
    {
      label: "Flash Sales",
      count: counts?.flashSales,
      icon: Zap,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20 dark:bg-amber-500/20",
    },
    {
      label: "Coupons",
      count: counts?.coupons,
      icon: Ticket,
      color: "text-rose-500 bg-rose-500/10 border-rose-500/20 dark:bg-rose-500/20",
    },
    {
      label: "Blogs",
      count: counts?.blogs,
      icon: FileText,
      color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20 dark:bg-cyan-500/20",
    },
    {
      label: "Users",
      count: counts?.users,
      icon: Users,
      color: "text-teal-500 bg-teal-500/10 border-teal-500/20 dark:bg-teal-500/20",
    },
  ];

  const isChatRoute = pathname?.startsWith("/admin/chat");
  const isAiChatRoute = pathname === "/admin/ai-chat";
  const isPosRoute = pathname === "/admin/orders/new" || pathname === "/admin/orders/new/" || pathname === "/admin/pos" || pathname?.startsWith("/admin/pos");
  const showSidebar = true;
  const showHeader = !isChatRoute && !isAiChatRoute && !isPosRoute;
  const isFullPageStyle = isChatRoute || isAiChatRoute || isPosRoute;

  // Enforce administrative permissions
  useEffect(() => {
    const hasAdminAccess = hasAnyAdminPermission(user);

    if (!authLoading && (!user || !hasAdminAccess)) {
      router.replace("/");
    }

    if (user && hasAdminAccess && token) {
      initSocket(token);
      fetchUnreadCount();
    }

    return () => {
      disconnectSocket();
    };
  }, [user, authLoading, router, token, initSocket, disconnectSocket, fetchUnreadCount]);

  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (order) => {
      try {
        const audio = new Audio("/notification.wav");
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch {}

      swalToast(
        `New Order Received! #${order._id ? order._id.slice(-8).toUpperCase() : "SUCCESS"}`,
        "success"
      );

      queryClient.invalidateQueries({ queryKey: ["adminOrders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-recent-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });

      api
        .get("/admin/counts")
        .then((res) => setCounts(res.data))
        .catch(() => {});
    };

    const handleOrderUpdated = (data) => {
      queryClient.invalidateQueries({ queryKey: ["adminOrders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-recent-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      if (data?.orderId) {
        queryClient.invalidateQueries({ queryKey: ["adminOrder", data.orderId] });
      }

      api
        .get("/admin/counts")
        .then((res) => setCounts(res.data))
        .catch(() => {});
    };

    socket.on("new_order", handleNewOrder);
    socket.on("order_updated", handleOrderUpdated);

    return () => {
      socket.off("new_order", handleNewOrder);
      socket.off("order_updated", handleOrderUpdated);
    };
  }, [socket, queryClient]);

  const handleLogout = () => {
    if (socket) {
      socket.disconnect();
    }
    disconnectSocket();
    logout();
    router.push("/login");
  };

  if (authLoading || !isMounted) {
    return (
      <div className="flex min-h-[100dvh] lg:h-[100dvh] bg-background transition-colors duration-300">
        {showSidebar && (
          <div
            className={cn(
              "hidden lg:flex flex-col border-r border-border p-6 space-y-8 transition-all duration-300",
              isAdminSidebarCollapsed ? "w-20" : "w-72"
            )}
          >
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-2xl" />
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col lg:overflow-hidden">
          {showHeader && (
            <div className="h-20 border-b border-border px-10 flex items-center justify-between">
              <Skeleton className="h-8 w-48 rounded-full" />
              <div className="flex items-center gap-6">
                <Skeleton className="h-8 w-8 rounded-xl" />
                <Skeleton className="h-10 w-10 rounded-2xl" />
                <div className="hidden lg:block space-y-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-2 w-16" />
                </div>
              </div>
            </div>
          )}

          <div className={cn("flex-1 space-y-10", !isFullPageStyle ? "p-10" : "p-0")}>
            <Skeleton className="h-16 w-1/2 rounded-2xl" />
            <Skeleton className="h-[400px] w-full rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  const hasAdminAccess = hasAnyAdminPermission(user);
  if (!user || !hasAdminAccess) return null;

  return (
    <div className="flex min-h-[100dvh] lg:h-[100dvh] bg-background text-foreground transition-colors duration-300 lg:overflow-hidden">
      {/* Desktop Sidebar */}
      {showSidebar && (
        <Sidebar className="hidden lg:flex shrink-0 border-r border-sidebar-border" />
      )}

      <div className="flex-1 flex flex-col min-w-0 relative lg:h-full">
        {/* Top Header Bar */}
        {showHeader && (
          <header className="bg-background/70 backdrop-blur-2xl border-b border-border z-40 shrink-0">
            <div className="flex justify-between items-center px-4 md:px-10 py-3 md:py-6">
              <div className="flex items-center gap-3 md:gap-5">
                {/* Mobile Drawer Trigger */}
                <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                  <SheetTrigger asChild>
                    <button
                      className="lg:hidden p-2.5 text-foreground bg-muted rounded-xl active:scale-90 transition-all"
                      aria-label="Open sidebar navigation"
                    >
                      <Menu size={18} />
                    </button>
                  </SheetTrigger>
                  <SheetContent
                    side="left"
                    className="p-0 w-72 bg-sidebar border-r border-sidebar-border [&>button]:hidden"
                  >
                    <SheetHeader className="sr-only">
                      <SheetTitle>Admin Navigation</SheetTitle>
                      <SheetDescription>
                        Access administrative control panels and settings.
                      </SheetDescription>
                    </SheetHeader>
                    <Sidebar
                      className="border-none w-full"
                      collapsible={false}
                      onItemClick={() => setIsSidebarOpen(false)}
                    />
                  </SheetContent>
                </Sheet>

                <div className="hidden sm:flex items-center gap-3 bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                    Active
                  </span>
                </div>

                {/* Stats Hub Widget */}
                <div className="relative">
                  <button
                    onClick={() => setShowStatsDropdown(!showStatsDropdown)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95",
                      showStatsDropdown
                        ? "bg-foreground text-background border-foreground"
                        : "bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <BarChart3 size={11} />
                    <span>Stats Hub</span>
                  </button>

                  {showStatsDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowStatsDropdown(false)}
                      />
                      <div className="absolute left-0 mt-3 w-[290px] sm:w-[360px] bg-card/95 backdrop-blur-3xl border border-border rounded-3xl p-4 shadow-2xl animate-in fade-in duration-150 z-50">
                        <div className="flex items-center justify-between pb-3 border-b border-border/50 mb-3 text-foreground">
                          <span className="text-[10px] font-black uppercase tracking-wider">
                            Live Database Metrics
                          </span>
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {statItems.map((item, idx) => {
                            const IconComponent = item.icon;
                            return (
                              <div
                                key={idx}
                                className="flex items-center gap-3 p-2.5 rounded-2xl bg-muted/30 border border-border/30 hover:bg-muted/50 transition-all text-foreground"
                              >
                                <div
                                  className={cn(
                                    "p-2 rounded-xl border flex items-center justify-center shrink-0",
                                    item.color
                                  )}
                                >
                                  <IconComponent size={14} />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest truncate">
                                    {item.label}
                                  </p>
                                  <p className="text-sm font-black tabular-nums">
                                    {item.count ?? 0}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 md:gap-8">
                <div className="flex items-center gap-3 md:gap-6 border-r border-border pr-3 md:pr-8">
                  <Link
                    href="/"
                    prefetch={true}
                    className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors group"
                  >
                    <Globe size={14} className="opacity-50 group-hover:text-accent-secondary" />
                    <span className="hidden sm:inline">Go to Store</span>
                  </Link>

                  <button
                    onClick={toggleTheme}
                    className="p-2 rounded-xl bg-muted text-muted-foreground hover:text-foreground transition-all shadow-inner"
                    aria-label="Toggle theme color mode"
                  >
                    {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 md:h-10 md:w-10 rounded-xl md:rounded-2xl overflow-hidden bg-foreground text-background border border-border shadow-xl p-[1.5px] md:p-[2px]">
                    <div className="w-full h-full rounded-[0.5rem] md:rounded-[0.9rem] overflow-hidden">
                      {user?.avatar ? (
                        <img
                          src={getImageUrl(user.avatar)}
                          alt={user.name}
                          className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-300"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <span className="text-[10px] font-black">
                            {user?.name?.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="hidden lg:block">
                    <p className="text-xs font-semibold text-foreground tracking-tight">
                      {user?.name}
                    </p>
                    <p className="text-[11px] font-medium text-muted-foreground capitalize mt-0.5">
                      {user?.role?.name}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="text-muted-foreground hover:text-destructive transition-all hover:rotate-12"
                  title="Logout"
                  aria-label="Logout"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </header>
        )}

        {/* Content View Area */}
        <main
          className={cn(
            "flex-1 lg:overflow-y-auto no-scrollbar bg-background/50 lg:overscroll-y-contain",
            !isFullPageStyle ? "min-h-0" : "p-0 overflow-hidden"
          )}
        >
          <div
            className={cn(
              "mx-auto animate-in fade-in duration-150",
              !isFullPageStyle ? "max-w-none" : "max-w-none h-full"
            )}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
