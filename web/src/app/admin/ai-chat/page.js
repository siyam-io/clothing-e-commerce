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
import ChatToolWidgets from "./components/ChatToolWidgets";
import ChatSessionSidebar from "./components/ChatSessionSidebar";
import ChatSettingsDrawer from "./components/ChatSettingsDrawer";
import ChatEmptyState from "./components/ChatEmptyState";
import ChatMessageItem from "./components/ChatMessageItem";

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

  return (
    <div
      id="admin-ai-chat-container"
      className="flex h-screen w-full overflow-hidden bg-background text-foreground fixed lg:relative inset-0 z-50"
    >
      {/* 1. LEFT SIDEBAR: ChatGPT-style Previous Conversations & New Chat */}
      <ChatSessionSidebar
        showLeftSidebar={showLeftSidebar}
        setShowLeftSidebar={setShowLeftSidebar}
        handleNewChat={handleNewChat}
        searchSessionQuery={searchSessionQuery}
        setSearchSessionQuery={setSearchSessionQuery}
        sessions={sessions}
        filteredSessions={filteredSessions}
        sessionsLoading={sessionsLoading}
        currentSessionId={currentSessionId}
        editingSessionId={editingSessionId}
        setEditingSessionId={setEditingSessionId}
        editingSessionTitle={editingSessionTitle}
        setEditingSessionTitle={setEditingSessionTitle}
        handleSelectSession={handleSelectSession}
        handleStartRenameSession={handleStartRenameSession}
        handleSaveRenameSession={handleSaveRenameSession}
        handleDeleteSession={handleDeleteSession}
        handleClearAllHistory={handleClearAllHistory}
      />

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
            <ChatEmptyState
              suggestionChips={suggestionChips}
              onSelectSuggestion={handleSendMessage}
            />
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <ChatMessageItem
                  key={i}
                  msg={msg}
                  msgIdx={i}
                  setInputValue={setInputValue}
                  handleUndo={handleUndo}
                  undoneActions={undoneActions}
                  undoing={undoing}
                />
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
      <ChatSettingsDrawer
        showRightSidebar={showRightSidebar}
        setShowRightSidebar={setShowRightSidebar}
        currentSessionId={currentSessionId}
        sessionsCount={sessions.length}
        quickCommands={quickCommands}
        onExecuteCommand={(prompt) => handleSendMessage(prompt)}
      />
    </div>
  );
}
