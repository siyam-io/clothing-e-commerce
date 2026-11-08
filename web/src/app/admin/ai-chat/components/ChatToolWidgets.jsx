"use client";

import React from "react";
import {
  Search,
  Package,
  ShoppingCart,
  Ticket,
  Zap,
  User,
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Database,
  Users,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ChatToolWidgets({
  executions,
  msgIdx,
  setInputValue,
  handleUndo,
  undoneActions = {},
  undoing = {},
}) {
  if (!executions || executions.length === 0) return null;

  return (
    <div className="mt-4 space-y-3.5 w-full">
      {executions.map((exec, idx) => {
        if (exec.status !== "completed" || !exec.result) return null;
        const { name, result } = exec;

        // Widget 1: searchProducts
        if (name === "searchProducts" && result.success) {
          return (
            <div
              key={idx}
              className="border border-primary/20 bg-primary/5 rounded-xl p-4 shadow-inner w-full overflow-hidden backdrop-blur-sm"
            >
              <div className="flex items-center justify-between mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <span className="flex items-center gap-1.5">
                  <Search size={14} /> Catalog Query Results
                </span>
                <span className="bg-primary/20 px-2 py-0.5 rounded text-[10px]">
                  {result.count} Match
                </span>
              </div>
              {result.products?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-primary/10 text-muted-foreground">
                        <th className="py-2 pr-2 font-medium">Product</th>
                        <th className="py-2 px-2 font-medium">Price</th>
                        <th className="py-2 px-2 font-medium">Category</th>
                        <th className="py-2 px-2 font-medium">Status</th>
                        <th className="py-2 pl-2 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.products.map((prod) => (
                        <tr
                          key={prod.id}
                          className="border-b border-primary/5 hover:bg-primary/10 transition-colors"
                        >
                          <td className="py-2.5 pr-2 font-semibold text-foreground">{prod.name}</td>
                          <td className="py-2.5 px-2 font-mono text-foreground font-semibold">
                            ${prod.price}
                          </td>
                          <td className="py-2.5 px-2 text-muted-foreground">{prod.category}</td>
                          <td className="py-2.5 px-2">
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${
                                prod.isActive
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                  : "bg-destructive/10 text-destructive border border-destructive/20"
                              }`}
                            >
                              {prod.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="py-2.5 pl-2 text-right">
                            <button
                              onClick={() =>
                                setInputValue?.(`Update stock of product ID ${prod.id} for size M to 25`)
                              }
                              className="text-primary hover:opacity-80 hover:underline text-[10px] font-semibold cursor-pointer"
                            >
                              Edit Stock
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No matching products found.</p>
              )}
            </div>
          );
        }

        // Widget 2: Standard mutations
        const successWidgets = {
          updateProductStock: {
            label: "Stock Updated",
            icon: <Package size={16} className="text-emerald-500" />,
            color:
              "border-emerald-500/20 bg-emerald-500/5 text-emerald-800 dark:text-emerald-400",
          },
          updateOrderStatus: {
            label: "Order Status Sync",
            icon: <ShoppingCart size={16} className="text-emerald-500" />,
            color:
              "border-emerald-500/20 bg-emerald-500/5 text-emerald-800 dark:text-emerald-400",
          },
          createCoupon: {
            label: "Coupon Issued",
            icon: <Ticket size={16} className="text-emerald-500" />,
            color:
              "border-emerald-500/20 bg-emerald-500/5 text-emerald-800 dark:text-emerald-400",
          },
          toggleFlashSale: {
            label: "Flash Sale Promo",
            icon: <Zap size={16} className="text-purple-500" />,
            color:
              "border-purple-500/20 bg-purple-500/5 text-purple-800 dark:text-purple-400",
          },
          toggleUserStatus: {
            label: "User Access Change",
            icon: <User size={16} className="text-amber-500" />,
            color:
              "border-amber-500/20 bg-amber-500/5 text-amber-800 dark:text-amber-400",
          },
          updateProductSeo: {
            label: "SEO Metadata Live",
            icon: <Sparkles size={16} className="text-purple-500" />,
            color:
              "border-purple-500/20 bg-purple-500/5 text-purple-800 dark:text-purple-400",
          },
          createBlogDraft: {
            label: "Blog Drafted",
            icon: <BookOpen size={16} className="text-emerald-500" />,
            color:
              "border-emerald-500/20 bg-emerald-500/5 text-emerald-800 dark:text-emerald-400",
          },
          createProduct: {
            label: "Product Created",
            icon: <CheckCircle2 size={16} className="text-emerald-500" />,
            color:
              "border-emerald-500/20 bg-emerald-500/5 text-emerald-800 dark:text-emerald-400",
          },
          createOrder: {
            label: "Order Created",
            icon: <ShoppingCart size={16} className="text-emerald-500" />,
            color:
              "border-emerald-500/20 bg-emerald-500/5 text-emerald-800 dark:text-emerald-400",
          },
          updateOrder: {
            label: "Order Updated",
            icon: <ShoppingCart size={16} className="text-emerald-500" />,
            color:
              "border-emerald-500/20 bg-emerald-500/5 text-emerald-800 dark:text-emerald-400",
          },
          syncOrderToPathao: {
            label: "Pathao Synced",
            icon: <RefreshCw size={16} className="text-emerald-500" />,
            color:
              "border-emerald-500/20 bg-emerald-500/5 text-emerald-800 dark:text-emerald-400",
          },
          editProduct: {
            label: "Product Edited",
            icon: <Package size={16} className="text-emerald-500" />,
            color:
              "border-emerald-500/20 bg-emerald-500/5 text-emerald-800 dark:text-emerald-400",
          },
          updateProductSettings: {
            label: "Settings Updated",
            icon: <Package size={16} className="text-emerald-500" />,
            color:
              "border-emerald-500/20 bg-emerald-500/5 text-emerald-800 dark:text-emerald-400",
          },
          editCategory: {
            label: "Category Updated",
            icon: <CheckCircle2 size={16} className="text-emerald-500" />,
            color:
              "border-emerald-500/20 bg-emerald-500/5 text-emerald-800 dark:text-emerald-400",
          },
          createSubcategory: {
            label: "Subcategory Created",
            icon: <CheckCircle2 size={16} className="text-emerald-500" />,
            color:
              "border-emerald-500/20 bg-emerald-500/5 text-emerald-800 dark:text-emerald-400",
          },
          editSubcategory: {
            label: "Subcategory Updated",
            icon: <CheckCircle2 size={16} className="text-emerald-500" />,
            color:
              "border-emerald-500/20 bg-emerald-500/5 text-emerald-800 dark:text-emerald-400",
          },
          createBannerCampaign: {
            label: "Banner Created",
            icon: <Sparkles size={16} className="text-purple-500" />,
            color:
              "border-purple-500/20 bg-purple-500/5 text-purple-800 dark:text-purple-400",
          },
          editBannerCampaign: {
            label: "Banner Updated",
            icon: <Sparkles size={16} className="text-purple-500" />,
            color:
              "border-purple-500/20 bg-purple-500/5 text-purple-800 dark:text-purple-400",
          },
          createFlashSaleCampaign: {
            label: "Flash Sale Created",
            icon: <Zap size={16} className="text-purple-500" />,
            color:
              "border-purple-500/20 bg-purple-500/5 text-purple-800 dark:text-purple-400",
          },
          editFlashSaleCampaign: {
            label: "Flash Sale Updated",
            icon: <Zap size={16} className="text-purple-500" />,
            color:
              "border-purple-500/20 bg-purple-500/5 text-purple-800 dark:text-purple-400",
          },
          editCoupon: {
            label: "Coupon Updated",
            icon: <Ticket size={16} className="text-emerald-500" />,
            color:
              "border-emerald-500/20 bg-emerald-500/5 text-emerald-800 dark:text-emerald-400",
          },
          editBlog: {
            label: "Blog Updated",
            icon: <BookOpen size={16} className="text-emerald-500" />,
            color:
              "border-emerald-500/20 bg-emerald-500/5 text-emerald-800 dark:text-emerald-400",
          },
        };

        if (successWidgets[name]) {
          const config = successWidgets[name];
          const actionKey = `${msgIdx}_${idx}`;
          return (
            <div
              key={idx}
              className={`border rounded-xl p-3 flex items-start gap-2.5 shadow-sm text-xs backdrop-blur-sm ${
                result.success
                  ? config.color
                  : "border-destructive/20 bg-destructive/10 text-destructive"
              }`}
            >
              {result.success ? (
                <>
                  <div className="mt-0.5 shrink-0">{config.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold tracking-wide uppercase text-[10px] text-muted-foreground">
                      {config.label}
                    </p>
                    <p className="mt-0.5 font-medium">{result.message}</p>
                    {result.productId && (
                      <p className="text-[9px] font-mono text-muted-foreground mt-1">
                        ID: {result.productId}
                      </p>
                    )}
                    {result.blogId && (
                      <p className="text-[9px] font-mono text-muted-foreground mt-1">
                        ID: {result.blogId}
                      </p>
                    )}
                    {result.undoAction && (
                      <div className="mt-2.5 flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUndo?.(msgIdx, idx, result.undoAction)}
                          disabled={undoneActions[actionKey] || undoing[actionKey]}
                          className={cn(
                            "text-[10px] h-7 px-3 rounded-lg font-bold border transition-all bg-background text-foreground",
                            undoneActions[actionKey]
                              ? "bg-muted text-muted-foreground border-border cursor-not-allowed"
                              : "border-primary/25 hover:bg-muted hover:border-primary text-primary"
                          )}
                        >
                          {undoing[actionKey] ? (
                            <span className="flex items-center gap-1">
                              <Loader2 size={10} className="animate-spin" /> Undoing...
                            </span>
                          ) : undoneActions[actionKey] ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 size={10} className="text-emerald-500" /> Reverted
                            </span>
                          ) : (
                            "Undo Action"
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle size={16} className="text-destructive mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold tracking-wide uppercase text-[10px] text-destructive">
                      Execution Failed
                    </p>
                    <p className="mt-0.5 font-medium text-muted-foreground">{result.error}</p>
                  </div>
                </>
              )}
            </div>
          );
        }

        // Widget 3: getDashboardSummary
        if (name === "getDashboardSummary" && result.success) {
          return (
            <div
              key={idx}
              className="border border-indigo-500/20 bg-indigo-500/5 rounded-xl p-4 shadow-sm w-full backdrop-blur-sm"
            >
              <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
                <Database size={14} />
                <span>Real-time Telemetry Metrics</span>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                <div className="bg-background border border-border p-2.5 rounded-lg text-center shadow-sm">
                  <p className="text-[9px] text-muted-foreground uppercase font-semibold">
                    Total Revenue
                  </p>
                  <p className="text-base font-bold text-indigo-500 dark:text-indigo-400 font-mono mt-0.5">
                    ${result.totalRevenue?.toLocaleString()}
                  </p>
                </div>
                <div className="bg-background border border-border p-2.5 rounded-lg text-center shadow-sm">
                  <p className="text-[9px] text-muted-foreground uppercase font-semibold">
                    Total Orders
                  </p>
                  <p className="text-base font-bold text-foreground font-mono mt-0.5">
                    {result.ordersCount}
                  </p>
                </div>
                <div className="bg-background border border-border p-2.5 rounded-lg text-center shadow-sm">
                  <p className="text-[9px] text-muted-foreground uppercase font-semibold">
                    Products Catalog
                  </p>
                  <p className="text-base font-bold text-foreground font-mono mt-0.5">
                    {result.productsCount}
                  </p>
                </div>
                <div className="bg-background border border-border p-2.5 rounded-lg text-center shadow-sm">
                  <p className="text-[9px] text-muted-foreground uppercase font-semibold">
                    Stock Alerts
                  </p>
                  <p
                    className={`text-base font-bold font-mono mt-0.5 ${
                      result.criticalStockCount > 0 ? "text-amber-500 animate-pulse" : "text-emerald-500"
                    }`}
                  >
                    {result.criticalStockCount}
                  </p>
                </div>
              </div>

              {result.criticalItems && result.criticalItems.length > 0 && (
                <div className="mt-2.5">
                  <p className="text-[10px] uppercase tracking-wide font-semibold text-amber-500 mb-1.5 flex items-center gap-1">
                    <AlertCircle size={12} /> Low Stock Warnings:
                  </p>
                  <div className="text-[11px] space-y-1 bg-background/50 p-2.5 rounded border border-border">
                    {result.criticalItems.map((item, i) => (
                      <div key={i} className="flex justify-between">
                        <span className="text-muted-foreground">{item.name}</span>
                        <span className="font-bold text-amber-500">{item.stock} in stock</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        }

        // Widget 4: getRecentOrders
        if (name === "getRecentOrders" && result.success) {
          return (
            <div
              key={idx}
              className="border border-blue-500/20 bg-blue-500/5 rounded-xl p-4 shadow-sm w-full backdrop-blur-sm"
            >
              <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-blue-500 dark:text-blue-400">
                <ShoppingCart size={14} />
                <span>Recent Sales Transactions</span>
              </div>
              {result.orders?.length > 0 ? (
                <div className="space-y-2">
                  {result.orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="bg-background border border-border p-3 rounded-lg flex items-center justify-between text-xs hover:border-blue-500/30 transition-all"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-foreground">{ord.customer}</span>
                          <span className="text-[9px] text-muted-foreground font-mono bg-muted px-1.5 py-0.25 rounded">
                            #{ord.id?.slice(-6)}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {new Date(ord.createdAt).toLocaleDateString()} at{" "}
                          {new Date(ord.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="font-bold text-blue-500 dark:text-blue-400 font-mono text-xs">
                          ${ord.totalPrice}
                        </p>
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wide uppercase border ${
                            ord.orderStatus === "Completed"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : ord.orderStatus === "Processing"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                              : "bg-muted text-muted-foreground border-border"
                          }`}
                        >
                          {ord.orderStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No recent orders recorded.</p>
              )}
            </div>
          );
        }

        // Widget 5: searchCustomer
        if (name === "searchCustomer" && result.success) {
          return (
            <div
              key={idx}
              className="border border-teal-500/20 bg-teal-500/5 rounded-xl p-4 shadow-sm w-full backdrop-blur-sm"
            >
              <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-teal-500 dark:text-teal-400">
                <Users size={14} />
                <span>Found {result.count} Customers</span>
              </div>
              {result.users?.length > 0 ? (
                <div className="space-y-2">
                  {result.users.map((cust) => (
                    <div
                      key={cust._id}
                      className="bg-background border border-border p-3 rounded-lg flex items-center justify-between text-xs hover:border-teal-500/30 transition-all"
                    >
                      <div>
                        <p className="font-semibold text-foreground">{cust.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{cust.email}</p>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold border uppercase ${
                            cust.isActive
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : "bg-destructive/10 text-destructive border-destructive/20"
                          }`}
                        >
                          {cust.isActive ? "Active" : "Blocked"}
                        </span>
                        <button
                          onClick={() =>
                            setInputValue?.(`Toggle customer account status for user ID ${cust._id}`)
                          }
                          className="text-[9px] px-2 py-1 rounded bg-muted hover:bg-muted/80 text-foreground transition-all font-semibold cursor-pointer"
                        >
                          Toggle Ban
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No matching customers found.</p>
              )}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}

