"use client";

import React, { useState } from "react";
import {
  X,
  Activity,
  Terminal,
  Cpu,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const REGISTERED_TOOLS = [
  { name: "searchProducts", desc: "Search products in catalog" },
  { name: "updateProductStock", desc: "Update product stock levels" },
  { name: "getDashboardSummary", desc: "Retrieve dashboard business metrics" },
  { name: "getRecentOrders", desc: "List recent sales transactions" },
  { name: "createProduct", desc: "Create new product in catalog" },
  { name: "updateProductSeo", desc: "Save optimized SEO metadata" },
  { name: "updateOrderStatus", desc: "Update order delivery status" },
  { name: "createCoupon", desc: "Create discount coupon code" },
  { name: "listCoupons", desc: "List active discount coupons" },
  { name: "toggleFlashSale", desc: "Add/remove item from flash sale" },
  { name: "searchCustomer", desc: "Search customer profiles" },
  { name: "toggleUserStatus", desc: "Block or activate customer" },
  { name: "createBlogDraft", desc: "Draft marketing blog post" },
  { name: "createCategory", desc: "Create new product category" },
  { name: "listCategories", desc: "List all existing product categories" },
  { name: "createOrder", desc: "Create a new customer order manually" },
  { name: "updateOrder", desc: "Update shipping/payment/status details of an order" },
  { name: "getOrderDetails", desc: "View detailed information of an order" },
  { name: "listOrders", desc: "List all orders with status/search filtering" },
  { name: "syncOrderToPathao", desc: "Dispatch consignment details directly to Pathao Courier" },
  { name: "editProduct", desc: "Edit core settings/names/prices of catalog products" },
  { name: "updateProductSettings", desc: "Change visibility flags on products" },
  { name: "editCategory", desc: "Edit category titles/descriptions" },
  { name: "listSubcategories", desc: "View all subcategories" },
  { name: "createSubcategory", desc: "Create subcategory nested inside parent" },
  { name: "editSubcategory", desc: "Edit subcategory values" },
  { name: "listBannerCampaigns", desc: "View promotional banner lists" },
  { name: "createBannerCampaign", desc: "Launch new home slideshow" },
  { name: "editBannerCampaign", desc: "Configure slide links/images" },
  { name: "listFlashSales", desc: "View existing active flash sales" },
  { name: "createFlashSaleCampaign", desc: "Launch timed flash sale promotion" },
  { name: "editFlashSaleCampaign", desc: "Adjust duration/discount percentages of a sale" },
  { name: "editCoupon", desc: "Update properties/expiry details of coupon codes" },
  { name: "listBlogs", desc: "View editorial articles draft/live list" },
  { name: "editBlog", desc: "Modify title, slug, html or cover image of articles" },
];

export default function ChatSettingsDrawer({
  showRightSidebar,
  setShowRightSidebar,
  currentSessionId,
  sessionsCount = 0,
  quickCommands = [],
  onExecuteCommand,
}) {
  const [activeTab, setActiveTab] = useState("chat");

  if (!showRightSidebar) return null;

  return (
    <div
      className={cn(
        "w-full lg:w-72 bg-card/60 backdrop-blur-2xl p-4 flex flex-col border-l border-border shrink-0 transition-all duration-300 fixed lg:static inset-y-0 right-0 z-40"
      )}
    >
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Terminal size={14} /> Telemetry & Tools
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowRightSidebar(false)}
          className="rounded-lg h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <X size={14} />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border border-border rounded-lg p-1 bg-background text-xs gap-1 my-3">
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex-1 py-1.5 rounded-md font-semibold transition-all text-center cursor-pointer ${
            activeTab === "chat" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Telemetry
        </button>
        <button
          onClick={() => setActiveTab("tools")}
          className={`flex-1 py-1.5 rounded-md font-semibold transition-all text-center cursor-pointer ${
            activeTab === "tools" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          AI Tools
        </button>
        <button
          onClick={() => setActiveTab("commands")}
          className={`flex-1 py-1.5 rounded-md font-semibold transition-all text-center cursor-pointer ${
            activeTab === "commands" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Shortcuts
        </button>
      </div>

      {activeTab === "chat" ? (
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Status indicators */}
          <div className="border border-border rounded-xl p-4 bg-background/50 space-y-3.5 shadow-sm">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Activity size={12} /> Live Engine Status
            </h3>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Mongoose Sessions</span>
                <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                  <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-pulse" /> Linked
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Active Session</span>
                <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[100px]">
                  {currentSessionId ? `#${currentSessionId.slice(-6)}` : "New Session"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Gemini Core</span>
                <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                  <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-pulse" /> Active
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats Panel */}
          <div className="border border-border rounded-xl p-4 bg-background/50 flex-1 flex flex-col shadow-sm overflow-hidden">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 mb-2.5">
              <Terminal size={12} /> System Details
            </h3>
            <div className="text-[11px] font-mono text-muted-foreground space-y-1.5 overflow-y-auto flex-1 scrollbar-thin">
              <p className="text-primary font-bold"># auth token status verified</p>
              <p># database: clothing-ecommerce</p>
              <p># total saved sessions: {sessionsCount}</p>
              <p># model: gemini-2.5-flash</p>
              <p># function tools registered: {REGISTERED_TOOLS.length}</p>
              <p className="text-emerald-600 dark:text-emerald-400"># ready for instructions</p>
            </div>
          </div>
        </div>
      ) : activeTab === "tools" ? (
        <div className="flex-1 flex flex-col gap-3 overflow-hidden">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Cpu size={12} /> Registered Tools ({REGISTERED_TOOLS.length})
          </h3>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            {REGISTERED_TOOLS.map((tool, idx) => (
              <div
                key={idx}
                className="p-2 border border-border bg-background/50 rounded-lg hover:border-primary/20 transition-all flex flex-col gap-0.5"
              >
                <span className="text-[11px] font-mono font-bold text-primary">{tool.name}()</span>
                <span className="text-[10px] text-muted-foreground leading-snug">{tool.desc}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-3 overflow-hidden">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 mb-1">
            <Terminal size={12} /> Command Shortcuts
          </h3>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            {quickCommands.map((item, idx) => (
              <button
                key={idx}
                onClick={() => onExecuteCommand?.(item.prompt)}
                className="w-full text-left p-2.5 border border-border bg-background hover:bg-muted rounded-xl transition-all group flex flex-col gap-0.5 shadow-sm cursor-pointer"
              >
                <span className="text-xs font-bold text-foreground group-hover:text-primary flex items-center justify-between">
                  {item.cmd}
                  <ArrowUpRight
                    size={11}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </span>
                <span className="text-[10px] text-muted-foreground leading-snug">{item.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="text-[10px] text-muted-foreground font-mono text-center border-t border-border pt-3 mt-auto">
        Command Engine v1.1.0
      </div>
    </div>
  );
}
