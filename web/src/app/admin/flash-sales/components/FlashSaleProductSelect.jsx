"use client";

import { Search, Package, Trash2, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getImageUrl } from "@/utils/imageUtils";
import { cn } from "@/lib/utils";
import { Price } from "@/components/common/Price";

export default function FlashSaleProductSelect({
  searchTerm,
  setSearchTerm,
  searchResults,
  isFetching,
  selectedProducts,
  toggleProductSelection,
  isEdit,
  isSaving = false,
}) {
  return (
    <div className="admin-table-form p-8 md:p-10 space-y-8 flex flex-col min-h-[600px]">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 flex items-center justify-center border border-indigo-600/20">
            <Package size={20} className="text-indigo-600" />
          </div>
          <h3 className="text-sm font-black uppercase tracking-[0.2em]">Add Products</h3>
        </div>
        <Badge variant="outline" className="h-8 px-4 rounded-full text-[9px] font-black border-indigo-600/20 text-indigo-600 uppercase tracking-widest bg-indigo-600/5">
          Selected Items: {selectedProducts.length}
        </Badge>
      </div>

      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground opacity-40" size={18} />
        <Input 
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-16 pl-14 bg-muted/20 border-border/10 rounded-2xl text-[11px] font-black uppercase tracking-widest"
        />
      </div>

      {/* Search Results */}
      {searchTerm.trim().length > 1 && (
        <div className="bg-muted/10 border border-border/5 rounded-[2rem] p-4 animate-in slide-in-from-top-2 duration-300">
          {isFetching ? (
            <div className="p-8 text-center text-[10px] font-black uppercase tracking-[0.3em] opacity-40 animate-pulse italic">Searching...</div>
          ) : searchResults?.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
              {searchResults.map((p) => {
                const isSelected = selectedProducts.some(sel => sel._id === p._id);
                return (
                  <div
                    key={p._id}
                    onClick={() => toggleProductSelection(p)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all border group",
                      isSelected 
                        ? "bg-foreground border-transparent" 
                        : "bg-background/40 border-border/5 hover:bg-muted/40"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <img src={getImageUrl(p.images?.[0])} className="h-10 w-10 rounded-lg object-cover grayscale group-hover:grayscale-0 transition-all" />
                      <div>
                        <p className={cn("text-[10px] font-black uppercase tracking-tight leading-none", isSelected ? "text-background" : "text-foreground")}>{p.name}</p>
                        <Price
                          amount={p.price}
                          className={cn("text-[8px] font-bold uppercase tracking-widest mt-1", isSelected ? "text-background/70" : "text-muted-foreground")}
                        />
                      </div>
                    </div>
                    {isSelected && <Badge className="bg-background text-foreground text-[8px] px-2 py-0.5 rounded-md">Added</Badge>}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-[10px] font-black uppercase tracking-[0.3em] opacity-40 italic">No Matches Found</div>
          )}
        </div>
      )}

      {/* Selected Matrix */}
      <div className="flex-1 bg-muted/20 rounded-[2.5rem] border border-border/5 p-6 overflow-hidden flex flex-col min-h-[300px]">
        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-6 px-2 italic">Products in this Sale</p>
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
          {selectedProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20 grayscale gap-4 py-12">
              <Package size={48} strokeWidth={1} />
              <p className="text-[10px] font-black uppercase tracking-[0.4em]">No Products Selected</p>
            </div>
          ) : (
            selectedProducts.map((p) => (
              <div key={p._id} className="flex items-center justify-between p-4 rounded-2xl bg-background shadow-xl border border-border/5 group">
                <div className="flex items-center gap-4">
                  <img src={getImageUrl(p.images?.[0])} className="h-12 w-12 rounded-xl object-cover grayscale group-hover:grayscale-0 transition-all" />
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-tight leading-none">{p.name}</p>
                    <Price
                      amount={p.price}
                      className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleProductSelection(p)}
                  className="w-10 h-10 rounded-full bg-rose-600/5 text-rose-600 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-sm border border-rose-600/10"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="pt-6">
        <Button
          type="submit"
          disabled={selectedProducts.length === 0 || isSaving}
          className="w-full h-20 bg-foreground text-background hover:bg-rose-600 hover:text-white rounded-[2rem] font-black uppercase tracking-[0.4em] text-[11px] shadow-2xl transition-all active:scale-95 group"
        >
          {isSaving ? "Saving..." : isEdit ? "Save Changes" : "Create Sale"}
          <ArrowRight size={18} className="ml-3 group-hover:translate-x-2 transition-transform" />
        </Button>
      </div>
    </div>
  );
}
