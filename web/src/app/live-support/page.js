"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useChat } from "@/app/live-support/lib/useChat";
import { useAuthStore } from "@/store/authStore";
import { useProductStore } from "@/store/productStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Lock,
  MessageSquare,
  Shield,
  Clock,
  Zap,
  ArrowLeft,
  Headphones,
  Image as ImageIcon,
  Loader2,
  Check,
  CheckCheck,
  Bot,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  CheckCircle2,
  ShoppingBag,
  X,
} from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getImageUrl } from "@/utils/imageUtils";
import api from "@/lib/api";
import { toast } from "sonner";

// -----------------------------------------------------------------------------
// Interactive Product Preview Card for Matched Products
// -----------------------------------------------------------------------------
function ProductMatchCard({ product, onAddToCart }) {
  const images = (Array.isArray(product.images) && product.images.length > 0)
    ? product.images
    : (product.image ? [product.image] : []);
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const activeImage = images[activeImgIdx] || images[0] || "";

  const [selectedSizeId, setSelectedSizeId] = useState(() => {
    if (!product.sizes || product.sizes.length === 0) return null;
    const inStock = product.sizes.find((s) => s.stock > 0);
    return inStock ? (inStock.size?._id || inStock.size) : (product.sizes[0]?.size?._id || product.sizes[0]?.size);
  });
  const [isAdded, setIsAdded] = useState(false);

  const price = product.price || 0;
  const discount = product.discount || 0;
  const finalPrice = discount > 0 ? price - (price * discount) / 100 : price;

  const handleAdd = () => {
    if (!selectedSizeId) {
      toast.error("Please select a size first");
      return;
    }
    onAddToCart(product, selectedSizeId);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2500);
  };

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-accent-secondary/30 bg-black/60 backdrop-blur-md transition-all hover:border-accent-secondary/60 shadow-2xl text-left">
      <div className="flex gap-3.5 p-3.5">
        {/* Product Image with Multi-Angle Previews */}
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          <div
            onClick={() => activeImage && window.open(getImageUrl(activeImage, 1200), "_blank")}
            className="relative h-24 w-24 sm:h-28 sm:w-28 overflow-hidden rounded-2xl bg-black/60 border border-white/10 shadow-inner cursor-pointer group"
            title="Click to view full image"
          >
            <img
              src={getImageUrl(activeImage, 400)}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            {discount > 0 && (
              <span className="absolute top-1.5 left-1.5 rounded-md bg-rose-500/90 px-1.5 py-0.5 text-[8px] font-black text-white shadow">
                -{discount}%
              </span>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-bold">
              🔍 View Full
            </div>
          </div>

          {/* Mini Image Thumbnails if multiple exist */}
          {images.length > 1 && (
            <div className="flex gap-1 justify-center max-w-[112px] overflow-x-auto no-scrollbar">
              {images.slice(0, 4).map((img, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImgIdx(idx);
                  }}
                  className={cn(
                    "h-5 w-5 rounded-md overflow-hidden border transition-all",
                    activeImgIdx === idx
                      ? "border-accent-secondary ring-1 ring-accent-secondary scale-105"
                      : "border-white/20 opacity-60 hover:opacity-100"
                  )}
                >
                  <img
                    src={getImageUrl(img, 80)}
                    alt={`Angle ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Metadata */}
        <div className="flex flex-1 flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="rounded bg-white/15 px-2 py-0.5 text-[9px] font-mono font-bold text-zinc-200 uppercase tracking-wider">
                {product.sku || "IN-STOCK"}
              </span>
              <span className="text-[10px] font-extrabold text-emerald-400 flex items-center gap-1">
                <ShieldCheck size={11} /> Official Product
              </span>
            </div>
            <h4 className="mt-1.5 line-clamp-2 text-[14px] font-black text-white leading-snug">
              {product.name}
            </h4>
          </div>

          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-[18px] font-black text-orange-400">
              ৳{Math.round(finalPrice)}
            </span>
            {discount > 0 && (
              <span className="text-[12px] font-semibold text-zinc-400 line-through">
                ৳{price}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Size Selector Pills */}
      {product.sizes && product.sizes.length > 0 && (
        <div className="border-t border-white/10 bg-black/40 px-3.5 py-2.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-200">
              Select Size:
            </span>
            <span className="text-[10px] text-zinc-400 font-bold font-mono">
              {product.sizes.filter((s) => s.stock > 0).length} in stock
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {product.sizes.map((s, idx) => {
              const sizeId = s.size?._id || s.size;
              const sizeName = s.size?.name || s.sizeName || s.name || `S${idx + 1}`;
              const isAvailable = s.stock > 0;
              const isSelected = selectedSizeId === sizeId;

              return (
                <button
                  key={sizeId || idx}
                  disabled={!isAvailable}
                  onClick={() => setSelectedSizeId(sizeId)}
                  className={cn(
                    "rounded-xl px-3 py-1.5 text-[11px] font-extrabold transition-all border",
                    !isAvailable && "opacity-25 line-through cursor-not-allowed bg-transparent border-white/10 text-zinc-500",
                    isSelected
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-400 shadow-md shadow-orange-500/30 scale-105"
                      : "bg-white/10 text-zinc-100 border-white/10 hover:bg-white/20 hover:text-white"
                  )}
                >
                  {sizeName}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between border-t border-white/10 bg-black/50 p-2.5 px-3.5">
        <Link
          href={`/product/${product.slug || product._id}`}
          className="text-[11px] font-extrabold text-zinc-300 hover:text-white flex items-center gap-1 transition-colors"
        >
          View Details <ChevronRight size={12} />
        </Link>

        <button
          onClick={handleAdd}
          className={cn(
            "flex items-center gap-1.5 rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-wider transition-all duration-300 shadow-md active:scale-95 cursor-pointer",
            isAdded
              ? "bg-emerald-600 text-white shadow-emerald-600/30"
              : "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/25"
          )}
        >
          {isAdded ? (
            <>
              <CheckCircle2 size={14} className="text-white" /> Added!
            </>
          ) : (
            <>
              <ShoppingBag size={14} className="text-white" /> Add to Cart
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Chat Message Component
// -----------------------------------------------------------------------------
const ChatMessage = ({ message, isMe, onAddToCart }) => {
  const isAi = message.isAi || !message.sender || message.senderName === "AI Assistant";

  const timeStr = useMemo(() => {
    const date = new Date(message.createdAt || new Date());
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
  }, [message.createdAt]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn("flex w-full mb-3 md:mb-5", isMe ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "relative max-w-[88%] sm:max-w-[75%]",
          isMe ? "items-end" : "items-start"
        )}
      >
        {/* Sender Header for AI or Admin */}
        {!isMe && (
          <div className="flex items-center gap-1.5 mb-1 px-1">
            {isAi ? (
              <span className="flex items-center gap-1 text-[11px] font-extrabold text-orange-400">
                <Bot size={13} className="text-orange-400" />
                AI Shopping Assistant
                <Sparkles size={11} className="text-amber-400" />
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-400">
                <Headphones size={13} className="text-emerald-400" />
                Live Support
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
              </span>
            )}
          </div>
        )}

        <div
          className={cn(
            "overflow-hidden shadow-[0_2px_12px_-2px_rgba(0,0,0,0.1)] transition-all duration-300",
            isMe
              ? "bg-gradient-to-br from-[#0084ff] to-[#0073e6] text-white rounded-[20px] rounded-tr-[4px] shadow-[#0084ff20]"
              : isAi
              ? "bg-[#18222d] text-zinc-100 rounded-[20px] rounded-tl-[4px] border border-orange-500/25 shadow-2xl"
              : "bg-[#1e293b] text-zinc-100 rounded-[20px] rounded-tl-[4px] border border-emerald-500/25 shadow-lg"
          )}
        >
          {message.image && (
            <div className="p-1">
              <img
                src={getImageUrl(message.image)}
                alt="Shared visual"
                className="max-w-full rounded-[16px] object-cover cursor-pointer hover:opacity-95 transition-opacity max-h-[300px]"
                onClick={() => window.open(getImageUrl(message.image), "_blank")}
              />
            </div>
          )}

          {message.text && (
            <div className="px-4 py-2.5 md:px-5 md:py-3">
              <p className="text-[14px] md:text-[15px] leading-[1.6] whitespace-pre-wrap break-words font-medium text-zinc-100">
                {message.text}
              </p>
            </div>
          )}

          {/* Matched Product Cards */}
          {message.matchedProducts && message.matchedProducts.length > 0 && (
            <div className="px-3 pb-3 space-y-2">
              {message.matchedProducts.map((p) => (
                <ProductMatchCard key={p._id || p.id} product={p} onAddToCart={onAddToCart} />
              ))}
            </div>
          )}
        </div>

        <div
          className={cn(
            "flex items-center gap-1.5 mt-1 px-1 opacity-50",
            isMe ? "justify-end" : "justify-start"
          )}
        >
          {message.isEdited && (
            <span className="text-[9px] italic font-semibold uppercase tracking-widest">
              edited
            </span>
          )}
          <span className="text-[9px] font-bold uppercase tracking-widest">
            {timeStr}
          </span>
          {isMe && (
            message.isRead ? <CheckCheck size={12} className="text-[#0084ff]" /> : <Check size={12} />
          )}
        </div>
      </div>
    </motion.div>
  );
};

// -----------------------------------------------------------------------------
// Live Support Main Page Component
// -----------------------------------------------------------------------------
export default function LiveSupportPage() {
  const { user, isAuthenticated } = useAuthStore();
  const isAuth = !!user && isAuthenticated;
  const addToCartStore = useProductStore((state) => state.addToCart);

  // Real-time socket chat for authenticated users
  const {
    messages: socketMessages,
    isConnected,
    isAiTyping: isSocketAiTyping,
    sendMessage,
    chatMode: socketChatMode,
    setChatMode: setSocketChatMode,
  } = useChat(isAuth);

  // Local state for guest users
  const [localChatMode, setLocalChatMode] = useState("ai");
  const [guestMessages, setGuestMessages] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("vanguard_guest_chat");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.warn("Failed to load guest chat from localStorage:", e);
      }
    }
    return [
      {
        _id: "welcome-ai-1",
        isAi: true,
        senderName: "AI Assistant",
        text: "👋 Welcome to Vanguard! I am your AI Shopping Assistant running our custom multimodal vision model.\n\nAsk me anything about our clothing collections, sizing, prices, or upload a photo of any outfit to find matching products instantly—no login required!",
        createdAt: new Date().toISOString(),
      },
    ];
  });
  const [isGuestAiTyping, setIsGuestAiTyping] = useState(false);

  const [input, setInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  // Active chat mode and messages
  const currentChatMode = isAuth ? socketChatMode : localChatMode;
  const displayMessages = isAuth && socketMessages.length > 0 ? socketMessages : guestMessages;
  const isAiThinking = isAuth && currentChatMode === "ai" ? isSocketAiTyping : isGuestAiTyping;

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [displayMessages.length, isAiThinking]);

  // Handle selected image preview
  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setImagePreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImagePreviewUrl(null);
    }
  }, [selectedFile]);

  // Lock scroll on mobile
  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, []);

  const handleModeChange = (newMode) => {
    if (isAuth) {
      setSocketChatMode(newMode);
    } else {
      setLocalChatMode(newMode);
      if (newMode === "agent") {
        toast.info("💡 To connect with a human support agent, you can sign in or continue chatting with our AI Assistant right here!");
      }
    }
  };

  const handleAddToCart = (product, sizeId) => {
    addToCartStore(
      {
        _id: product._id || product.id,
        name: product.name,
        price: product.price,
        discount: product.discount || 0,
        images: product.images || [],
      },
      sizeId,
      1,
      isAuth
    );
    toast.success(`Added ${product.name} to cart!`);
  };

  const handleSend = async () => {
    const textToSend = input.trim();
    if (!textToSend && !selectedFile) return;

    setInput("");
    const file = selectedFile;
    const previewUrl = imagePreviewUrl;
    setSelectedFile(null);

    // -------------------------------------------------------------------------
    // 1. GUEST USER OR LOCAL AI MODE -> High-performance REST endpoint /api/chat
    // -------------------------------------------------------------------------
    if (!isAuth || currentChatMode === "ai") {
      const userMsg = {
        _id: `user_${Date.now()}`,
        sender: user?._id || null,
        senderName: user?.name || "You",
        isMe: true,
        text: textToSend,
        image: previewUrl,
        createdAt: new Date().toISOString(),
      };

      setGuestMessages((prev) => {
        const updated = [...prev, userMsg];
        try {
          localStorage.setItem("vanguard_guest_chat", JSON.stringify(updated.slice(-30)));
        } catch (e) {}
        return updated;
      });

      setIsGuestAiTyping(true);

      try {
        const formData = new FormData();
        if (textToSend) formData.append("message", textToSend);
        if (file) formData.append("image", file);

        // Previous 4 turns context
        const historyContext = displayMessages.slice(-4).map((m) => ({
          role: m.isAi ? "assistant" : "user",
          content: m.text || (m.image ? "User sent an outfit image" : ""),
        }));
        formData.append("history", JSON.stringify(historyContext));

        const res = await api.post("/chat", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (res.data?.success && res.data.data) {
          const { reply, actionPayload, actionResult, matchedProducts } = res.data.data;

          // If AI placed item into cart automatically
          if (actionResult?.success && actionResult.product) {
            const p = actionResult.product;
            addToCartStore(
              { _id: p.id, name: p.name, price: p.unitPrice, discount: 0, images: [] },
              p.sizeId || "default",
              p.quantity || 1,
              isAuth
            );
            toast.success(actionResult.message || "Added item to cart!");
          }

          const aiMsg = {
            _id: `ai_${Date.now()}`,
            isAi: true,
            senderName: "AI Assistant",
            text: reply,
            actionPayload,
            actionResult,
            matchedProducts: matchedProducts || (actionResult?.product ? [actionResult.product] : []),
            createdAt: new Date().toISOString(),
          };

          setGuestMessages((prev) => {
            const updated = [...prev, aiMsg];
            try {
              localStorage.setItem("vanguard_guest_chat", JSON.stringify(updated.slice(-30)));
            } catch (e) {}
            return updated;
          });
        }
      } catch (err) {
        console.error("AI chat transmission error:", err);
        setGuestMessages((prev) => [
          ...prev,
          {
            _id: `err_${Date.now()}`,
            isAi: true,
            senderName: "AI Assistant",
            text: "I experienced a temporary communication hiccup while contacting our local vision model. Please ask me again or browse our collections!",
            createdAt: new Date().toISOString(),
          },
        ]);
      } finally {
        setIsGuestAiTyping(false);
      }
      return;
    }

    // -------------------------------------------------------------------------
    // 2. AUTHENTICATED USER IN AGENT TAKEOVER MODE -> Stream to Socket.io
    // -------------------------------------------------------------------------
    let uploadedImageUrl = null;
    if (file) {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("image", file);
        const res = await api.post("/chat/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (res.data?.success) {
          uploadedImageUrl = res.data.url;
        }
      } catch (err) {
        console.error("Image upload failed:", err);
      } finally {
        setIsUploading(false);
      }
    }

    sendMessage({
      text: textToSend,
      image: uploadedImageUrl,
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isSendDisabled =
    (!input.trim() && !selectedFile) ||
    isUploading ||
    isAiThinking ||
    (isAuth && currentChatMode === "agent" && !isConnected);

  return (
    <div id="live-support-container" className="fixed inset-0 flex flex-col bg-[#f0f2f5] dark:bg-[#0b141a] overflow-hidden z-50">
      {/* Header */}
      <header className="h-[68px] bg-white dark:bg-[#202c33] px-4 md:px-8 flex items-center justify-between border-b border-border/10 shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="rounded-full hover:bg-black/5 dark:hover:bg-white/5"
          >
            <Link href="/">
              <ArrowLeft size={20} className="text-foreground/70" />
            </Link>
          </Button>

          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-accent-secondary/15 flex items-center justify-center text-accent-secondary">
              {currentChatMode === "ai" ? <Bot size={22} /> : <Headphones size={22} />}
            </div>
            <div
              className={cn(
                "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#202c33]",
                currentChatMode === "ai" || isConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              )}
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-bold leading-tight">
                {currentChatMode === "ai" ? "Vanguard AI Shopping Assistant" : "Live Customer Support"}
              </h2>
              {currentChatMode === "ai" && (
                <span className="rounded-full bg-orange-500/15 border border-orange-500/30 px-2 py-0.5 text-[9px] font-bold text-orange-400">
                  Qwen2-VL Local
                </span>
              )}
            </div>
            <p className="text-[11px] font-medium text-emerald-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {currentChatMode === "ai"
                ? "AI Assistant is ready (Instant Answers • No Login Required)"
                : isAuth && isConnected
                ? "Live Agent is online"
                : "Live Support (Sign in for human agent)"}
            </p>
          </div>
        </div>

        {/* Dual Mode Switcher Pill */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-2xl bg-black/30 dark:bg-black/50 p-1 border border-white/10 shadow-inner">
            <button
              onClick={() => handleModeChange("ai")}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-[11px] font-black transition-all cursor-pointer",
                currentChatMode === "ai"
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              <Bot size={14} className={currentChatMode === "ai" ? "text-white" : "text-zinc-400"} />
              AI Assistant
            </button>
            <button
              onClick={() => handleModeChange("agent")}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-[11px] font-black transition-all cursor-pointer",
                currentChatMode === "agent"
                  ? "bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-600/25"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              <Headphones size={14} className={currentChatMode === "agent" ? "text-white" : "text-zinc-400"} />
              Live Agent
            </button>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar relative z-10">
        <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.02] pointer-events-none bg-[url('https://w0.peakpx.com/wallpaper/818/148/HD-wallpaper-whatsapp-background-whatsapp-texture.jpg')] bg-repeat" />

        <div className="max-w-3xl mx-auto space-y-2 relative z-10">
          {/* Real-time Mode Notification Banner */}
          <div className="flex justify-center mb-3 sticky top-0 z-20">
            {currentChatMode === "agent" ? (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 backdrop-blur-md border border-emerald-500/30 text-emerald-400 text-[11px] font-bold shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  {isAuth
                    ? "🎧 Live Support agent is connected to your chat."
                    : "🎧 Live Human Agent (Sign in to connect or continue with AI below)"}
                </span>
                {!isAuth && (
                  <Link
                    href="/login"
                    className="ml-1 px-2 py-0.5 rounded bg-emerald-500 text-white font-black text-[10px] hover:bg-emerald-600"
                  >
                    Sign In
                  </Link>
                )}
                <button
                  onClick={() => handleModeChange("ai")}
                  className="ml-1 underline font-black hover:text-emerald-300 cursor-pointer text-emerald-300"
                >
                  Switch to AI
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/15 backdrop-blur-md border border-orange-500/30 text-orange-400 text-[11px] font-bold shadow-sm">
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                <span>🤖 AI Shopping Assistant is active (Instant Answers • Free for all).</span>
                <button
                  onClick={() => handleModeChange("agent")}
                  className="ml-1 underline font-black hover:text-orange-300 cursor-pointer text-orange-300"
                >
                  Request Human
                </button>
              </div>
            )}
          </div>

          {displayMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="w-20 h-20 bg-accent-secondary/10 rounded-3xl flex items-center justify-center text-accent-secondary">
                <Sparkles size={36} />
              </div>
              <div className="max-w-sm space-y-1">
                <h3 className="text-base font-bold text-foreground">
                  Welcome to Vanguard AI Live Support
                </h3>
                <p className="text-xs text-muted-foreground">
                  Ask me about clothing items, sizing, prices, or upload an outfit picture to find matching products instantly!
                </p>
              </div>
            </div>
          ) : (
            displayMessages.map((msg, i) => {
              const myId = user?._id || user?.id;
              const senderId = typeof msg.sender === "string" ? msg.sender : msg.sender?._id || msg.sender?.id;
              const isMe =
                msg.isMe ||
                msg.senderName === "You" ||
                (myId && senderId === myId) ||
                msg.sender?.role?.name === "customer";

              return (
                <ChatMessage
                  key={msg._id || msg.id || i}
                  message={msg}
                  isMe={isMe}
                  onAddToCart={handleAddToCart}
                />
              );
            })
          )}

          {/* AI Typing Indicator */}
          {isAiThinking && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-muted-foreground p-2.5 px-3.5 rounded-2xl bg-[#18222d] border border-orange-500/25 w-fit shadow-lg"
            >
              <Bot size={15} className="animate-spin text-orange-400" />
              <span className="text-[12px] font-extrabold text-orange-400">
                AI Assistant is analyzing inventory & outfit...
              </span>
              <div className="flex gap-1 ml-1">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce [animation-delay:0.4s]" />
              </div>
            </motion.div>
          )}

          <div ref={scrollRef} />
        </div>
      </main>

      {/* Selected Image Preview Pill */}
      {imagePreviewUrl && (
        <div className="px-4 py-2 bg-black/40 border-t border-white/5 flex items-center gap-3 shrink-0">
          <div className="relative h-14 w-14 rounded-xl overflow-hidden border border-orange-500/50 shadow-md">
            <img src={imagePreviewUrl} alt="Preview" className="h-full w-full object-cover" />
            <button
              onClick={() => setSelectedFile(null)}
              className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/80 text-white flex items-center justify-center hover:bg-rose-500 transition-colors"
            >
              <X size={12} />
            </button>
          </div>
          <div>
            <p className="text-xs font-bold text-white">Outfit Image Attached</p>
            <p className="text-[10px] text-zinc-400">Click send to find matching products instantly!</p>
          </div>
        </div>
      )}

      {/* Input area */}
      <footer className="p-3 md:p-6 bg-white dark:bg-[#202c33] border-t border-border/10 shrink-0 z-20 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
        <div className="max-w-3xl mx-auto flex items-center gap-2 md:gap-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setSelectedFile(file);
            }}
            accept="image/*"
            className="hidden"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={isUploading || isAiThinking}
            onClick={() => fileInputRef.current?.click()}
            className="h-11 w-11 md:h-12 md:w-12 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground shrink-0 cursor-pointer"
            title="Upload clothing photo"
          >
            {isUploading ? (
              <Loader2 size={20} className="animate-spin text-orange-400" />
            ) : (
              <ImageIcon size={20} />
            )}
          </Button>

          <div className="flex-1 relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                currentChatMode === "ai"
                  ? "Ask AI Assistant about products, sizes, prices, or upload photo (No login required)..."
                  : "Type your message to live agent..."
              }
              className="w-full h-11 md:h-12 bg-[#f0f2f5] dark:bg-[#2a3942] border-none rounded-2xl px-4 md:px-5 text-[14px] md:text-[15px] focus-visible:ring-0 placeholder:text-muted-foreground/50 shadow-inner text-foreground font-medium"
            />
          </div>

          <Button
            onClick={handleSend}
            disabled={isSendDisabled}
            className={cn(
              "h-11 w-11 md:h-12 md:w-12 rounded-full shadow-md transition-all duration-300 cursor-pointer",
              input.trim() || selectedFile
                ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white scale-100 shadow-orange-500/25"
                : "bg-muted text-muted-foreground scale-95 opacity-50 cursor-not-allowed"
            )}
          >
            {isAiThinking ? (
              <Loader2 size={18} className="animate-spin text-white" />
            ) : (
              <Send
                size={18}
                className={cn(
                  "transition-transform text-white",
                  (input.trim() || selectedFile) && "translate-x-0.5 -translate-y-0.5"
                )}
              />
            )}
          </Button>
        </div>
      </footer>
    </div>
  );
}
