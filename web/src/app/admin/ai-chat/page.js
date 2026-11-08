"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Database,
  ArrowUpRight,
  Info,
  Ticket,
  Zap,
  Users,
  User,
  BookOpen,
  Search,
  ShoppingCart,
  Cpu,
  RefreshCw,
  Terminal,
  Activity,
  ArrowLeft,
  Package,
  Menu,
  X,
  Paperclip,
  Trash2,
  Plus,
  MessageSquare,
  PanelLeft,
  Edit3,
  Check
} from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { hasPermission } from "@/utils/rbacUtils";
import { swalConfirm, swalToast, swalError } from "@/utils/swal";

const DEFAULT_GREETING = {
  role: "model",
  content: "Hello! I am your AI store assistant. I have direct access to your catalog, orders, and promotion tools. How can I assist you today?",
};

export default function AdminAiChatPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user && !hasPermission(user, ["ai-chat:view", "all"])) {
      router.replace("/admin");
    }
  }, [user, router]);

  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  const [searchSessionQuery, setSearchSessionQuery] = useState("");
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingSessionTitle, setEditingSessionTitle] = useState("");

  const [messages, setMessages] = useState([DEFAULT_GREETING]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("chat"); // chat or commands
  const messagesEndRef = useRef(null);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef(null);

  const [imagePreview, setImagePreview] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  const [undoneActions, setUndoneActions] = useState({});
  const [undoing, setUndoing] = useState({});

  const userId = user?._id || user?.id;

  // Load all conversation sessions
  const fetchSessions = async (autoSelect = true) => {
    try {
      setSessionsLoading(true);
      const res = await api.get("/admin/ai-chat/sessions");
      if (res.data?.success && Array.isArray(res.data.sessions)) {
        setSessions(res.data.sessions);
        if (autoSelect && res.data.sessions.length > 0) {
          handleSelectSession(res.data.sessions[0].id);
        } else if (res.data.sessions.length === 0) {
          handleNewChat();
        }
      }
    } catch (err) {
      console.error("Failed to load sessions:", err);
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchSessions(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleSelectSession = async (sessionId) => {
    if (sessionId === currentSessionId && messages.length > 1) return;
    setCurrentSessionId(sessionId);
    setError(null);
    setMessagesLoading(true);

    try {
      const res = await api.get(`/admin/ai-chat/sessions/${sessionId}`);
      if (res.data?.success && Array.isArray(res.data.messages)) {
        if (res.data.messages.length > 0) {
          setMessages(res.data.messages);
        } else {
          setMessages([DEFAULT_GREETING]);
        }
      }
    } catch (err) {
      console.error("Failed to load session messages:", err);
      swalError("Load Failed", "Could not load conversation messages.");
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([DEFAULT_GREETING]);
    setInputValue("");
    setError(null);
    setImagePreview(null);
    setUploadedImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation();
    const confirmed = await swalConfirm(
      "Delete Conversation?",
      "This chat session and its history will be permanently deleted.",
      "warning"
    );
    if (!confirmed) return;

    try {
      await api.delete(`/admin/ai-chat/sessions/${sessionId}`);
      const updated = sessions.filter((s) => s.id !== sessionId);
      setSessions(updated);
      swalToast("Conversation deleted");

      if (currentSessionId === sessionId) {
        if (updated.length > 0) {
          handleSelectSession(updated[0].id);
        } else {
          handleNewChat();
        }
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
      swalError("Delete Failed", err.response?.data?.message || "Failed to delete conversation.");
    }
  };

  const handleStartRenameSession = (session) => {
    setEditingSessionId(session.id);
    setEditingSessionTitle(session.title || "");
  };

  const handleSaveRenameSession = async (sessionId) => {
    if (!editingSessionTitle.trim()) {
      setEditingSessionId(null);
      return;
    }

    try {
      await api.patch(`/admin/ai-chat/sessions/${sessionId}`, {
        title: editingSessionTitle.trim(),
      });
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, title: editingSessionTitle.trim() } : s))
      );
      setEditingSessionId(null);
    } catch (err) {
      console.error("Failed to rename session:", err);
      swalError("Rename Failed", err.response?.data?.message || "Failed to rename session.");
    }
  };

  const handleClearAllHistory = async () => {
    const confirmed = await swalConfirm(
      "Clear All Conversations?",
      "All your previous chats and sessions will be permanently deleted.",
      "warning"
    );
    if (!confirmed) return;

    try {
      await api.delete("/admin/ai-chat/history");
      setSessions([]);
      handleNewChat();
      swalToast("All conversations cleared");
    } catch (err) {
      console.error("Failed to clear chat history:", err);
      swalError("Clear Failed", err.response?.data?.message || "Failed to clear history.");
    }
  };

  const handleUndo = async (msgIdx, execIdx, undoAction) => {
    const actionKey = `${msgIdx}_${execIdx}`;
    setUndoing(prev => ({ ...prev, [actionKey]: true }));
    try {
      const response = await api.post("/admin/ai-chat/undo", undoAction);
      if (response.data && response.data.success) {
        setUndoneActions(prev => ({ ...prev, [actionKey]: true }));
      } else {
        throw new Error(response.data?.message || "Failed to revert action");
      }
    } catch (err) {
      console.error(err);
      alert("Undo failed: " + (err.response?.data?.message || err.message));
    } finally {
      setUndoing(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  const suggestionChips = [
    { label: "📊 Store Summary", prompt: "Give me the store business summary and dashboard metrics" },
    { label: "🛒 Recent Orders", prompt: "Show me the last 5 recent orders in the store" },
    { label: "🔍 Search Products", prompt: "Search products for 'Shirt' in the catalog" },
    { label: "💡 Stock Alerts", prompt: "Check for any critical or low stock inventory alerts" },
    { label: "🎟️ Create Coupon", prompt: "Create a 15% discount coupon 'FLASH15' with 100 usage limits valid for 30 days" },
  ];

  const quickCommands = [
    { cmd: "Dashboard Summary", desc: "View total revenue, orders, and stock warnings", prompt: "Give me the store business summary" },
    { cmd: "Recent Sales List", desc: "List recent orders with status", prompt: "Show me the last 5 recent orders" },
    { cmd: "Low Stock Alert", desc: "Check if any items are running low", prompt: "Check for any critical or low stock inventory alerts" },
    { cmd: "Create Coupon", desc: "Generate a new active store coupon code", prompt: "Create a 15% discount coupon 'FLASH15' with 100 usage limits valid for 30 days" },
    { cmd: "Active Coupons List", desc: "Check current store coupon promotions", prompt: "List active coupons in the store" },
    { cmd: "List Orders", desc: "Retrieve list of all store orders", prompt: "List all orders" },
    { cmd: "Search Products", desc: "Search clothing products in the catalog", prompt: "Search products for 'Shirt'" },
    { cmd: "List Categories", desc: "Show all existing product categories", prompt: "List all existing product categories" },
    { cmd: "List Subcategories", desc: "Show all subcategories in the system", prompt: "List all subcategories" },
    { cmd: "Banner Campaigns", desc: "View sliding home banner campaigns", prompt: "List all banner campaigns" },
    { cmd: "Flash Sales List", desc: "List all flash sale campaigns", prompt: "List all flash sales" },
    { cmd: "List Blogs", desc: "Review fashion and marketing blog posts", prompt: "List all blog articles" }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Lock body/html scroll on mobile devices and adjust container size via Visual Viewport API
  useEffect(() => {
    if (typeof window === "undefined") return;
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyHeight = document.body.style.height;
    const originalHtmlHeight = document.documentElement.style.height;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.style.height = "100%";
    document.documentElement.style.height = "100%";

    // Prevent body/document scrolling
    const preventScroll = () => {
      window.scrollTo(0, 0);
    };
    window.addEventListener("scroll", preventScroll);

    // Visual Viewport resize handler for mobile keyboards
    const handleVisualResize = () => {
      if (!window.visualViewport) return;
      const viewport = window.visualViewport;
      const container = document.getElementById("admin-ai-chat-container");
      if (container) {
        container.style.height = `${viewport.height}px`;
        container.style.top = `${viewport.offsetTop}px`;
      }
      // Scroll to bottom when keyboard opens
      if (window.innerHeight - viewport.height > 50) {
        setTimeout(() => scrollToBottom(), 100);
      }
    };

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (window.visualViewport && isMobile) {
      window.visualViewport.addEventListener("resize", handleVisualResize);
      window.visualViewport.addEventListener("scroll", handleVisualResize);
      // Run once
      handleVisualResize();
    }

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.height = originalBodyHeight;
      document.documentElement.style.height = originalHtmlHeight;

      window.removeEventListener("scroll", preventScroll);
      if (window.visualViewport && isMobile) {
        window.visualViewport.removeEventListener("resize", handleVisualResize);
        window.visualViewport.removeEventListener("scroll", handleVisualResize);
      }
    };
  }, []);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    setError(null);
    setImagePreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await api.post("/admin/ai-chat/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (res.data && res.data.success) {
        setUploadedImageUrl(res.data.url);
      } else {
        throw new Error(res.data?.message || "Upload failed");
      }
    } catch (err) {
      console.error("Image upload failed:", err);
      setError("Failed to upload image. Please try again.");
      setImagePreview(null);
      setUploadedImageUrl(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputValue).trim();
    if (!query || cooldown > 0) return;

    if (!textToSend) setInputValue("");
    setError(null);
    setLoading(true);

    const userMessage = {
      role: "user",
      content: query,
      image: uploadedImageUrl || null,
      createdAt: new Date().toISOString(),
    };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    // Reset image states immediately
    setImagePreview(null);
    setUploadedImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    try {
      const response = await api.post("/admin/ai-chat", {
        sessionId: currentSessionId,
        messages: updatedMessages.map(msg => ({
          role: msg.role,
          content: msg.content,
          image: msg.image || null
        }))
      });

      if (response.data && response.data.success) {
        const modelMessage = {
          role: "model",
          content: response.data.reply,
          toolExecutions: response.data.toolExecutions || [],
          createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, modelMessage]);

        const respSessionId = response.data.sessionId;
        const respSessionTitle = response.data.sessionTitle || query.slice(0, 36);

        if (!currentSessionId && respSessionId) {
          setCurrentSessionId(respSessionId);
          setSessions(prev => [
            {
              id: respSessionId,
              title: respSessionTitle,
              lastMessage: response.data.reply?.slice(0, 80) || "",
              updatedAt: new Date().toISOString(),
            },
            ...prev
          ]);
        } else if (currentSessionId) {
          setSessions(prev =>
            prev.map(s =>
              s.id === currentSessionId
                ? {
                  ...s,
                  title: respSessionTitle || s.title,
                  lastMessage: response.data.reply?.slice(0, 80) || s.lastMessage,
                  updatedAt: new Date().toISOString(),
                }
                : s
            )
          );
        }

        // Short cooldown between successful requests to stay under free tier limits
        startCooldown(4);
      } else {
        throw new Error(response.data?.message || "Failed to get reply from AI");
      }
    } catch (err) {
      console.error(err);
      const status = err.response?.status;
      const errMsg = err.response?.data?.message || err.message || "AI connection failure. Please confirm your GEMINI_API_KEY is configured in your Settings or environment variables.";
      setError(errMsg);
      // Longer cooldown on rate limit to let quota reset
      if (status === 429) {
        startCooldown(30);
      }
    } finally {
      setLoading(false);
    }
  };

  const startCooldown = (seconds) => {
    setCooldown(seconds);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current);
          cooldownRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredSessions = sessions.filter((s) =>
    (s.title || "").toLowerCase().includes((searchSessionQuery || "").toLowerCase())
  );
  const currentSession = sessions.find((s) => s.id === currentSessionId);

  const renderToolWidgets = (executions, msgIdx) => {
    if (!executions || executions.length === 0) return null;

    return (
      <div className="mt-4 space-y-3.5 w-full">
        {executions.map((exec, idx) => {
          if (exec.status !== "completed" || !exec.result) return null;
          const { name, result } = exec;

          // Widget 1: searchProducts
          if (name === "searchProducts" && result.success) {
            return (
              <div key={idx} className="border border-primary/20 bg-primary/5 rounded-xl p-4 shadow-inner w-full overflow-hidden backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
                  <span className="flex items-center gap-1.5"><Search size={14} /> Catalog Query Results</span>
                  <span className="bg-primary/20 px-2 py-0.5 rounded text-[10px]">{result.count} Match</span>
                </div>
                {result.products.length > 0 ? (
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
                          <tr key={prod.id} className="border-b border-primary/5 hover:bg-primary/10 transition-colors">
                            <td className="py-2.5 pr-2 font-semibold text-foreground">{prod.name}</td>
                            <td className="py-2.5 px-2 font-mono text-foreground font-semibold">${prod.price}</td>
                            <td className="py-2.5 px-2 text-muted-foreground">{prod.category}</td>
                            <td className="py-2.5 px-2">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${prod.isActive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" : "bg-destructive/10 text-destructive border border-destructive/20"}`}>
                                {prod.isActive ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="py-2.5 pl-2 text-right">
                              <button
                                onClick={() => setInputValue(`Update stock of product ID ${prod.id} for size M to 25`)}
                                className="text-primary hover:opacity-80 hover:underline text-[10px] font-semibold"
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

          // Widget 2: updateProductStock / updateOrderStatus / createCoupon / toggleFlashSale / toggleUserStatus / updateProductSeo / createBlogDraft
          const successWidgets = {
            updateProductStock: { label: "Stock Updated", icon: <Package size={16} className="text-emerald-500" />, color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-800 dark:text-emerald-400" },
            updateOrderStatus: { label: "Order Status Sync", icon: <ShoppingCart size={16} className="text-emerald-500" />, color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-800 dark:text-emerald-400" },
            createCoupon: { label: "Coupon Issued", icon: <Ticket size={16} className="text-emerald-500" />, color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-800 dark:text-emerald-400" },
            toggleFlashSale: { label: "Flash Sale Promo", icon: <Zap size={16} className="text-purple-500" />, color: "border-purple-500/20 bg-purple-500/5 text-purple-800 dark:text-purple-400" },
            toggleUserStatus: { label: "User Access Change", icon: <User size={16} className="text-amber-500" />, color: "border-amber-500/20 bg-amber-500/5 text-amber-800 dark:text-amber-400" },
            updateProductSeo: { label: "SEO Metadata Live", icon: <Sparkles size={16} className="text-purple-500" />, color: "border-purple-500/20 bg-purple-500/5 text-purple-800 dark:text-purple-400" },
            createBlogDraft: { label: "Blog Drafted", icon: <BookOpen size={16} className="text-emerald-500" />, color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-800 dark:text-emerald-400" },
            createProduct: { label: "Product Created", icon: <CheckCircle2 size={16} className="text-emerald-500" />, color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-800 dark:text-emerald-400" },
            createOrder: { label: "Order Created", icon: <ShoppingCart size={16} className="text-emerald-500" />, color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-800 dark:text-emerald-400" },
            updateOrder: { label: "Order Updated", icon: <ShoppingCart size={16} className="text-emerald-500" />, color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-800 dark:text-emerald-400" },
            syncOrderToPathao: { label: "Pathao Synced", icon: <RefreshCw size={16} className="text-emerald-500" />, color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-800 dark:text-emerald-400" },
            editProduct: { label: "Product Edited", icon: <Package size={16} className="text-emerald-500" />, color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-800 dark:text-emerald-400" },
            updateProductSettings: { label: "Settings Updated", icon: <Package size={16} className="text-emerald-500" />, color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-800 dark:text-emerald-400" },
            editCategory: { label: "Category Updated", icon: <CheckCircle2 size={16} className="text-emerald-500" />, color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-800 dark:text-emerald-400" },
            createSubcategory: { label: "Subcategory Created", icon: <CheckCircle2 size={16} className="text-emerald-500" />, color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-800 dark:text-emerald-400" },
            editSubcategory: { label: "Subcategory Updated", icon: <CheckCircle2 size={16} className="text-emerald-500" />, color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-800 dark:text-emerald-400" },
            createBannerCampaign: { label: "Banner Created", icon: <Sparkles size={16} className="text-purple-500" />, color: "border-purple-500/20 bg-purple-500/5 text-purple-800 dark:text-purple-400" },
            editBannerCampaign: { label: "Banner Updated", icon: <Sparkles size={16} className="text-purple-500" />, color: "border-purple-500/20 bg-purple-500/5 text-purple-800 dark:text-purple-400" },
            createFlashSaleCampaign: { label: "Flash Sale Created", icon: <Zap size={16} className="text-purple-500" />, color: "border-purple-500/20 bg-purple-500/5 text-purple-800 dark:text-purple-400" },
            editFlashSaleCampaign: { label: "Flash Sale Updated", icon: <Zap size={16} className="text-purple-500" />, color: "border-purple-500/20 bg-purple-500/5 text-purple-800 dark:text-purple-400" },
            editCoupon: { label: "Coupon Updated", icon: <Ticket size={16} className="text-emerald-500" />, color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-800 dark:text-emerald-400" },
            editBlog: { label: "Blog Updated", icon: <BookOpen size={16} className="text-emerald-500" />, color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-800 dark:text-emerald-400" }
          };

          if (successWidgets[name]) {
            const config = successWidgets[name];
            return (
              <div key={idx} className={`border rounded-xl p-3 flex items-start gap-2.5 shadow-sm text-xs backdrop-blur-sm ${result.success ? config.color : "border-destructive/20 bg-destructive/10 text-destructive"}`}>
                {result.success ? (
                  <>
                    <div className="mt-0.5 shrink-0">{config.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold tracking-wide uppercase text-[10px] text-muted-foreground">{config.label}</p>
                      <p className="mt-0.5 font-medium">{result.message}</p>
                      {result.productId && <p className="text-[9px] font-mono text-muted-foreground mt-1">ID: {result.productId}</p>}
                      {result.blogId && <p className="text-[9px] font-mono text-muted-foreground mt-1">ID: {result.blogId}</p>}
                      {result.undoAction && (
                        <div className="mt-2.5 flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUndo(msgIdx, idx, result.undoAction)}
                            disabled={undoneActions[`${msgIdx}_${idx}`] || undoing[`${msgIdx}_${idx}`]}
                            className={cn(
                              "text-[10px] h-7 px-3 rounded-lg font-bold border transition-all bg-background text-foreground",
                              undoneActions[`${msgIdx}_${idx}`]
                                ? "bg-muted text-muted-foreground border-border cursor-not-allowed"
                                : "border-primary/25 hover:bg-muted hover:border-primary text-primary"
                            )}
                          >
                            {undoing[`${msgIdx}_${idx}`] ? (
                              <span className="flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Undoing...</span>
                            ) : undoneActions[`${msgIdx}_${idx}`] ? (
                              <span className="flex items-center gap-1"><CheckCircle2 size={10} className="text-emerald-500" /> Reverted</span>
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
                      <p className="font-bold tracking-wide uppercase text-[10px] text-destructive">Execution Failed</p>
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
              <div key={idx} className="border border-indigo-500/20 bg-indigo-500/5 rounded-xl p-4 shadow-sm w-full backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
                  <Database size={14} />
                  <span>Real-time Telemetry Metrics</span>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                  <div className="bg-background border border-border p-2.5 rounded-lg text-center shadow-sm">
                    <p className="text-[9px] text-muted-foreground uppercase font-semibold">Total Revenue</p>
                    <p className="text-base font-bold text-indigo-500 dark:text-indigo-400 font-mono mt-0.5">${result.totalRevenue.toLocaleString()}</p>
                  </div>
                  <div className="bg-background border border-border p-2.5 rounded-lg text-center shadow-sm">
                    <p className="text-[9px] text-muted-foreground uppercase font-semibold">Total Orders</p>
                    <p className="text-base font-bold text-foreground font-mono mt-0.5">{result.ordersCount}</p>
                  </div>
                  <div className="bg-background border border-border p-2.5 rounded-lg text-center shadow-sm">
                    <p className="text-[9px] text-muted-foreground uppercase font-semibold">Products Catalog</p>
                    <p className="text-base font-bold text-foreground font-mono mt-0.5">{result.productsCount}</p>
                  </div>
                  <div className="bg-background border border-border p-2.5 rounded-lg text-center shadow-sm">
                    <p className="text-[9px] text-muted-foreground uppercase font-semibold">Stock Alerts</p>
                    <p className={`text-base font-bold font-mono mt-0.5 ${result.criticalStockCount > 0 ? "text-amber-500 animate-pulse" : "text-emerald-500"}`}>{result.criticalStockCount}</p>
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
              <div key={idx} className="border border-blue-500/20 bg-blue-500/5 rounded-xl p-4 shadow-sm w-full backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-blue-500 dark:text-blue-400">
                  <ShoppingCart size={14} />
                  <span>Recent Sales Transactions</span>
                </div>
                {result.orders.length > 0 ? (
                  <div className="space-y-2">
                    {result.orders.map((ord) => (
                      <div key={ord.id} className="bg-background border border-border p-3 rounded-lg flex items-center justify-between text-xs hover:border-blue-500/30 transition-all">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-foreground">{ord.customer}</span>
                            <span className="text-[9px] text-muted-foreground font-mono bg-muted px-1.5 py-0.25 rounded">#{ord.id.slice(-6)}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            {new Date(ord.createdAt).toLocaleDateString()} at {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="font-bold text-blue-500 dark:text-blue-400 font-mono text-xs">${ord.totalPrice}</p>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wide uppercase border ${ord.orderStatus === "Completed" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" :
                              ord.orderStatus === "Processing" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" :
                                "bg-muted text-muted-foreground border-border"
                            }`}>
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
              <div key={idx} className="border border-teal-500/20 bg-teal-500/5 rounded-xl p-4 shadow-sm w-full backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-teal-500 dark:text-teal-400">
                  <Users size={14} />
                  <span>Found {result.count} Customers</span>
                </div>
                {result.users.length > 0 ? (
                  <div className="space-y-2">
                    {result.users.map((cust) => (
                      <div key={cust._id} className="bg-background border border-border p-3 rounded-lg flex items-center justify-between text-xs hover:border-teal-500/30 transition-all">
                        <div>
                          <p className="font-semibold text-foreground">{cust.name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{cust.email}</p>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold border uppercase ${cust.isActive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : "bg-destructive/10 text-destructive border-destructive/20"
                            }`}>
                            {cust.isActive ? "Active" : "Blocked"}
                          </span>
                          <button
                            onClick={() => setInputValue(`Toggle customer account status for user ID ${cust._id}`)}
                            className="text-[9px] px-2 py-1 rounded bg-muted hover:bg-muted/80 text-foreground transition-all font-semibold"
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
  };

  return (
    <div
      id="admin-ai-chat-container"
      className="flex h-screen w-full overflow-hidden bg-background text-foreground fixed lg:relative inset-0 z-50"
    >
      {/* 1. LEFT SIDEBAR: ChatGPT-style Previous Conversations & New Chat */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 flex flex-col bg-card/95 lg:bg-card/70 backdrop-blur-2xl border-r border-border transition-all duration-300 ease-in-out shrink-0",
          showLeftSidebar ? "w-72 translate-x-0" : "-translate-x-full lg:w-0 lg:border-r-0 lg:overflow-hidden"
        )}
      >
        {/* Top: New Chat Button + Mobile Close */}
        <div className="p-3 border-b border-border/80 flex items-center gap-2">
          <Button
            onClick={handleNewChat}
            className="flex-1 justify-start gap-2 h-10 px-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-sm hover:opacity-95"
          >
            <Plus size={16} />
            <span>New Chat</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden rounded-xl h-10 w-10 text-muted-foreground hover:text-foreground shrink-0"
            onClick={() => setShowLeftSidebar(false)}
          >
            <X size={18} />
          </Button>
        </div>

        {/* Search Session Query */}
        {sessions.length > 3 && (
          <div className="px-3 py-2 border-b border-border/40">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input
                value={searchSessionQuery}
                onChange={(e) => setSearchSessionQuery(e.target.value)}
                placeholder="Search chats..."
                className="h-8 pl-8 pr-2 text-xs bg-muted/40 border-border/40 rounded-lg"
              />
            </div>
          </div>
        )}

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>Conversations</span>
            {sessions.length > 0 && (
              <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-mono">{filteredSessions.length}</span>
            )}
          </div>

          {sessionsLoading ? (
            <div className="p-6 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
              <Loader2 size={16} className="animate-spin text-primary" />
              <span>Loading chats...</span>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              {searchSessionQuery ? "No matching chats found" : "No previous chats yet"}
            </div>
          ) : (
            filteredSessions.map((s) => {
              const isActive = s.id === currentSessionId;
              const isEditing = editingSessionId === s.id;

              return (
                <div
                  key={s.id}
                  onClick={() => {
                    if (!isEditing) {
                      handleSelectSession(s.id);
                      if (typeof window !== "undefined" && window.innerWidth < 1024) setShowLeftSidebar(false);
                    }
                  }}
                  className={cn(
                    "group relative flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer border",
                    isActive
                      ? "bg-primary/10 border-primary/30 text-primary font-semibold shadow-sm"
                      : "border-transparent hover:bg-muted text-foreground/80 hover:text-foreground"
                  )}
                >
                  <MessageSquare size={14} className={cn("shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />

                  {isEditing ? (
                    <div className="flex-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editingSessionTitle}
                        onChange={(e) => setEditingSessionTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveRenameSession(s.id);
                          if (e.key === "Escape") setEditingSessionId(null);
                        }}
                        autoFocus
                        className="w-full bg-background border border-primary rounded px-1.5 py-0.5 text-xs text-foreground focus:outline-none"
                      />
                      <button
                        onClick={() => handleSaveRenameSession(s.id)}
                        className="p-1 hover:text-primary text-muted-foreground"
                      >
                        <Check size={12} />
                      </button>
                      <button
                        onClick={() => setEditingSessionId(null)}
                        className="p-1 hover:text-destructive text-muted-foreground"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <span className="truncate flex-1 select-none">{s.title || "Untitled Session"}</span>
                  )}

                  {/* Actions (Rename + Delete) */}
                  {!isEditing && (
                    <div
                      className={cn(
                        "items-center gap-0.5 shrink-0 transition-opacity",
                        isActive ? "flex opacity-100" : "hidden group-hover:flex opacity-70 group-hover:opacity-100"
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleStartRenameSession(s)}
                        title="Rename"
                        className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground"
                      >
                        <Edit3 size={12} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteSession(e, s.id)}
                        title="Delete conversation"
                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <Link
            href="/admin"
            className="flex items-center gap-1.5 hover:text-foreground font-medium transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Dashboard</span>
          </Link>
          {sessions.length > 0 && (
            <button
              onClick={handleClearAllHistory}
              className="text-[11px] hover:text-destructive transition-colors text-muted-foreground flex items-center gap-1"
              title="Clear all chats"
            >
              <Trash2 size={12} /> Clear all
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Backdrop for Left Sidebar */}
      {showLeftSidebar && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowLeftSidebar(false)}
        />
      )}

      {/* 2. MIDDLE CHAT VIEWPORT */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Dynamic ambient background */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-tr from-primary/5 to-secondary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Chat Header */}
        <header className="h-[60px] bg-card/70 backdrop-blur-xl px-3 sm:px-6 flex items-center justify-between border-b border-border/60 shrink-0 z-20 shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Sidebar Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowLeftSidebar(!showLeftSidebar)}
              className="rounded-xl h-9 w-9 text-muted-foreground hover:text-foreground shrink-0"
              title={showLeftSidebar ? "Collapse sidebar" : "Expand sidebar"}
            >
              <PanelLeft size={18} />
            </Button>

            <div className="flex items-center gap-2.5 truncate">
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Sparkles size={16} />
                </div>
                <div
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-background",
                    loading ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                  )}
                />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold leading-tight truncate">
                  {currentSession?.title || "New Chat"}
                </h2>
                <p className="text-[10px] font-medium text-emerald-500">
                  {loading ? "AI is processing..." : "AI Ready"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Quick New Chat Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewChat}
              className="h-8 px-2.5 rounded-xl border-border hover:bg-muted text-xs font-semibold flex items-center gap-1 shadow-sm"
              title="Start fresh conversation"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">New Chat</span>
            </Button>

            {/* Toggle Right Telemetry Sidebar */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowRightSidebar(!showRightSidebar)}
              className={cn(
                "rounded-xl h-9 w-9 shrink-0 transition-colors",
                showRightSidebar ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
              )}
              title={showRightSidebar ? "Hide Tools Panel" : "Open Tools & Telemetry"}
            >
              <Terminal size={18} />
            </Button>
          </div>
        </header>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 z-10 scrollbar-thin min-h-0 flex flex-col">
          {messagesLoading ? (
            <div className="my-auto flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <Loader2 size={24} className="animate-spin text-primary mb-2" />
              <p className="text-xs">Loading conversation...</p>
            </div>
          ) : messages.length === 1 && !loading ? (
            /* ChatGPT Welcome Hero for empty new chats */
            <div className="my-auto max-w-xl mx-auto text-center space-y-4 py-8 px-4">
              <div className="h-14 w-14 mx-auto rounded-3xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                <Sparkles size={28} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">How can I assist you with your store?</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                  I can inspect orders, adjust stock, manage coupons, review categories, and provide business analytics.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left pt-2">
                {suggestionChips.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(chip.prompt)}
                    className="p-3 rounded-xl border border-border bg-card/60 hover:bg-muted hover:border-primary/30 transition-all text-xs font-medium text-foreground flex items-center justify-between group shadow-sm"
                  >
                    <span>{chip.label}</span>
                    <ArrowUpRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    {/* Avatar */}
                    {msg.role === "user" ? (
                      <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-900 border border-zinc-600 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm">
                        <User size={14} />
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 border border-violet-500/30 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-md shadow-violet-500/10">
                        <Sparkles size={14} className="text-white animate-pulse" />
                      </div>
                    )}

                    {/* Message card */}
                    <div
                      className={`rounded-2xl px-4 py-3 shadow-md border leading-relaxed text-sm ${msg.role === "user"
                          ? "bg-primary text-primary-foreground border-primary/30 rounded-tr-none"
                          : "bg-card/90 backdrop-blur-md text-foreground border-border rounded-tl-none"
                        }`}
                    >
                      {msg.image && (
                        <div className="mb-2 max-w-sm rounded-lg overflow-hidden border border-border/30 bg-black/5 dark:bg-white/5">
                          <img
                            src={msg.image}
                            alt="Uploaded attachment"
                            className="max-h-48 w-full object-contain rounded-md"
                          />
                        </div>
                      )}
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      {msg.role === "model" && msg.toolExecutions && renderToolWidgets(msg.toolExecutions, i)}
                      {msg.createdAt && (
                        <span
                          className={cn(
                            "text-[10px] block mt-1.5 font-mono",
                            msg.role === "user" ? "text-primary-foreground/70 text-right" : "text-muted-foreground/60 text-right"
                          )}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="flex gap-3 max-w-[80%] items-start">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-primary/10 border border-primary/20 text-primary shrink-0">
                  <Loader2 size={14} className="animate-spin" />
                </div>
                <div className="bg-card border border-border rounded-2xl rounded-tl-none p-4 shadow-sm backdrop-blur-md flex items-center gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-primary font-semibold flex items-center gap-1.5 animate-pulse">
                      <RefreshCw size={12} className="animate-spin" /> Resolving Agentic Telemetry...
                    </p>
                    <div className="flex gap-1.5 pt-1">
                      <span className="h-1.5 w-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="h-1.5 w-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="h-1.5 w-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {error && (
            <div className="p-4 border border-destructive/20 bg-destructive/10 text-destructive rounded-xl flex items-start gap-3 text-xs max-w-xl mx-auto">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Session Notice</p>
                <p className="text-muted-foreground mt-0.5">{error}</p>
                <button
                  onClick={() => {
                    const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
                    if (lastUserMsg) {
                      setError(null);
                      handleSendMessage(lastUserMsg.content);
                    }
                  }}
                  className="mt-2 px-3 py-1.5 text-[11px] font-semibold rounded-lg bg-destructive/15 hover:bg-destructive/25 text-destructive border border-destructive/20 transition-all flex items-center gap-1.5"
                >
                  <RefreshCw size={11} /> Retry
                </button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* User Input Bar */}
        <footer className="p-3 md:p-5 bg-card/80 backdrop-blur-xl border-t border-border/60 shrink-0 z-20">
          <div className="max-w-3xl mx-auto space-y-3">
            {imagePreview && (
              <div className="flex items-center gap-2 bg-muted p-2 rounded-xl w-fit border border-border">
                <div className="relative h-12 w-12 rounded-lg overflow-hidden border border-border bg-background">
                  <img src={imagePreview} alt="Upload preview" className="h-full w-full object-cover" />
                  {uploadingImage && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 size={14} className="animate-spin text-white" />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    setUploadedImageUrl(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="p-1 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 md:gap-3">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageChange}
                disabled={loading || uploadingImage}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || uploadingImage}
                className="h-11 w-11 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
                title="Attach image"
              >
                <Paperclip size={18} />
              </Button>

              <div className="flex-1 relative">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask AI to query products, list orders, create discounts..."
                  className="w-full h-11 md:h-12 bg-muted/50 border-border/50 rounded-2xl px-4 md:px-5 text-[14px] md:text-[15px] focus-visible:ring-1 focus-visible:ring-primary/40 placeholder:text-muted-foreground/50 shadow-inner"
                />
              </div>
              <Button
                onClick={() => handleSendMessage()}
                disabled={loading || uploadingImage || (!inputValue.trim() && !uploadedImageUrl) || cooldown > 0}
                className={cn(
                  "h-11 w-11 md:h-12 md:w-12 rounded-full shadow-md transition-all duration-300 shrink-0 flex items-center justify-center",
                  (inputValue.trim() || uploadedImageUrl) ? "bg-primary hover:opacity-95 scale-100" : "bg-muted text-muted-foreground scale-95 opacity-50"
                )}
              >
                {cooldown > 0 ? (
                  <span className="text-[10px] font-bold">{cooldown}</span>
                ) : (
                  <Send size={18} className={cn("transition-transform", (inputValue.trim() || uploadedImageUrl) && "translate-x-0.5 -translate-y-0.5")} />
                )}
              </Button>
            </div>
          </div>
        </footer>
      </div>

      {/* 3. RIGHT SIDEBAR: Telemetry & Tools (Collapsible / Toggleable) */}
      <div
        className={cn(
          "w-full lg:w-72 bg-card/60 backdrop-blur-2xl p-4 flex-col border-l border-border shrink-0 transition-all duration-300",
          showRightSidebar ? "flex fixed lg:static inset-y-0 right-0 z-40" : "hidden"
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
            className="rounded-lg h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border border-border rounded-lg p-1 bg-background text-xs gap-1 my-3">
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex-1 py-1.5 rounded-md font-semibold transition-all text-center ${activeTab === "chat" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Telemetry
          </button>
          <button
            onClick={() => setActiveTab("tools")}
            className={`flex-1 py-1.5 rounded-md font-semibold transition-all text-center ${activeTab === "tools" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
          >
            AI Tools
          </button>
          <button
            onClick={() => setActiveTab("commands")}
            className={`flex-1 py-1.5 rounded-md font-semibold transition-all text-center ${activeTab === "commands" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Shortcuts
          </button>
        </div>

        {activeTab === "chat" ? (
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            {/* Status indicators */}
            <div className="border border-border rounded-xl p-4 bg-background/50 space-y-3.5 shadow-sm">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5"><Activity size={12} /> Live Engine Status</h3>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Mongoose Sessions</span>
                  <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold"><span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-pulse" /> Linked</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Active Session</span>
                  <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[100px]">{currentSessionId ? `#${currentSessionId.slice(-6)}` : "New Session"}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Gemini Core</span>
                  <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold"><span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-pulse" /> Active</span>
                </div>
              </div>
            </div>

            {/* Quick Stats Panel */}
            <div className="border border-border rounded-xl p-4 bg-background/50 flex-1 flex flex-col shadow-sm overflow-hidden">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 mb-2.5"><Terminal size={12} /> System Details</h3>
              <div className="text-[11px] font-mono text-muted-foreground space-y-1.5 overflow-y-auto flex-1 scrollbar-thin">
                <p className="text-primary font-bold"># auth token status verified</p>
                <p># database: clothing-ecommerce</p>
                <p># total saved sessions: {sessions.length}</p>
                <p># model: gemini-2.5-flash</p>
                <p># function tools registered: 35</p>
                <p className="text-emerald-600 dark:text-emerald-400"># ready for instructions</p>
              </div>
            </div>
          </div>
        ) : activeTab === "tools" ? (
          <div className="flex-1 flex flex-col gap-3 overflow-hidden">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5"><Cpu size={12} /> Registered Tools (35)</h3>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {[
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
                { name: "editBlog", desc: "Modify title, slug, html or cover image of articles" }
              ].map((tool, idx) => (
                <div key={idx} className="p-2 border border-border bg-background/50 rounded-lg hover:border-primary/20 transition-all flex flex-col gap-0.5">
                  <span className="text-[11px] font-mono font-bold text-primary">{tool.name}()</span>
                  <span className="text-[10px] text-muted-foreground leading-snug">{tool.desc}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-3 overflow-hidden">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 mb-1"><Terminal size={12} /> Command Shortcuts</h3>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {quickCommands.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(item.prompt)}
                  className="w-full text-left p-2.5 border border-border bg-background hover:bg-muted rounded-xl transition-all group flex flex-col gap-0.5 shadow-sm"
                >
                  <span className="text-xs font-bold text-foreground group-hover:text-primary flex items-center justify-between">
                    {item.cmd}
                    <ArrowUpRight size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
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
    </div>
  );
}
