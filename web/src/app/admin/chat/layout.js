"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Search, MessageSquarePlus, MoreVertical, Loader2, UserPlus } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getImageUrl } from "@/utils/imageUtils";
import { ChatProvider, useChat } from "./ChatContext";
import api from "@/lib/api";
import { ChatListSkeleton } from "@/components/common/Skeletons";
import { useAuthStore } from "@/store/authStore";

export default function ChatLayout({ children }) {
  return (
    <ChatProvider>
      <ChatContent>{children}</ChatContent>
    </ChatProvider>
  );
}

function ChatContent({ children }) {
  const router = useRouter();
  const {
    conversations,
    loading,
    startConversation,
    onlineUsers,
  } = useChat();
  const { id } = useParams();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [globalUsers, setGlobalUsers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // local filter for existing conversations
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const myId = String(user?._id || user?.id || "");
    return conversations.filter((conv) => {
      const otherParticipant = conv.participants?.find((p) => String(p._id || p.id || p) !== myId);
      return (
        otherParticipant?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        otherParticipant?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        otherParticipant?.phone?.includes(searchQuery)
      );
    });
  }, [conversations, searchQuery, user]);

  // Global user search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setGlobalUsers([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.get(`/chat/search-users?query=${searchQuery}`);
        const existingUserIds = new Set(
          conversations.flatMap(c => (c.participants || []).map(p => String(p._id || p.id || p)))
        );
        const newUsers = res.data.filter(u => !existingUserIds.has(String(u._id || u.id)));
        setGlobalUsers(newUsers);
      } catch (err) {
        console.error("Global search failed", err);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, conversations]);

  const handleStartChat = async (userId) => {
    const convId = await startConversation(userId);
    if (convId) {
      router.push(`/admin/chat/${convId}`);
      setSearchQuery("");
    }
  };

  const isMobileSidebarOpen = !id;

  return (
    <div className="relative flex h-dvh min-h-0 overflow-hidden bg-[#f0f2f5] dark:bg-[#0b141a]">
      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex h-dvh min-h-0 w-full flex-col border-r border-[#d1d7db] bg-white shadow-xl transition-[transform,visibility] duration-300 ease-in-out dark:border-[#222d34] dark:bg-[#111b21]",
          "lg:relative lg:inset-auto lg:z-auto lg:h-full lg:w-[380px] lg:translate-x-0 lg:shadow-none",
          isMobileSidebarOpen
            ? "translate-x-0 visible"
            : "-translate-x-full invisible pointer-events-none lg:visible lg:pointer-events-auto"
        )}
      >
        {/* Sidebar Header */}
        <div className="h-[60px] bg-[#f0f2f5] dark:bg-[#202c33] px-4 flex items-center justify-between shrink-0 border-b border-border/5">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-black/5 dark:hover:bg-white/5"
              onClick={() => router.push("/admin")}
            >
              <ArrowLeft size={20} className="text-foreground/70" />
            </Button>
            <h2 className="text-lg font-bold tracking-tight text-foreground/90 ml-1">Messages</h2>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-black/5 dark:hover:bg-white/5">
              <MessageSquarePlus size={20} className="text-foreground/70" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-black/5 dark:hover:bg-white/5">
              <MoreVertical size={20} className="text-foreground/70" />
            </Button>
          </div>
        </div>

        {/* Search Area */}
        <div className="px-3 py-2 shrink-0 bg-white dark:bg-[#111b21]">
          <div className="relative flex items-center bg-[#f0f2f5] dark:bg-[#202c33] rounded-xl px-4 transition-all focus-within:bg-white dark:focus-within:bg-[#2a3942] focus-within:shadow-sm border border-transparent focus-within:border-border/50">
            {isSearching ? <Loader2 size={16} className="text-accent-secondary animate-spin mr-3" /> : <Search size={16} className="text-muted-foreground shrink-0 mr-3" />}
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search people or messages..."
              className="h-10 border-none bg-transparent text-sm focus-visible:ring-0 placeholder:text-muted-foreground/50 px-0"
            />
          </div>
        </div>

        {/* Conversation List */}
        <ScrollArea className="min-h-0 flex-1 bg-white dark:bg-[#111b21]">
          <div className="flex flex-col">
            {loading ? (
              <ChatListSkeleton count={6} />
            ) : (
              <>
                {/* Global Results Section */}
                {globalUsers.length > 0 && (
                  <div className="px-4 py-2 bg-accent/5">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-secondary mb-2">New Contacts</p>
                    {globalUsers.map((user) => (
                      <div
                        key={user._id}
                        onClick={() => handleStartChat(user._id)}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors group"
                      >
                        <Avatar className="h-10 w-10 border border-border/10 shadow-sm">
                          <AvatarImage src={getImageUrl(user.avatar)} className="object-cover" />
                          <AvatarFallback className="bg-accent-secondary/10 text-accent-secondary font-bold text-xs">
                            {user.name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate group-hover:text-accent-secondary transition-colors">{user.name}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] text-muted-foreground truncate uppercase tracking-tighter">{user.role?.name || "Customer"}</p>
                            {user.phone && <p className="text-[10px] text-accent-secondary/70 font-mono tracking-tighter">{user.phone}</p>}
                          </div>
                        </div>
                        <UserPlus size={16} className="text-accent-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))}
                    <div className="h-[1px] bg-border/20 my-3" />
                  </div>
                )}

                {filteredConversations.length === 0 && globalUsers.length === 0 && (
                  <div className="py-20 text-center space-y-3 px-6">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto opacity-20">
                      <MessageSquarePlus size={24} />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {searchQuery ? "No matching frequency found" : "No active transmissions"}
                    </p>
                  </div>
                )}

                {filteredConversations.map((conv) => {
                  const myId = String(user?._id || user?.id || "");
                  const customer = conv.participants?.find((p) => String(p._id || p.id || p) !== myId) || conv.participants?.[0];
                  const isActive = id === conv._id;
                  const lastMsgTime = new Date(conv.updatedAt);
                  const isToday = lastMsgTime.toDateString() === new Date().toDateString();

                  return (
                    <Link
                      key={conv._id}
                      href={`/admin/chat/${conv._id}`}
                      className={cn(
                        "relative w-full h-[72px] flex items-center px-4 transition-all duration-200 group",
                        isActive ? "bg-[#f0f2f5] dark:bg-[#2a3942]" : "hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]"
                      )}
                    >
                      {isActive && <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#00a884] z-10" />}

                      <div className="relative shrink-0 mr-4">
                        <Avatar className="h-12 w-12 border border-border/10 shadow-sm">
                          <AvatarImage src={getImageUrl(customer?.avatar)} className="object-cover" />
                          <AvatarFallback className="bg-accent-secondary/10 text-accent-secondary font-bold">
                            {customer?.name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className={cn(
                          "absolute bottom-0 right-0 w-3 h-3 border-2 border-white dark:border-[#111b21] rounded-full",
                          onlineUsers.includes(String(customer?._id)) ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
                        )} />
                      </div>

                      <div className="flex-1 min-w-0 h-full flex flex-col justify-center border-b border-border/50 dark:border-white/5">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <h3 className={cn("text-[15px] truncate", conv.unreadCount > 0 ? "font-bold text-foreground" : "font-medium text-foreground/90")}>
                              {customer?.name || "Anonymous_User"}
                            </h3>
                            {conv.mode === "agent" ? (
                              <span className="shrink-0 px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                                ⚡ Agent
                              </span>
                            ) : (
                              <span className="shrink-0 px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                                🤖 AI
                              </span>
                            )}
                          </div>
                          <span className={cn("text-[11px] whitespace-nowrap ml-2", conv.unreadCount > 0 ? "text-[#00a884] font-bold" : "text-muted-foreground/60")}>
                            {isToday ? lastMsgTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }) : lastMsgTime.toLocaleDateString([], { month: "short", day: "numeric" })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className={cn("text-[13px] truncate pr-4", conv.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground/70")}>
                            {conv.lastMessage?.text || "Establish connection..."}
                          </p>
                          {conv.unreadCount > 0 && <div className="bg-[#00a884] text-white text-[10px] font-black min-w-[20px] h-[20px] flex items-center justify-center rounded-full px-1.5 shadow-sm animate-in zoom-in">{conv.unreadCount}</div>}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right panel – only renders children, NO header/input */}
      <div className="flex-1 min-w-0 min-h-0 relative overflow-hidden">
        {children}
      </div>
    </div>
  );
}
