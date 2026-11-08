"use client";

import React from "react";
import Link from "next/link";
import {
  Plus,
  X,
  Search,
  MessageSquare,
  Edit3,
  Trash2,
  Check,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function ChatSessionSidebar({
  showLeftSidebar,
  setShowLeftSidebar,
  handleNewChat,
  searchSessionQuery,
  setSearchSessionQuery,
  sessions = [],
  filteredSessions = [],
  sessionsLoading = false,
  currentSessionId,
  editingSessionId,
  setEditingSessionId,
  editingSessionTitle,
  setEditingSessionTitle,
  handleSelectSession,
  handleStartRenameSession,
  handleSaveRenameSession,
  handleDeleteSession,
  handleClearAllHistory,
}) {
  return (
    <>
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 flex flex-col bg-card/95 lg:bg-card/70 backdrop-blur-2xl border-r border-border transition-all duration-300 ease-in-out shrink-0",
          showLeftSidebar
            ? "w-72 translate-x-0"
            : "-translate-x-full lg:w-0 lg:border-r-0 lg:overflow-hidden"
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
              <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-mono">
                {filteredSessions.length}
              </span>
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
                      if (typeof window !== "undefined" && window.innerWidth < 1024) {
                        setShowLeftSidebar(false);
                      }
                    }
                  }}
                  className={cn(
                    "group relative flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer border",
                    isActive
                      ? "bg-primary/10 border-primary/30 text-primary font-semibold shadow-sm"
                      : "border-transparent hover:bg-muted text-foreground/80 hover:text-foreground"
                  )}
                >
                  <MessageSquare
                    size={14}
                    className={cn("shrink-0", isActive ? "text-primary" : "text-muted-foreground")}
                  />

                  {isEditing ? (
                    <div
                      className="flex-1 flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
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
                        className="p-1 hover:text-primary text-muted-foreground cursor-pointer"
                      >
                        <Check size={12} />
                      </button>
                      <button
                        onClick={() => setEditingSessionId(null)}
                        className="p-1 hover:text-destructive text-muted-foreground cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <span className="truncate flex-1 select-none">
                      {s.title || "Untitled Session"}
                    </span>
                  )}

                  {/* Actions (Rename + Delete) */}
                  {!isEditing && (
                    <div
                      className={cn(
                        "items-center gap-0.5 shrink-0 transition-opacity",
                        isActive
                          ? "flex opacity-100"
                          : "hidden group-hover:flex opacity-70 group-hover:opacity-100"
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleStartRenameSession(s)}
                        title="Rename"
                        className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <Edit3 size={12} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteSession(e, s.id)}
                        title="Delete conversation"
                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive cursor-pointer"
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
              className="text-[11px] hover:text-destructive transition-colors text-muted-foreground flex items-center gap-1 cursor-pointer"
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
    </>
  );
}

