"use client";

import { motion } from "framer-motion";
import { User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import ChatToolWidgets from "./ChatToolWidgets";

export default function ChatMessageItem({
  msg,
  msgIdx,
  setInputValue,
  handleUndo,
  undoneActions,
  undoing,
}) {
  const isUser = msg.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className={`flex gap-3 max-w-[85%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        {/* Avatar */}
        {isUser ? (
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-900 border border-zinc-600 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm">
            <User size={14} />
          </div>
        ) : (
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 border border-violet-500/30 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-md shadow-violet-500/10">
            <Sparkles size={14} className="text-white animate-pulse" />
          </div>
        )}

        {/* Message bubble card */}
        <div
          className={`rounded-2xl px-4 py-3 shadow-md border leading-relaxed text-sm ${
            isUser
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
          {!isUser && msg.toolExecutions && msg.toolExecutions.length > 0 && (
            <ChatToolWidgets
              executions={msg.toolExecutions}
              msgIdx={msgIdx}
              setInputValue={setInputValue}
              handleUndo={handleUndo}
              undoneActions={undoneActions}
              undoing={undoing}
            />
          )}
          {msg.createdAt && (
            <span
              className={cn(
                "text-[10px] block mt-1.5 font-mono",
                isUser ? "text-primary-foreground/70 text-right" : "text-muted-foreground/60 text-right"
              )}
            >
              {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

