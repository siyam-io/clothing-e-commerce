"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe, Search, Plus, Trash2, HelpCircle, Zap } from "lucide-react";
import { swalToast, swalError } from "@/utils/swal";
import api from "@/lib/api";

export default function ManageSeoTab({ product, updateProduct }) {
  const { register, handleSubmit, setValue, control, getValues } = useForm();
  const [faqsList, setFaqsList] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAiGenerate = async () => {
    if (!product?.name) return;
    setIsGenerating(true);
    try {
      const { data } = await api.post("/admin/products/generate-ai-content", {
        name: product.name,
        categoryName: product.category?.name || "Apparel",
        brand: product.brand || getValues("brand") || ""
      });

      if (data?.success && data?.data) {
        const ai = data.data;
        setValue("metaTitle", ai.metaTitle || "", { shouldDirty: true });
        setValue("metaDescription", ai.metaDescription || "", { shouldDirty: true });
        setValue("keywords", ai.keywords || "", { shouldDirty: true });

        setValue("specifications.fit", ai.fit || "", { shouldDirty: true });
        setValue("specifications.sleeve", ai.sleeve || "", { shouldDirty: true });
        setValue("specifications.pattern", ai.pattern || "", { shouldDirty: true });
        setValue("specifications.collar", ai.collar || "", { shouldDirty: true });

        setValue("material", ai.material || "", { shouldDirty: true });
        setValue("color", ai.color || "", { shouldDirty: true });
        if (ai.gender) {
          setValue("gender", ai.gender, { shouldDirty: true });
        }

        setValue("description", ai.description || "", { shouldDirty: true });
        setValue("tags", Array.isArray(ai.tags) ? ai.tags.join(", ") : (ai.tags || ""), { shouldDirty: true });

        if (ai.faqs && Array.isArray(ai.faqs)) {
          setFaqsList(ai.faqs);
          setValue("faqs", ai.faqs, { shouldDirty: true });
        }

        swalToast("AI Generation Complete! Form populated.", "success");
      }
    } catch (err) {
      console.error(err);
      swalError("AI Generation Failed", err.response?.data?.message || err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (product) {
      setValue("metaTitle", product.seo?.metaTitle || "");
      setValue("metaDescription", product.seo?.metaDescription || "");
      setValue("keywords", product.seo?.keywords || "");

      setValue("sku", product.sku || "");
      setValue("gtin", product.gtin || "");
      setValue("brand", product.brand || "");
      setValue("material", product.material || "");
      setValue("color", product.color || "");
      setValue("gender", product.gender || "Unisex");
      setValue("description", product.description || "");
      setValue("tags", Array.isArray(product.tags) ? product.tags.join(", ") : "");

      setValue("specifications.fit", product.specifications?.fit || "");
      setValue("specifications.sleeve", product.specifications?.sleeve || "");
      setValue("specifications.pattern", product.specifications?.pattern || "");
      setValue("specifications.collar", product.specifications?.collar || "");

      const initialFaqs = product.faqs || [];
      setFaqsList(initialFaqs);
      setValue("faqs", initialFaqs);
    }
  }, [product, setValue]);

  const handleAddFaq = () => {
    const updated = [...faqsList, { question: "", answer: "" }];
    setFaqsList(updated);
    setValue("faqs", updated);
  };

  const handleFaqChange = (index, field, value) => {
    const updated = [...faqsList];
    updated[index][field] = value;
    setFaqsList(updated);
    setValue("faqs", updated);
  };

  const handleRemoveFaq = (index) => {
    const updated = faqsList.filter((_, i) => i !== index);
    setFaqsList(updated);
    setValue("faqs", updated);
  };

  const handleAutoGenerateSku = () => {
    if (!product?.name) return;
    const cleanName = product.name
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .trim()
      .toUpperCase();
    const words = cleanName.split(/\s+/);
    let prefix = "";
    if (words.length >= 2) {
      prefix = words.map(w => w[0]).join("").slice(0, 5);
    } else {
      prefix = words[0].slice(0, 5);
    }
    let brandPrefix = "";
    const brandVal = getValues("brand") || product.brand || "";
    if (brandVal) {
      brandPrefix = brandVal.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 3) + "-";
    }
    const idSuffix = product._id ? product._id.slice(-4).toUpperCase() : Math.floor(1000 + Math.random() * 9000);
    const generatedSku = `${brandPrefix}${prefix}-${idSuffix}`;
    setValue("sku", generatedSku, { shouldDirty: true });
  };

  const onSeoSubmit = async (data) => {
    try {
      await updateProduct({ 
        id: product._id, 
        data: { 
          description: data.description,
          tags: data.tags ? data.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
          seo: {
            metaTitle: data.metaTitle,
            metaDescription: data.metaDescription,
            keywords: data.keywords
          },
          sku: data.sku,
          gtin: data.gtin,
          brand: data.brand,
          material: data.material,
          color: data.color,
          gender: data.gender,
          specifications: {
            fit: data.specifications?.fit,
            sleeve: data.specifications?.sleeve,
            pattern: data.specifications?.pattern,
            collar: data.specifications?.collar
          },
          faqs: faqsList
        } 
      });
      swalToast("SEO and AEO specifications updated", "success");
    } catch (err) {
      swalError("Error", err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSeoSubmit)} className="p-0 space-y-12">
      <div className="space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 flex items-center justify-center border border-indigo-600/20">
              <Search size={20} className="text-indigo-600" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-[0.2em]">SEO Configuration</h3>
              <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-80">Optimize search engine snippet details</p>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleAiGenerate}
            disabled={isGenerating}
            className="h-12 px-6 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-widest text-[9px] hover:bg-indigo-700 shadow-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Zap size={14} className="fill-current text-white" />
            )}
            <span>Generate with AI</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Product Description</Label>
            <Textarea 
              placeholder="Detailed description of the product"
              {...register("description")}
              rows={4}
              className="bg-muted/30 border-border/10 rounded-3xl px-6 py-5 font-medium focus:ring-2 focus:ring-indigo-600/20 resize-none"
            />
          </div>

          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Product Tags (Comma separated)</Label>
            <Input 
              placeholder="e.g. t-shirt, summer, streetwear"
              {...register("tags")}
              className="h-16 bg-muted/30 border-border/10 rounded-2xl px-6 font-bold text-sm tracking-tight focus:ring-2 focus:ring-indigo-600/20"
            />
          </div>

          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Meta Title</Label>
            <Input 
              placeholder="Meta title for search engines"
              {...register("metaTitle")}
              className="h-16 bg-muted/30 border-border/10 rounded-2xl px-6 font-bold text-sm tracking-tight focus:ring-2 focus:ring-indigo-600/20"
            />
          </div>

          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Meta Description</Label>
            <Textarea 
              placeholder="Meta description for search engines"
              {...register("metaDescription")}
              rows={3}
              className="bg-muted/30 border-border/10 rounded-3xl px-6 py-5 font-medium focus:ring-2 focus:ring-indigo-600/20 resize-none"
            />
          </div>

          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Keywords (Comma separated)</Label>
            <Input 
              placeholder="clothing, fashion, t-shirt"
              {...register("keywords")}
              className="h-16 bg-muted/30 border-border/10 rounded-2xl px-6 font-bold text-sm tracking-tight focus:ring-2 focus:ring-indigo-600/20"
            />
          </div>
        </div>
      </div>

      {/* Answer Engine Optimization (AEO) & Specifications */}
      <div className="pt-8 border-t border-border/5 space-y-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 flex items-center justify-center border border-indigo-600/20">
            <Globe size={20} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.2em]">Specifications & Structured Data (AEO)</h3>
            <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-80">Provide product specifications for AI engines and rich snippets</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">SKU</Label>
              <button
                type="button"
                onClick={handleAutoGenerateSku}
                className="text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 transition-colors font-bold cursor-pointer"
              >
                Auto-Generate
              </button>
            </div>
            <Input 
              {...register("sku")}
              placeholder="e.g. VNG-TEE-BLK-L"
              className="h-16 bg-muted/30 border-border/10 rounded-2xl px-6 font-bold focus:ring-2 focus:ring-indigo-600/20"
            />
          </div>
          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">GTIN / Barcode (EAN, UPC)</Label>
            <Input 
              {...register("gtin")}
              placeholder="e.g. 0123456789012"
              className="h-16 bg-muted/30 border-border/10 rounded-2xl px-6 font-bold focus:ring-2 focus:ring-indigo-600/20"
            />
          </div>
          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Brand</Label>
            <Input 
              {...register("brand")}
              placeholder="e.g. Brand Name"
              className="h-16 bg-muted/30 border-border/10 rounded-2xl px-6 font-bold focus:ring-2 focus:ring-indigo-600/20"
            />
          </div>
          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Material</Label>
            <Input 
              {...register("material")}
              placeholder="e.g. 100% Cotton"
              className="h-16 bg-muted/30 border-border/10 rounded-2xl px-6 font-bold focus:ring-2 focus:ring-indigo-600/20"
            />
          </div>
          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Color</Label>
            <Input 
              {...register("color")}
              placeholder="e.g. Obsidian Black"
              className="h-16 bg-muted/30 border-border/10 rounded-2xl px-6 font-bold focus:ring-2 focus:ring-indigo-600/20"
            />
          </div>
          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Gender / Target Group</Label>
            <Controller
              name="gender"
              control={control}
              defaultValue="Unisex"
              render={({ field }) => (
                <Select value={field.value || "Unisex"} onValueChange={field.onChange}>
                  <SelectTrigger className="h-16 bg-muted/30 border-border/10 rounded-2xl px-6 font-black uppercase tracking-widest">
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border rounded-2xl p-2">
                    {['Men', 'Women', 'Unisex', 'Kids'].map((g) => (
                      <SelectItem key={g} value={g} className="rounded-xl py-3 font-black text-[10px] uppercase tracking-widest">
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        <div className="pt-6 border-t border-border/5 space-y-6">
          <h4 className="text-xs font-black uppercase tracking-[0.25em] text-muted-foreground">Technical Specifications</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Fit Type</Label>
              <Input 
                {...register("specifications.fit")}
                placeholder="e.g. Oversized"
                className="h-16 bg-muted/30 border-border/10 rounded-2xl px-6 font-bold focus:ring-2 focus:ring-indigo-600/20"
              />
            </div>
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Sleeve</Label>
              <Input 
                {...register("specifications.sleeve")}
                placeholder="e.g. Drop Shoulder"
                className="h-16 bg-muted/30 border-border/10 rounded-2xl px-6 font-bold focus:ring-2 focus:ring-indigo-600/20"
              />
            </div>
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Pattern</Label>
              <Input 
                {...register("specifications.pattern")}
                placeholder="e.g. Solid Color"
                className="h-16 bg-muted/30 border-border/10 rounded-2xl px-6 font-bold focus:ring-2 focus:ring-indigo-600/20"
              />
            </div>
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Collar</Label>
              <Input 
                {...register("specifications.collar")}
                placeholder="e.g. Crewneck"
                className="h-16 bg-muted/30 border-border/10 rounded-2xl px-6 font-bold focus:ring-2 focus:ring-indigo-600/20"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Answer Engine Optimization FAQ Page Schema (AEO) */}
      <div className="pt-8 border-t border-border/5 space-y-10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.2em]">Product FAQ Page Schema (AEO)</h3>
            <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-80">Supply targeted Q&As for direct answer engine retrieval</p>
          </div>
          <Button
            type="button"
            onClick={handleAddFaq}
            className="h-12 px-6 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-widest text-[9px] hover:bg-indigo-700 shadow-xl transition-all"
          >
            <Plus size={14} className="mr-2" /> Add FAQ Item
          </Button>
        </div>

        {faqsList.length === 0 ? (
          <div className="bg-muted/10 p-10 rounded-3xl border border-dashed border-border/10 text-center flex flex-col items-center gap-3">
             <HelpCircle size={32} className="opacity-10" strokeWidth={1.5} />
             <p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-30 italic">No FAQs added yet. AI search engines will fallback to general FAQs.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {faqsList.map((faq, idx) => (
              <div key={idx} className="bg-muted/10 border border-border/5 rounded-3xl p-6 md:p-8 space-y-6 relative group shadow-md hover:border-indigo-600/10 transition-all">
                <button
                  type="button"
                  onClick={() => handleRemoveFaq(idx)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-rose-600/10 text-rose-600 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                >
                  <Trash2 size={14} />
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground ml-1">Question {idx + 1}</Label>
                    <Input 
                      value={faq.question || ""}
                      onChange={(e) => handleFaqChange(idx, "question", e.target.value)}
                      placeholder="e.g. Is this fabric pre-shrunk?"
                      className="h-14 bg-background border-border/10 rounded-xl px-5 font-bold"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground ml-1">Answer {idx + 1}</Label>
                    <Textarea 
                      rows={2}
                      value={faq.answer || ""}
                      onChange={(e) => handleFaqChange(idx, "answer", e.target.value)}
                      placeholder="e.g. Yes, all our shirts are pre-shrunk to ensure perfect fit even after multiple washes."
                      className="bg-background border-border/10 rounded-xl px-5 py-3 font-medium resize-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="pt-6 border-t border-border/5 flex justify-end">
        <Button type="submit" className="h-16 px-10 bg-foreground text-background font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all">
          Update SEO & AEO Configuration
        </Button>
      </div>
    </form>
  );
}
