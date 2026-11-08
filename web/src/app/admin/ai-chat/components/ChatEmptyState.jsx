"use client";

import { Sparkles, ArrowUpRight } from "lucide-react";

export default function ChatEmptyState({ suggestionChips = [], onSelectSuggestion }) {
  return (
    <div className="my-auto max-w-xl mx-auto text-center space-y-4 py-8 px-4">
      <div className="h-14 w-14 mx-auto rounded-3xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
        <Sparkles size={28} />
      </div>
      <div>
        <h3 className="text-lg font-bold text-foreground">How can I assist you with your store?</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
          I can inspect orders, adjust stock, manage coupons, review categories, and provide business analytics.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left pt-2">
        {suggestionChips.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectSuggestion(chip.prompt)}
            className="p-3 rounded-xl border border-border bg-card/60 hover:bg-muted hover:border-primary/30 transition-all text-xs font-medium text-foreground flex items-center justify-between group shadow-sm"
          >
            <span>{chip.label}</span>
            <ArrowUpRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
          </button>
        ))}
      </div>
    </div>
  );
}

