import {
  LayoutDashboard,
  ShoppingBag,
  Store,
  Shirt,
  FolderTree,
  Zap,
  Ticket,
  Users,
  User,
  Settings,
  Bold,
  MessageCircle,
  Sparkles,
  Layout,
  Shield,
} from "lucide-react";
import React from "react";

export const navGroups = [
  {
    label: "Management",
    items: [
      { name: "Dashboard", href: "/admin", icon: <LayoutDashboard size={18} />, permission: ["dashboard:view", "reports:view"] },
      { name: "POS System", href: "/admin/orders/new", icon: <Store size={18} className="text-amber-500" />, permission: "orders:view" },
      { name: "Orders", href: "/admin/orders", icon: <ShoppingBag size={18} />, permission: "orders:view" },
      { name: "Products", href: "/admin/products", icon: <Shirt size={18} />, permission: "products:view" },
      { name: "Categories", href: "/admin/categories", icon: <FolderTree size={18} />, permission: "categories:view" },
      { name: "Live Chat", href: "/admin/chat", icon: <MessageCircle size={18} />, permission: "chat:view" },
      { name: "Manage with AI", href: "/admin/ai-chat", icon: <Sparkles size={18} className="text-purple-500 animate-pulse" />, permission: "ai-chat:view" },
    ]
  },
  {
    label: "Marketing & Content",
    items: [
      { name: "Banners", href: "/admin/banner-campaigns", icon: <Sparkles size={18} />, permission: "banner-campaigns:view" },
      { name: "Flash Sales", href: "/admin/flash-sales", icon: <Zap size={18} />, permission: "flash-sales:view" },
      { name: "Coupons", href: "/admin/coupons", icon: <Ticket size={18} />, permission: "coupons:view" },
      { name: "Blog", href: "/admin/blog", icon: <Bold size={18} />, permission: "blogs:view" },
    ]
  },
  {
    label: "Settings & Users",
    items: [
      { name: "Users", href: "/admin/users", icon: <Users size={18} />, permission: "users:view" },
      { name: "Profile", href: "/admin/profile", icon: <User size={18} /> }, 
      { name: "Settings", href: "/admin/settings", icon: <Settings size={18} />, permission: "settings:view" },
    ]
  }
];

/**
 * Finds the first route a user is authorized to visit.
 */
export const getFirstAllowedRoute = (user, hasPermission) => {
  for (const group of navGroups) {
    for (const item of group.items) {
      if (!item.permission || hasPermission(user, item.permission)) {
        return item.href;
      }
    }
  }
  return null;
};

