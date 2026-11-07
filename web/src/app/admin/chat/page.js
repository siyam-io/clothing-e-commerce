"use client";

import { motion } from "framer-motion";
import { MessageCircle, Home, Smartphone, Monitor, Shield } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/appStore";

function ChatIdlePage() {
  const { settings } = useAppStore();
  const siteName = settings?.branding?.siteName || "Store";

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center h-full">
      {/* Mobile Back Header */}
      <div className="lg:hidden absolute top-0 left-0 right-0 h-[60px] bg-[#f0f2f5] dark:bg-[#202c33] px-4 flex items-center shadow-sm">
        <Link href="/admin">
          <Button variant="ghost" size="icon" className="rounded-full">
            <Home size={20} className="text-[#54656f] dark:text-[#aebac1]" />
          </Button>
        </Link>
        <h2 className="ml-4 text-base font-medium text-[#111b21] dark:text-[#e9edef]">{siteName} Messenger</h2>
      </div>

      <div className="max-w-md space-y-8 flex flex-col items-center">
        <div className="relative">
          <motion.div
            animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="h-64 w-64 rounded-full bg-muted/10 border-2 border-dashed border-[#d1d7db] dark:border-[#222d34] flex items-center justify-center"
          >
            <img 
              src="https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png"
              className="absolute inset-0 w-full h-full object-cover opacity-5 rounded-full"
              alt=""
            />
            <Monitor size={80} className="text-[#54656f] dark:text-[#aebac1] opacity-20" />
          </motion.div>
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute -bottom-4 -right-4 h-24 w-24 bg-primary/20 rounded-3xl backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl"
          >
            <Smartphone size={32} className="text-primary" />
          </motion.div>
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{siteName} Live Chat</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Select a conversation from the sidebar or search for a customer to start chatting. Real-time support messaging is active.
          </p>
        </div>
        
        <div className="pt-8 border-t border-border/60 w-full">
           <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
             <Shield size={14} className="text-emerald-500" /> Real-time customer messaging connected
           </p>
        </div>
      </div>
    </div>
  );
}

export default function ChatIndexPage() {
  return <ChatIdlePage />;
}