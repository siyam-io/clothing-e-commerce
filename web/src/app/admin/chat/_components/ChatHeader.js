"use client";

import Link from "next/link";
import { ArrowLeft, Search, MoreVertical, User, Check, Bot, Zap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getImageUrl } from "@/utils/imageUtils";
import { cn } from "@/lib/utils";
import { useChat } from "../ChatContext";

export default function ChatHeader({ customer, onlineUsers, className }) {
  const { activeConversation, setConversationMode } = useChat();
  const isAgentMode = activeConversation?.mode === "agent";

  return (
    <header className={cn("z-10 flex h-[60px] shrink-0 items-center justify-between border-l border-border/5 bg-[#f0f2f5] px-4 shadow-sm dark:bg-[#202c33]", className)}>
      <div className="flex min-w-0 items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="lg:hidden rounded-full hover:bg-black/5 dark:hover:bg-white/5 -ml-2 text-foreground/70 shrink-0"
        >
          <Link href="/admin/chat">
            <ArrowLeft size={20} />
          </Link>
        </Button>
        <Avatar className="h-10 w-10 border border-border/10">
          <AvatarImage src={getImageUrl(customer?.avatar)} className="object-cover" />
          <AvatarFallback className="bg-accent-secondary/10 text-accent-secondary font-bold">
            {customer?.name?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-bold truncate leading-tight">{customer?.name}</h2>
            {isAgentMode ? (
              <span className="sm:hidden px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-500">
                Agent
              </span>
            ) : (
              <span className="sm:hidden px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/20 text-purple-400">
                AI
              </span>
            )}
          </div>
          {onlineUsers?.includes(String(customer?._id)) ? (
            <p className="text-[11px] font-medium text-[#00a884]">Online</p>
          ) : (
            <p className="text-[11px] font-medium text-muted-foreground">Offline</p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {/* AI Mode / Takeover Toggle Controls */}
        {isAgentMode ? (
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-500 border border-amber-500/30">
              <Zap size={11} className="text-amber-500 animate-pulse" />
              Takeover Active
            </span>
            <Button
              onClick={() => setConversationMode("ai")}
              size="sm"
              variant="outline"
              className="h-8 rounded-xl border-purple-500/40 text-purple-400 hover:bg-purple-500/10 font-bold text-xs gap-1.5 shadow-sm active:scale-95 transition-all"
              title="Return control to AI Shopping Assistant"
            >
              <Bot size={13} className="text-purple-400" />
              <span>Switch to AI</span>
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-purple-500/15 text-purple-400 border border-purple-500/30">
              <Bot size={11} className="text-purple-400" />
              AI Responding
            </span>
            <Button
              onClick={() => setConversationMode("agent")}
              size="sm"
              className="h-8 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs gap-1.5 shadow-md shadow-orange-500/20 active:scale-95 transition-all"
              title="Take over this conversation from AI"
            >
              <Zap size={13} className="text-white" />
              <span>Take Over</span>
            </Button>
          </div>
        )}

        <Button variant="ghost" size="icon" className="rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-foreground/70">
          <Search size={20} />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-foreground/70">
              <MoreVertical size={20} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5 shadow-2xl border-border/50">
            <DropdownMenuItem asChild className="rounded-lg py-2.5 cursor-pointer">
              <Link href={`/admin/users/${customer?._id}`} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-accent-secondary/10 flex items-center justify-center text-accent-secondary">
                  <User size={16} />
                </div>
                <span className="font-semibold text-sm">User Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg py-2.5 cursor-pointer flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
                <Check size={16} />
              </div>
              <span className="font-semibold text-sm">Close Ticket</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
