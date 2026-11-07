"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { getImageUrl } from "@/utils/imageUtils";
import { useDebounce } from "@/hooks/useDebounce";
import { Search, X, Loader2, User as UserIcon, FileText, Package, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Price } from "@/components/common/Price";

export default function FilterBar({
  search,
  onSearchSubmit,
  onSearchChange,
  sort,
  onSortChange,
  sortOptions,
  searchPlaceholder = "Search items...",
  sortLabel = "Sort By:",
  liveSearch = true,
  debounceMs = 300,
  entityType = "product", // "product", "user", "blog"
}) {
  const router = useRouter();
  const [inputValue, setInputValue] = useState(search || "");
  const [isFocused, setIsFocused] = useState(false);
  const hasSort = sortOptions?.length > 0 && onSortChange;

  // Suggestions state
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef(null);

  // Debounce the input for suggestions
  const debouncedSuggestionsInput = useDebounce(inputValue, 200);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (entityType !== "product" || !debouncedSuggestionsInput || debouncedSuggestionsInput.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      setLoadingSuggestions(true);
      try {
        const response = await api.get(`/products?search=${encodeURIComponent(debouncedSuggestionsInput.trim())}&limit=6`);
        if (response.data && response.data.success) {
          setSuggestions(response.data.products || []);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.error("Error fetching suggestions:", err);
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    fetchSuggestions();
  }, [debouncedSuggestionsInput, entityType]);

  // Click outside handler to dismiss suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Reset index when suggestions change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [suggestions]);

  const handleSelectSuggestion = (suggestionName) => {
    setInputValue(suggestionName);
    setShowSuggestions(false);
    if (onSearchSubmit) onSearchSubmit(suggestionName);
    if (onSearchChange) onSearchChange(suggestionName);
  };

  const highlightMatch = (text, query) => {
    if (!query) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <strong key={i} className="text-primary font-black">{part}</strong>
          ) : (
            <span key={i} className="text-foreground/80 font-normal">{part}</span>
          )
        )}
      </span>
    );
  };

  const isSuggestionsVisible = showSuggestions && entityType === "product" && (loadingSuggestions || suggestions.length > 0 || (inputValue.trim().length >= 2 && !loadingSuggestions));

  const debouncedInput = useDebounce(inputValue, debounceMs);
  const onSearchChangeRef = useRef(onSearchChange);
  const currentSearchRef = useRef(search || "");

  useEffect(() => {
    onSearchChangeRef.current = onSearchChange;
  }, [onSearchChange]);

  useEffect(() => {
    currentSearchRef.current = search || "";
    // Only update input if it's NOT focused, to prevent "glitches" while typing
    if (!isFocused && search !== undefined && search !== inputValue) {
      setInputValue(search || "");
    }
  }, [search, isFocused]);

  useEffect(() => {
    if (liveSearch && onSearchChangeRef.current) {
      if (debouncedInput !== currentSearchRef.current) {
        onSearchChangeRef.current(debouncedInput);
      }
    }
  }, [debouncedInput, liveSearch]);

  const handleClearSearch = (e) => {
    e.preventDefault();
    setInputValue("");
    if (onSearchChange) onSearchChange("");
  };

  return (
    <div className="bg-card/40 backdrop-blur-3xl rounded-3xl shadow-xl border border-border/10 p-2 md:p-3 flex flex-col md:flex-row gap-3 items-center justify-between relative z-50 transition-all w-full">
      {/* Search Input Container */}
      <div ref={containerRef} className={cn("w-full relative group", hasSort && "md:w-1/2")}>
        <div className="relative w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-all group-focus-within:text-primary z-10" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => {
              setIsFocused(true);
              setShowSuggestions(true);
            }}
            onBlur={() => setIsFocused(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (selectedIndex >= 0 && suggestions[selectedIndex]) {
                  handleSelectSuggestion(suggestions[selectedIndex].name);
                } else {
                  if (onSearchSubmit) onSearchSubmit(inputValue);
                  if (onSearchChange) onSearchChange(inputValue);
                  setShowSuggestions(false);
                }
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                setShowSuggestions(true);
                setSelectedIndex((prev) => 
                  prev < suggestions.length - 1 ? prev + 1 : prev
                );
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((prev) => (prev > -1 ? prev - 1 : -1));
              } else if (e.key === "Escape") {
                setShowSuggestions(false);
                setSelectedIndex(-1);
              }
            }}
            className="w-full pl-14 pr-12 py-4 bg-muted/30 border border-transparent rounded-2xl outline-none font-bold text-foreground transition-all placeholder:text-muted-foreground/40 text-[11px] uppercase tracking-wider relative z-10 hover:bg-muted/50 focus:ring-2 focus:ring-primary/20 focus:border-primary/20"
          />
          {loadingSuggestions && (
            <Loader2 className="absolute right-12 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin z-10" />
          )}
          {inputValue && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors z-20"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {isSuggestionsVisible && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-card/95 backdrop-blur-3xl border border-border/10 shadow-2xl rounded-2xl p-2 z-[999] max-h-80 overflow-y-auto custom-scrollbar flex flex-col gap-1">
            {loadingSuggestions && suggestions.length === 0 && (
              <div className="flex items-center gap-3 px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                <Loader2 className="h-3 w-3 animate-spin text-accent-secondary" />
                Fetching suggestions...
              </div>
            )}

            {!loadingSuggestions && suggestions.length === 0 && (
              <div className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                No matching suggestions
              </div>
            )}

            {suggestions.map((suggestion, index) => {
              const isSelected = selectedIndex === index;
              return (
                <div
                  key={suggestion._id}
                  onClick={() => handleSelectSuggestion(suggestion.name)}
                  className={cn(
                    "flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-300 group/item",
                    isSelected 
                      ? "bg-gradient-to-r from-accent/25 to-accent-secondary/15 border-l-4 border-accent-secondary pl-3" 
                      : "hover:bg-muted/40"
                  )}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    {/* Thumbnail */}
                    <div className="h-8 w-8 rounded-lg overflow-hidden border border-border/5 bg-accent/5 shrink-0">
                      {suggestion.images?.[0] ? (
                        <img 
                          src={getImageUrl(suggestion.images[0], 64, 64)} 
                          alt="" 
                          className="h-full w-full object-cover grayscale group-hover/item:grayscale-0 transition-all duration-500"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-muted">
                          <Package size={12} className="text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    {/* Details */}
                    <div className="flex flex-col text-left overflow-hidden">
                      <div className="text-[11px] font-bold truncate">
                        {highlightMatch(suggestion.name, inputValue)}
                      </div>
                      <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1">
                        {suggestion.category?.name || "General"}
                        {suggestion.subcategory?.name && (
                          <>
                            <ChevronRight size={8} />
                            {suggestion.subcategory.name}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Price & Go link */}
                  <div className="flex items-center gap-3 shrink-0">
                    <Price
                      amount={suggestion.price}
                      className="text-[10px] font-black text-accent-secondary"
                    />
                    <Link
                      href={`/products/${suggestion.slug}`}
                      onClick={(e) => {
                        e.stopPropagation(); // Stop row click trigger
                      }}
                      className="h-7 w-7 rounded-lg border border-border/10 flex items-center justify-center bg-background/50 hover:bg-foreground hover:text-background hover:border-foreground transition-all"
                    >
                      <ChevronRight size={12} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sort Dropdown */}
      {hasSort && (
      <div className="w-full md:w-auto flex items-center group gap-4 px-2">
        {sortLabel && (
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest hidden lg:block shrink-0 transition-colors group-hover:text-foreground">
            {sortLabel}
          </span>
        )}
        <Select value={sort || "all"} onValueChange={onSortChange}>
          <SelectTrigger className="w-full md:min-w-[180px] h-12 bg-muted/30 border border-transparent rounded-2xl px-6 font-bold text-[10px] uppercase tracking-widest hover:bg-muted/50 transition-all shadow-sm focus:ring-2 focus:ring-primary/20">
            <SelectValue placeholder="Sort Items" />
          </SelectTrigger>
          <SelectContent className="bg-card/95 backdrop-blur-3xl border border-border/10 shadow-2xl rounded-2xl p-1">
            {sortOptions?.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                className="rounded-xl py-2.5 px-4 font-bold text-[10px] uppercase tracking-widest focus:bg-primary focus:text-primary-foreground cursor-pointer"
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      )}
    </div>
  );
}
