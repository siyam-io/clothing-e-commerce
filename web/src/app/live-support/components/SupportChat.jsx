"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useChat } from "@/app/live-support/lib/useChat";
import { useAuthStore } from "@/store/authStore";
import { useAppStore } from "@/store/appStore";
import { useProductStore } from "@/store/productStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Send,
  X,
  Plus,
  Loader2,
  ArrowUpCircle,
  Check,
  CheckCheck,
  Bot,
  Headphones,
  Sparkles,
  ShoppingBag,
  Image as ImageIcon,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import api from "@/lib/api";
import { getImageUrl } from "@/utils/imageUtils";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";

// -----------------------------------------------------------------------------
// Interactive Product Preview Card inside AI Chat Bubble
// -----------------------------------------------------------------------------
function ProductMatchCard({ product, onAddToCart }) {
  const [selectedSizeId, setSelectedSizeId] = useState(() => {
    if (!product.sizes || product.sizes.length === 0) return null;
    const inStock = product.sizes.find((s) => s.stock > 0);
    return inStock ? (inStock.size?._id || inStock.size) : (product.sizes[0]?.size?._id || product.sizes[0]?.size);
  });
  const [isAdded, setIsAdded] = useState(false);

  const price = product.price || 0;
  const discount = product.discount || 0;
  const finalPrice = discount > 0 ? price - (price * discount) / 100 : price;
  const primaryImage = product.images?.[0] || "";

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
    <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md transition-all hover:border-accent-secondary/40 shadow-lg">
      <div className="flex gap-3 p-3">
        {/* Product Image */}
        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-black/20 border border-white/5">
          <img
            src={getImageUrl(primaryImage, 200)}
            alt={product.name}
            className="h-full w-full object-cover"
          />
          {discount > 0 && (
            <span className="absolute top-1 left-1 rounded-md bg-rose-500/90 px-1.5 py-0.5 text-[8px] font-black text-white shadow">
              -{discount}%
            </span>
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
                <ShieldCheck size={10} /> Verified
              </span>
            </div>
            <h4 className="mt-1 truncate text-[12px] font-bold text-foreground">
              {product.name}
            </h4>
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="text-[13px] font-black text-foreground">
              ৳{Math.round(finalPrice)}
            </span>
            {discount > 0 && (
              <span className="text-[10px] text-muted-foreground line-through opacity-60">
                ৳{price}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Size Selector Pills */}
      {product.sizes && product.sizes.length > 0 && (
        <div className="border-t border-white/5 bg-black/20 px-3 py-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              Choose Size:
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
                    "rounded-lg px-2 py-0.5 text-[9px] font-bold transition-all",
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
      <div className="flex items-center justify-between border-t border-white/5 bg-white/5 p-2 px-3">
        <Link
          href={`/product/${product.slug || product._id}`}
          className="text-[9px] font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          Details <ChevronRight size={10} />
        </Link>

        <button
          onClick={handleAdd}
          className={cn(
            "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all duration-300 shadow-md",
            isAdded
              ? "bg-emerald-500 text-white"
              : "bg-accent-secondary text-primary hover:bg-accent-secondary/90 active:scale-95"
          )}
        >
          {isAdded ? (
            <>
              <CheckCircle2 size={12} /> Added
            </>
          ) : (
            <>
              <ShoppingBag size={12} /> Add to Cart
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Main SupportChat Component
// -----------------------------------------------------------------------------
export default function SupportChat() {
  const { user } = useAuthStore();
  const { isChatOpen: isOpen, setChatOpen: setIsOpen } = useAppStore();
  const addToCartStore = useProductStore((state) => state.addToCart);
  const pathname = usePathname();

  // Mode: "ai" (default) or "agent" (human live support)
  const [chatMode, setChatMode] = useState("ai");

  // ---------------------------------------------------------------------------
  // AI Assistant State
  // ---------------------------------------------------------------------------
  const [aiMessages, setAiMessages] = useState([
    {
      id: "welcome-1",
      role: "assistant",
      text: "👋 Welcome to Vanguard! I am your AI Shopping Assistant running our custom local multimodal vision model.\n\nUpload a picture of any outfit or ask me about style, sizing, and pricing to find and order products instantly!",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [aiInput, setAiInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

  // ---------------------------------------------------------------------------
  // Live Human Support Chat (Socket.io)
  // ---------------------------------------------------------------------------
  const {
    messages: liveMessages,
    isConnected: isLiveConnected,
    sendMessage: sendLiveMessage,
    loadMore,
    hasMore,
    isLoadingMore,
  } = useChat(isOpen && chatMode === "agent" && !!user);

  const [localLiveMessages, setLocalLiveMessages] = useState([]);
  const [liveInput, setLiveInput] = useState("");
  const [isLiveUploading, setIsLiveUploading] = useState(false);

  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const liveFileInputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages.length, isAiLoading, localLiveMessages.length, liveMessages.length, chatMode]);

  // Handle image preview cleanup
  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setImagePreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImagePreviewUrl(null);
    }
  }, [selectedFile]);

  // ---------------------------------------------------------------------------
  // Handlers for AI Assistant
  // ---------------------------------------------------------------------------
  const handleSendAiMessage = async (customText = null) => {
    const textToSend = customText || aiInput.trim();
    if (!textToSend && !selectedFile) return;

    const userMessageId = `user_${Date.now()}`;
    const userMsg = {
      id: userMessageId,
      role: "user",
      text: textToSend,
      image: imagePreviewUrl,
      timestamp: new Date().toISOString(),
    };

    setAiMessages((prev) => [...prev, userMsg]);
    setAiInput("");
    const fileToUpload = selectedFile;
    setSelectedFile(null);
    setIsAiLoading(true);

    try {
      const formData = new FormData();
      if (textToSend) formData.append("message", textToSend);
      if (fileToUpload) formData.append("image", fileToUpload);

      // Pass previous 4 conversation turns for context
      const historyContext = aiMessages.slice(-4).map((m) => ({
        role: m.role,
        content: m.text,
      }));
      formData.append("history", JSON.stringify(historyContext));

      const res = await api.post("/chat", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success && res.data.data) {
        const { reply, actionResult, actionPayload, matchedProducts } = res.data.data;

        // If the AI model executed an automated cart add, sync with frontend store
        if (actionResult?.success && actionResult.product) {
          const p = actionResult.product;
          addToCartStore(
            { _id: p.id, name: p.name, price: p.unitPrice, discount: 0, images: [] },
            p.sizeId || "default",
            p.quantity || 1,
            !!user
          );
          toast.success(actionResult.message || "Added item to cart!");
        }

        const assistantMsg = {
          id: `ai_${Date.now()}`,
          role: "assistant",
          text: reply,
          actionResult,
          actionPayload,
          matchedProducts: matchedProducts || (actionResult?.product ? [actionResult.product] : []),
          timestamp: new Date().toISOString(),
        };

        setAiMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error(res.data?.message || "Failed to receive AI response");
      }
    } catch (err) {
      console.error("AI Chat Transmission Error:", err);
      setAiMessages((prev) => [
        ...prev,
        {
          id: `ai_err_${Date.now()}`,
          role: "assistant",
          text: "I experienced a temporary communication hiccup while contacting our local vision model. Please feel free to try again or browse our catalog!",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsAiLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddToCartFromCard = (product, sizeId) => {
    addToCartStore(product, sizeId, 1, !!user);
    toast.success(`Added ${product.name} to cart!`);
  };

  if (pathname.startsWith("/admin")) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-[94vw] sm:w-[26rem] h-[calc(100vh-8rem)] max-h-[640px] bg-background/95 dark:bg-[#0c1015]/95 backdrop-blur-2xl border border-white/10 dark:border-white/10 rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden mb-2 pointer-events-auto ring-1 ring-black/5"
          >
            {/* -----------------------------------------------------------------
                Header & Dual Mode Switcher
            ------------------------------------------------------------------ */}
            <div className="p-4 px-5 bg-card/70 border-b border-border/40 backdrop-blur-md flex flex-col gap-3 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-2xl bg-accent-secondary/15 flex items-center justify-center text-accent-secondary border border-accent-secondary/20 shadow-inner">
                    {chatMode === "ai" ? <Bot size={18} /> : <Headphones size={18} />}
                  </div>
                  <div>
                    <h3 className="text-[13px] font-black tracking-tight text-foreground flex items-center gap-1.5">
                      {chatMode === "ai" ? "Vanguard AI Assistant" : "Live Customer Support"}
                      {chatMode === "ai" && (
                        <span className="flex items-center gap-1 rounded-full bg-accent-secondary/10 px-2 py-0.5 text-[8px] font-bold text-accent-secondary">
                          <Sparkles size={9} /> VLM
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {chatMode === "ai"
                        ? "Local Multimodal Vision Active"
                        : user
                        ? isLiveConnected
                          ? "Agent Connected"
                          : "Connecting..."
                        : "Login Required for Live Agent"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Mode Toggle Switch */}
              <div className="grid grid-cols-2 p-1 bg-muted/40 rounded-xl border border-border/20 text-[11px] font-bold">
                <button
                  onClick={() => setChatMode("ai")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all duration-200",
                    chatMode === "ai"
                      ? "bg-accent-secondary text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Bot size={13} /> AI Shopping Assistant
                </button>
                <button
                  onClick={() => setChatMode("agent")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all duration-200",
                    chatMode === "agent"
                      ? "bg-accent-secondary text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Headphones size={13} /> Live Agent
                </button>
              </div>
            </div>

            {/* -----------------------------------------------------------------
                AI ASSISTANT CHAT VIEW (Supports Guests & Authenticated Users)
            ------------------------------------------------------------------ */}
            {chatMode === "ai" ? (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar scroll-smooth">
                {aiMessages.map((msg) => {
                  const isUser = msg.role === "user";

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
                    >
                      <div className={cn("max-w-[85%] flex flex-col", isUser ? "items-end" : "items-start")}>
                        <div
                          className={cn(
                            "rounded-[1.4rem] p-3.5 text-[12px] font-medium leading-relaxed shadow-sm transition-all",
                            isUser
                              ? "bg-accent-secondary text-primary rounded-tr-none shadow-accent-secondary/15"
                              : "bg-card dark:bg-[#151c24] text-foreground border border-border/40 rounded-tl-none shadow-black/5"
                          )}
                        >
                          {/* User Uploaded Image Preview */}
                          {msg.image && (
                            <div className="mb-2 overflow-hidden rounded-xl border border-white/10">
                              <img
                                src={msg.image}
                                alt="User query"
                                className="max-h-48 w-full object-cover rounded-xl"
                              />
                            </div>
                          )}

                          {/* Message Text */}
                          <div className="whitespace-pre-wrap break-words">{msg.text}</div>

                          {/* Matched Product Cards (Rendered inside AI Bubble) */}
                          {!isUser && msg.matchedProducts && msg.matchedProducts.length > 0 && (
                            <div className="space-y-2 pt-1">
                              {msg.matchedProducts.slice(0, 2).map((prod) => (
                                <ProductMatchCard
                                  key={prod._id || prod.id}
                                  product={prod}
                                  onAddToCart={handleAddToCartFromCard}
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        <span className="mt-1 px-1 text-[9px] font-mono text-muted-foreground/60 uppercase">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}

                {/* AI Thinking Animation */}
                {isAiLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 bg-card dark:bg-[#151c24] border border-border/40 rounded-2xl w-fit text-muted-foreground text-[11px] font-medium"
                  >
                    <Loader2 size={14} className="animate-spin text-accent-secondary" />
                    <span>Analyzing visual and product inventory...</span>
                  </motion.div>
                )}

                {/* Quick Prompt Suggestions when conversation is fresh */}
                {aiMessages.length <= 2 && !isAiLoading && (
                  <div className="pt-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                      Suggested Inquiries:
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {[
                        "🔥 What are your trending denim shirts?",
                        "🚚 What is your delivery time and COD policy?",
                        "🏷️ Do you have any active sale discounts?",
                      ].map((prompt, i) => (
                        <button
                          key={i}
                          onClick={() => handleSendAiMessage(prompt)}
                          className="text-left text-[11px] font-medium bg-muted/40 hover:bg-muted/70 text-foreground p-2 px-3 rounded-xl border border-border/20 transition-all flex items-center justify-between"
                        >
                          <span>{prompt}</span>
                          <ChevronRight size={12} className="opacity-40" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div ref={scrollRef} />
              </div>
            ) : (
              /* -----------------------------------------------------------------
                 LIVE AGENT SUPPORT VIEW (Requires Auth / Socket.io)
              ------------------------------------------------------------------ */
              <div className="flex-1 flex flex-col overflow-hidden">
                {!user ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
                    <div className="h-20 w-20 rounded-3xl bg-muted/60 flex items-center justify-center text-muted-foreground border border-border">
                      <Headphones size={32} />
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="text-[14px] font-black text-foreground">Sign In for Live Agent</h4>
                      <p className="text-[11px] text-muted-foreground px-4">
                        To connect with a real-time human support executive, please authorize your account.
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 w-full max-w-xs">
                      <Link
                        href="/login"
                        onClick={() => setIsOpen(false)}
                        className="py-3 bg-accent-secondary text-primary text-[11px] font-black uppercase tracking-wider rounded-xl shadow-md text-center"
                      >
                        Sign In Now
                      </Link>
                      <button
                        onClick={() => setChatMode("ai")}
                        className="py-2.5 text-[11px] font-bold text-muted-foreground hover:text-foreground transition-colors"
                      >
                        ← Continue with AI Assistant (No Login Required)
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                    {liveMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center py-20 text-center opacity-40">
                        <MessageSquare size={36} className="mb-2" />
                        <p className="text-[11px] font-bold uppercase tracking-wider">No active live messages</p>
                      </div>
                    ) : (
                      liveMessages.map((msg, i) => {
                        const myId = user?._id || user?.id;
                        const senderId = typeof msg.sender === "string" ? msg.sender : msg.sender?._id || msg.sender?.id;
                        const isMe = senderId === myId;

                        return (
                          <div key={msg._id || i} className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
                            <div className={cn("max-w-[80%]", isMe ? "items-end" : "items-start")}>
                              <div
                                className={cn(
                                  "rounded-2xl p-3 text-[12px] font-medium leading-relaxed",
                                  isMe
                                    ? "bg-accent-secondary text-primary rounded-tr-none"
                                    : "bg-card dark:bg-[#151c24] text-foreground border border-border/40 rounded-tl-none"
                                )}
                              >
                                {msg.image && (
                                  <img
                                    src={getImageUrl(msg.image)}
                                    alt="attachment"
                                    className="max-h-40 w-full object-cover rounded-xl mb-1.5"
                                  />
                                )}
                                {msg.text && <p>{msg.text}</p>}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={scrollRef} />
                  </div>
                )}
              </div>
            )}

            {/* -----------------------------------------------------------------
                Selected File Preview Thumbnail (AI Mode)
            ------------------------------------------------------------------ */}
            {chatMode === "ai" && imagePreviewUrl && (
              <div className="p-2 px-4 bg-muted/30 border-t border-border/20 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <img
                    src={imagePreviewUrl}
                    alt="Upload Preview"
                    className="h-10 w-10 rounded-lg object-cover border border-border"
                  />
                  <div>
                    <p className="text-[10px] font-bold text-foreground">Attached Photo</p>
                    <p className="text-[9px] text-muted-foreground">Ready to analyze</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="p-1.5 text-muted-foreground hover:text-rose-500 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* -----------------------------------------------------------------
                Input Footer Bar
            ------------------------------------------------------------------ */}
            <div className="p-3 bg-card/90 border-t border-border/30 backdrop-blur-md flex items-center gap-2 shrink-0">
              {chatMode === "ai" ? (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setSelectedFile(file);
                    }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isAiLoading}
                    className="h-10 w-10 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors shrink-0"
                    title="Upload Clothing Photo"
                  >
                    <ImageIcon size={18} />
                  </button>

                  <input
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendAiMessage();
                      }
                    }}
                    placeholder={selectedFile ? "Add details or ask about this photo..." : "Ask about clothing, sizes, or upload photo..."}
                    className="flex-1 bg-muted/40 text-[12px] font-medium placeholder:text-muted-foreground/60 outline-none px-3.5 py-2.5 rounded-xl border border-transparent focus:border-border/60 transition-all"
                  />

                  <button
                    onClick={() => handleSendAiMessage()}
                    disabled={(!aiInput.trim() && !selectedFile) || isAiLoading}
                    className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-200 shrink-0",
                      aiInput.trim() || selectedFile
                        ? "bg-accent-secondary text-primary shadow-md hover:scale-105 active:scale-95"
                        : "bg-muted/40 text-muted-foreground/40 cursor-not-allowed"
                    )}
                  >
                    {isAiLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </>
              ) : (
                /* Live Agent Input */
                user && (
                  <>
                    <input
                      type="file"
                      ref={liveFileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setIsLiveUploading(true);
                        const formData = new FormData();
                        formData.append("image", file);
                        try {
                          const res = await api.post("/chat/upload", formData);
                          if (res.data.success) sendLiveMessage({ image: res.data.url });
                        } catch (err) {
                          console.error(err);
                        } finally {
                          setIsLiveUploading(false);
                          if (liveFileInputRef.current) liveFileInputRef.current.value = "";
                        }
                      }}
                    />
                    <button
                      onClick={() => liveFileInputRef.current?.click()}
                      disabled={isLiveUploading}
                      className="h-10 w-10 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors shrink-0"
                    >
                      {isLiveUploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={18} />}
                    </button>

                    <input
                      value={liveInput}
                      onChange={(e) => setLiveInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && liveInput.trim()) {
                          sendLiveMessage({ text: liveInput });
                          setLiveInput("");
                        }
                      }}
                      placeholder="Message support agent..."
                      className="flex-1 bg-muted/40 text-[12px] font-medium outline-none px-3.5 py-2.5 rounded-xl border border-transparent focus:border-border/60 transition-all"
                    />

                    <button
                      onClick={() => {
                        if (liveInput.trim()) {
                          sendLiveMessage({ text: liveInput });
                          setLiveInput("");
                        }
                      }}
                      disabled={!liveInput.trim() || isLiveUploading}
                      className="h-10 w-10 rounded-xl bg-accent-secondary text-primary flex items-center justify-center shadow-md disabled:opacity-40 shrink-0"
                    >
                      <Send size={16} />
                    </button>
                  </>
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
