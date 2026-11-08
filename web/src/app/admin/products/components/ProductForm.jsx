"use client";

import { useState } from "react";
import { Controller, useFieldArray } from "react-hook-form";
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
import { Checkbox } from "@/components/ui/checkbox";
import AdminPageContainer from "@/app/admin/_components/AdminPageContainer";
import AdminPageHeader, { AdminBackLink } from "@/app/admin/_components/AdminPageHeader";
import { AdminCard, AdminCardHeader, AdminCardTitle, AdminCardDescription, AdminCardContent } from "@/app/admin/_components/AdminCard";
import { 
  Camera, 
  X, 
  Package, 
  Layers, 
  Zap, 
  ShieldAlert, 
  Settings,
  Globe,
  Plus,
  Trash2,
  HelpCircle,
  Loader2
} from "lucide-react";

export default function ProductForm({
  register,
  handleSubmit,
  onSubmit,
  setValue,
  watch,
  control,
  isEdit,
  categories,
  filteredSubcategories,
  filteredSizes,
  imagePreviews,
  handleFileChange,
  removeLocalImage,
  isSubmitting,
  router,
}) {
  const watchedCategory = watch("category");
  const { fields: faqsList, append: appendFaq, remove: removeFaq } = useFieldArray({
    control,
    name: "faqs",
  });

  return (
    <AdminPageContainer maxWidth="max-w-5xl">
      <AdminBackLink href="/admin/products" label="Back to Products" />
      <AdminPageHeader
        title={isEdit ? "Edit Product" : "New Product"}
        description={isEdit ? "Update product specifications, images, and inventory" : "Add a new product to your catalog"}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <AdminCard>
          <AdminCardHeader>
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Package className="size-4" />
              </div>
              <div>
                <AdminCardTitle>Basic Information</AdminCardTitle>
                <AdminCardDescription>General product details and taxonomy</AdminCardDescription>
              </div>
            </div>
          </AdminCardHeader>

          <AdminCardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                Product Name <span className="text-rose-500">*</span>
              </Label>
              <Input 
                {...register("name", { required: true })}
                placeholder="e.g. Minimalist Cotton Tee"
                className="h-10 rounded-xl bg-background/80 border-border/60 text-sm font-medium"
              />
              <input type="hidden" {...register("slug")} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Description</Label>
              <Textarea 
                rows={4}
                {...register("description")}
                placeholder="Describe product highlights, fabric, fit, and styling tips..."
                className="bg-background/80 border-border/60 rounded-xl px-4 py-3 text-sm resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">
                  Category <span className="text-rose-500">*</span>
                </Label>
                <Controller
                  name="category"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select 
                      value={field.value || ""} 
                      onValueChange={(val) => {
                        field.onChange(val);
                        setValue("subcategory", "");
                      }}
                    >
                      <SelectTrigger className="h-10 bg-background/80 border-border/60 rounded-xl text-xs">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border rounded-xl">
                        {categories?.map((c) => (
                          <SelectItem key={c._id} value={c._id} className="text-xs">
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Subcategory</Label>
                <Controller
                  name="subcategory"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value || ""} onValueChange={field.onChange}>
                      <SelectTrigger className="h-10 bg-background/80 border-border/60 rounded-xl text-xs">
                        <SelectValue placeholder="Select Subcategory" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border rounded-xl">
                        {filteredSubcategories.map((s) => (
                          <SelectItem key={s._id} value={s._id} className="text-xs">
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </AdminCardContent>
        </AdminCard>

        {/* Pricing */}
        <AdminCard>
          <AdminCardHeader>
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Zap className="size-4" />
              </div>
              <div>
                <AdminCardTitle>Pricing & Discounts</AdminCardTitle>
                <AdminCardDescription>Set the retail price and any active sale discount</AdminCardDescription>
              </div>
            </div>
          </AdminCardHeader>

          <AdminCardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">
                  Regular Price (৳) <span className="text-rose-500">*</span>
                </Label>
                <Input 
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register("price", { required: true, valueAsNumber: true })}
                  className="h-10 bg-background/80 border-border/60 rounded-xl px-3.5 text-base font-semibold tabular-nums"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Discount Percentage (%)</Label>
                <Input 
                  type="number"
                  placeholder="0"
                  min="0"
                  max="100"
                  {...register("discount", { valueAsNumber: true })}
                  className="h-10 bg-background/80 border-border/60 rounded-xl px-3.5 text-base font-semibold tabular-nums text-emerald-600 dark:text-emerald-400"
                />
              </div>
            </div>
          </AdminCardContent>
        </AdminCard>

        {/* Images */}
        <AdminCard>
          <AdminCardHeader>
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Camera className="size-4" />
              </div>
              <div>
                <AdminCardTitle>Product Media</AdminCardTitle>
                <AdminCardDescription>Upload up to 5 high-resolution product photos</AdminCardDescription>
              </div>
            </div>
          </AdminCardHeader>

          <AdminCardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
              {imagePreviews.map((img, idx) => (
                <div key={idx} className="relative aspect-[3/4] rounded-xl overflow-hidden border border-border/60 group bg-muted/40 shadow-xs">
                  <img src={img} alt="Product preview" className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105" />
                  <button
                    type="button"
                    onClick={() => removeLocalImage(idx)}
                    className="absolute top-2 right-2 size-7 rounded-lg bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-rose-700"
                    title="Remove image"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
              {imagePreviews.length < 5 && (
                <label className="relative aspect-[3/4] rounded-xl border-2 border-dashed border-border/80 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/40 transition-colors group">
                  <Camera className="size-6 text-muted-foreground group-hover:text-foreground transition-colors mb-2" />
                  <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">Upload Image</span>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" multiple />
                </label>
              )}
            </div>
          </AdminCardContent>
        </AdminCard>

        {/* Stock by Size */}
        <AdminCard>
          <AdminCardHeader>
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Layers className="size-4" />
              </div>
              <div>
                <AdminCardTitle>Inventory by Size</AdminCardTitle>
                <AdminCardDescription>Configure stock quantities for each available size</AdminCardDescription>
              </div>
            </div>
          </AdminCardHeader>

          <AdminCardContent>
            {!watchedCategory ? (
              <div className="p-8 rounded-xl border border-dashed border-border/80 text-center flex flex-col items-center justify-center">
                <Package className="size-8 text-muted-foreground/40 mb-2" />
                <p className="text-xs font-medium text-muted-foreground">Select a category above to view and assign sizes.</p>
              </div>
            ) : filteredSizes.length === 0 ? (
              <div className="p-8 rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 text-center flex flex-col items-center justify-center">
                <ShieldAlert className="size-8 text-amber-500/50 mb-2" />
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400">No sizes have been assigned to this category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {filteredSizes.map((size) => (
                  <div key={size._id} className="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground text-center">{size.name}</p>
                    <Input 
                      type="number"
                      min={0}
                      defaultValue={0}
                      {...register(`sizes.${size._id}`, { valueAsNumber: true })}
                      className="h-9 bg-background/80 border-border/60 rounded-lg text-center text-sm font-semibold tabular-nums"
                    />
                  </div>
                ))}
              </div>
            )}
          </AdminCardContent>
        </AdminCard>

        {/* SEO & Specifications */}
        <AdminCard>
          <AdminCardHeader>
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-600 dark:text-sky-400">
                <Globe className="size-4" />
              </div>
              <div>
                <AdminCardTitle>Specifications & SEO</AdminCardTitle>
                <AdminCardDescription>Search engine optimization and structured attributes</AdminCardDescription>
              </div>
            </div>
          </AdminCardHeader>

          <AdminCardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">SKU</Label>
                <Input 
                  {...register("sku")}
                  placeholder="e.g. TEE-BLK-L"
                  className="h-10 rounded-xl bg-background/80 border-border/60 text-xs font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Barcode / GTIN</Label>
                <Input 
                  {...register("gtin")}
                  placeholder="e.g. 0123456789012"
                  className="h-10 rounded-xl bg-background/80 border-border/60 text-xs font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Brand</Label>
                <Input 
                  {...register("brand")}
                  placeholder="e.g. Vintage Apparel"
                  className="h-10 rounded-xl bg-background/80 border-border/60 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Material</Label>
                <Input 
                  {...register("material")}
                  placeholder="e.g. 100% Organic Cotton"
                  className="h-10 rounded-xl bg-background/80 border-border/60 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Color</Label>
                <Input 
                  {...register("color")}
                  placeholder="e.g. Jet Black"
                  className="h-10 rounded-xl bg-background/80 border-border/60 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Target Demographic</Label>
                <Controller
                  name="gender"
                  control={control}
                  defaultValue="Unisex"
                  render={({ field }) => (
                    <Select value={field.value || "Unisex"} onValueChange={field.onChange}>
                      <SelectTrigger className="h-10 bg-background/80 border-border/60 rounded-xl text-xs">
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border rounded-xl">
                        {['Men', 'Women', 'Unisex', 'Kids'].map((g) => (
                          <SelectItem key={g} value={g} className="text-xs">
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border/40 space-y-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Search Engine Metadata</h4>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">Meta Title</Label>
                  <Input 
                    {...register("seo.metaTitle")}
                    placeholder="e.g. Minimalist Cotton Tee | Premium Streetwear"
                    className="h-10 rounded-xl bg-background/80 border-border/60 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">Meta Description</Label>
                  <Textarea 
                    rows={2}
                    {...register("seo.metaDescription")}
                    placeholder="Brief description for search engine previews..."
                    className="bg-background/80 border-border/60 rounded-xl px-3.5 py-2.5 text-xs resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">Keywords (comma separated)</Label>
                  <Input 
                    {...register("seo.keywords")}
                    placeholder="e.g. t-shirt, streetwear, organic cotton"
                    className="h-10 rounded-xl bg-background/80 border-border/60 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* FAQs */}
            <div className="pt-4 border-t border-border/40 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Frequently Asked Questions (FAQ)</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendFaq({ question: "", answer: "" })}
                  className="h-8 px-3 rounded-lg text-xs font-medium gap-1.5"
                >
                  <Plus className="size-3.5" /> Add Question
                </Button>
              </div>

              {faqsList.length === 0 ? (
                <div className="p-6 rounded-xl border border-dashed border-border/80 text-center flex flex-col items-center justify-center">
                  <HelpCircle className="size-6 text-muted-foreground/40 mb-1.5" />
                  <p className="text-xs text-muted-foreground">No custom FAQs yet. General store FAQs will be used.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {faqsList.map((faq, idx) => (
                    <div key={faq.id || idx} className="p-4 rounded-xl border border-border/60 bg-muted/20 relative space-y-3">
                      <button
                        type="button"
                        onClick={() => removeFaq(idx)}
                        className="absolute top-3 right-3 text-muted-foreground hover:text-rose-500 transition-colors p-1"
                        title="Remove FAQ"
                      >
                        <Trash2 className="size-4" />
                      </button>
                      <div className="space-y-1.5 pr-8">
                        <Label className="text-xs font-medium text-foreground">Question {idx + 1}</Label>
                        <Input 
                          {...register(`faqs.${idx}.question`)}
                          placeholder="e.g. Is this fabric pre-shrunk?"
                          className="h-9 bg-background/80 border-border/60 rounded-lg text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-foreground">Answer</Label>
                        <Textarea 
                          rows={2}
                          {...register(`faqs.${idx}.answer`)}
                          placeholder="e.g. Yes, pre-shrunk for a consistent fit after washing."
                          className="bg-background/80 border-border/60 rounded-lg text-xs resize-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </AdminCardContent>
        </AdminCard>

        {/* Visibility & Settings */}
        <AdminCard>
          <AdminCardHeader>
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-muted flex items-center justify-center text-foreground">
                <Settings className="size-4" />
              </div>
              <div>
                <AdminCardTitle>Visibility & Attributes</AdminCardTitle>
                <AdminCardDescription>Product status and customer-facing flags</AdminCardDescription>
              </div>
            </div>
          </AdminCardHeader>

          <AdminCardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Tags (comma-separated)</Label>
              <Input 
                {...register("tags")}
                placeholder="summer, oversized, premium"
                className="h-10 bg-background/80 border-border/60 rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <label className="flex items-center gap-3 p-3.5 rounded-xl border border-border/60 bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors">
                <Checkbox 
                  id="isActive" 
                  checked={watch("isActive")} 
                  onCheckedChange={(val) => setValue("isActive", val)}
                  className="rounded-md"
                />
                <div>
                  <p className="text-xs font-medium text-foreground">Active Status</p>
                  <p className="text-[11px] text-muted-foreground">Visible in public store</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3.5 rounded-xl border border-border/60 bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors">
                <Checkbox 
                  id="isFeatured" 
                  checked={watch("isFeatured")} 
                  onCheckedChange={(val) => setValue("isFeatured", val)}
                  className="rounded-md"
                />
                <div>
                  <p className="text-xs font-medium text-foreground">Featured</p>
                  <p className="text-[11px] text-muted-foreground">Pin to homepage collections</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3.5 rounded-xl border border-border/60 bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors">
                <Checkbox 
                  id="showReviews" 
                  checked={watch("showReviews")} 
                  onCheckedChange={(val) => setValue("showReviews", val)}
                  className="rounded-md"
                />
                <div>
                  <p className="text-xs font-medium text-foreground">Customer Reviews</p>
                  <p className="text-[11px] text-muted-foreground">Enable rating submissions</p>
                </div>
              </label>
            </div>
          </AdminCardContent>

          <div className="flex items-center justify-end gap-3 p-5 border-t border-border/40 bg-muted/20">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/products")}
              disabled={isSubmitting}
              className="h-10 px-5 rounded-xl text-xs font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 px-6 rounded-xl text-xs font-medium gap-2 shadow-xs cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                isEdit ? "Update Product" : "Create Product"
              )}
            </Button>
          </div>
        </AdminCard>
      </form>
    </AdminPageContainer>
  );
}
