"use client";

import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getImageUrl } from "@/utils/imageUtils";
import { Sparkles, ShieldCheck, User } from "lucide-react";

export default function ProfileHeader({ user, ui }) {
  if (!user) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full mb-6 md:mb-12"
    >
      {/* Decorative background element */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="flex flex-col items-center md:items-end gap-4 md:gap-12 md:flex-row">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-tr from-accent-secondary to-primary blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 rounded-full" />
          <Avatar className="h-24 w-24 sm:h-40 sm:w-40 md:h-48 md:w-48 border-[3px] sm:border-[6px] border-background shadow-2xl relative z-10">
            <AvatarImage src={getImageUrl(user.avatar)} alt={user.name} className="object-cover" referrerPolicy="no-referrer" />
            <AvatarFallback className="bg-accent text-2xl sm:text-4xl font-black">
              {user.name?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 z-20 bg-background border border-border p-1.5 sm:p-3 rounded-lg sm:rounded-2xl shadow-xl">
             {user.role?.name === 'admin' || user.role?.name === 'superadmin' ? (
                <ShieldCheck className="w-3 h-3 sm:w-6 sm:h-6 text-accent-secondary" />
             ) : (
                <User className="w-3 h-3 sm:w-6 sm:h-6 text-primary" />
             )}
          </div>
        </div>

        <div className="text-center md:text-left flex-1 space-y-2 md:space-y-6">
          <div className="space-y-1 md:space-y-2">
             <Badge variant="outline" className="px-2 md:px-4 py-0.5 md:py-1 rounded-full border-primary/20 text-[7px] md:text-[10px] font-black uppercase tracking-[0.2em] bg-accent/30 text-primary">
               {user.role?.name === 'admin' || user.role?.name === 'superadmin' ? ui.admin : ui.member}
             </Badge>
             <h1 className="text-3xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase italic tracking-tighter leading-[0.9] text-gradient py-1 md:py-2">
               {user.name}
             </h1>
          </div>
          
          <p className="text-[9px] md:text-sm font-bold text-muted-foreground uppercase tracking-[0.3em] flex items-center justify-center md:justify-start gap-1.5 md:gap-3">
             <Sparkles size={10} className="text-accent-secondary shrink-0" />
             <span className="truncate max-w-[200px] sm:max-w-none">{user.email}</span>
          </p>

          {user.bio && (
            <p className="max-w-xl text-[10px] md:text-sm font-medium text-muted-foreground leading-relaxed italic border-l-2 border-accent-secondary/30 pl-3 md:pl-6 py-0.5 md:py-2 mx-auto md:mx-0">
              &ldquo;{user.bio}&rdquo;
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
