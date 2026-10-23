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
            <div className="flex items-center gap-1.5">
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[8px] font-mono text-muted-foreground uppercase">
                {product.sku || "IN-STOCK"}
              </span>
              <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-0.5">
                <ShieldCheck size={10} /> Official Product
              </span>
            </div>
            <h4 className="mt-1.5 line-clamp-2 text-[13px] font-extrabold text-foreground leading-snug">
              {product.name}
            </h4>
          </div>

          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-[15px] font-black text-accent-secondary">
              ৳{Math.round(finalPrice)}
            </span>
            {discount > 0 && (
              <span className="text-[11px] text-muted-foreground line-through opacity-60">
                ৳{price}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Size Selector Pills */}
      {product.sizes && product.sizes.length > 0 && (
        <div className="border-t border-white/10 bg-black/30 px-3.5 py-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              Select Size:
            </span>
            <span className="text-[9px] text-muted-foreground/60 font-mono">
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
                    "rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all",
                    !isAvailable && "opacity-30 line-through cursor-not-allowed bg-transparent",
                    isSelected
                      ? "bg-accent-secondary text-primary shadow-sm"
                      : "bg-white/10 text-muted-foreground hover:bg-white/20"
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
      <div className="flex items-center justify-between border-t border-white/10 bg-white/5 p-2.5 px-3.5">
        <Link
          href={`/product/${product.slug || product._id}`}
          className="text-[10px] font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          View Details <ChevronRight size={11} />
        </Link>

        <button
          onClick={handleAdd}
          className={cn(
            "flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all duration-300 shadow-md",
            isAdded
              ? "bg-emerald-500 text-white"
              : "bg-accent-secondary text-primary hover:bg-accent-secondary/90 active:scale-95"
          )}
        >
          {isAdded ? (
            <>
              <CheckCircle2 size={13} /> Added!
            </>
          ) : (
            <>
              <ShoppingBag size={13} /> Add to Cart
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
              <span className="flex items-center gap-1 text-[11px] font-extrabold text-accent-secondary">
                <Bot size={13} className="text-accent-secondary" />
                AI Shopping Assistant
                <Sparkles size={11} className="text-amber-400" />
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-bold text-foreground/80">
                <Headphones size={13} className="text-emerald-400" />
                {message.sender?.name || "Support Desk"}
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
              ? "bg-card/90 backdrop-blur-md text-foreground rounded-[20px] rounded-tl-[4px] border border-accent-secondary/20 shadow-lg"
              : "bg-white dark:bg-[#262d31] text-foreground rounded-[20px] rounded-tl-[4px] border border-[#00000008] dark:border-white/5"
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
              <p className="text-[14px] md:text-[15px] leading-[1.6] whitespace-pre-wrap break-words font-[450]">
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
  const addToCartStore = useProductStore((state) => state.addToCart);
  const { messages, isConnected, isAiTyping, sendMessage } = useChat(true);

  // Chat Mode: "ai" (Local VLM) or "agent" (Human Support)
  const [chatMode, setChatMode] = useState("ai");
  const [input, setInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, isAiTyping]);

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
      !!user
    );
    toast.success(`Added ${product.name} to cart!`);
  };

  const handleSend = async () => {
    const textToSend = input.trim();
    if (!textToSend && !selectedFile) return;

    setInput("");
    const file = selectedFile;
    setSelectedFile(null);

    // If image is attached, upload first
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

    // Send via socket message
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
              {chatMode === "ai" ? <Bot size={22} /> : <Headphones size={22} />}
            </div>
            <div
              className={cn(
                "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#202c33]",
                isConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
              )}
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-bold leading-tight">
                {chatMode === "ai" ? "Vanguard AI Shopping Assistant" : "Live Customer Support"}
              </h2>
              {chatMode === "ai" && (
                <span className="rounded-full bg-accent-secondary/20 px-2 py-0.5 text-[9px] font-extrabold text-accent-secondary">
                  Qwen2-VL Local
                </span>
              )}
            </div>
            <p className="text-[11px] font-medium text-emerald-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {isConnected
                ? chatMode === "ai"
                  ? "AI Assistant is ready (Instant Answers)"
                  : "Live Agent is online"
                : "Connecting to server..."}
            </p>
          </div>
        </div>

        {/* Dual Mode Switcher Pill */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-2xl bg-black/5 dark:bg-white/5 p-1 border border-border/10">
            <button
              onClick={() => setChatMode("ai")}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-bold transition-all",
                chatMode === "ai"
                  ? "bg-accent-secondary text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Bot size={14} />
              AI Assistant
            </button>
            <button
              onClick={() => setChatMode("agent")}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-bold transition-all",
                chatMode === "agent"
                  ? "bg-accent-secondary text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Headphones size={14} />
              Live Agent
            </button>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar relative z-10">
        <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.02] pointer-events-none bg-[url('https://w0.peakpx.com/wallpaper/818/148/HD-wallpaper-whatsapp-background-whatsapp-texture.jpg')] bg-repeat" />

        <div className="max-w-3xl mx-auto space-y-2 relative z-10">
          {messages.length === 0 ? (
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
            messages.map((msg, i) => {
              const myId = user?._id || user?.id;
              const senderId = typeof msg.sender === "string" ? msg.sender : msg.sender?._id || msg.sender?.id;
              const isMe = msg.sender?.role?.name === "customer" || (senderId && senderId === myId);
              return (
                <ChatMessage
                  key={msg._id || i}
                  message={msg}
                  isMe={isMe}
                  onAddToCart={handleAddToCart}
                />
              );
            })
          )}

          {/* AI Typing Indicator */}
          {isAiTyping && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-muted-foreground p-2 px-3 rounded-2xl bg-card/60 backdrop-blur-md border border-white/5 w-fit"
            >
              <Bot size={15} className="animate-spin text-accent-secondary" />
              <span className="text-[12px] font-semibold text-accent-secondary">
                AI Assistant is thinking...
              </span>
              <div className="flex gap-1 ml-1">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-secondary animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-accent-secondary animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-accent-secondary animate-bounce [animation-delay:0.4s]" />
              </div>
            </motion.div>
          )}

          <div ref={scrollRef} />
        </div>
      </main>

      {/* Selected Image Preview Pill */}
      {imagePreviewUrl && (
        <div className="px-4 py-2 bg-black/40 border-t border-white/5 flex items-center gap-3 shrink-0">
          <div className="relative h-14 w-14 rounded-xl overflow-hidden border border-accent-secondary/50">
            <img src={imagePreviewUrl} alt="Preview" className="h-full w-full object-cover" />
            <button
              onClick={() => setSelectedFile(null)}
              className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/80 text-white flex items-center justify-center hover:bg-rose-500 transition-colors"
            >
              <X size={12} />
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Image attached. Hit send or type a question about this item!
          </p>
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
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="h-11 w-11 md:h-12 md:w-12 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground shrink-0"
          >
            {isUploading ? (
              <Loader2 size={20} className="animate-spin text-accent-secondary" />
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
                chatMode === "ai"
                  ? "Ask AI Assistant about products, sizes, prices or upload a photo..."
                  : "Type your message to live agent..."
              }
              className="w-full h-11 md:h-12 bg-[#f0f2f5] dark:bg-[#2a3942] border-none rounded-2xl px-4 md:px-5 text-[14px] md:text-[15px] focus-visible:ring-0 placeholder:text-muted-foreground/50 shadow-inner"
            />
          </div>

          <Button
            onClick={handleSend}
            disabled={(!input.trim() && !selectedFile) || !isConnected}
            className={cn(
              "h-11 w-11 md:h-12 md:w-12 rounded-full shadow-md transition-all duration-300",
              input.trim() || selectedFile
                ? "bg-accent-secondary hover:bg-accent-secondary/90 scale-100"
                : "bg-muted text-muted-foreground scale-95 opacity-50"
            )}
          >
            <Send
              size={18}
              className={cn(
                "transition-transform",
                (input.trim() || selectedFile) && "translate-x-0.5 -translate-y-0.5"
              )}
            />
          </Button>
        </div>
      </footer>
    </div>
  );
}
